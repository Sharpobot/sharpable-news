import { inngest } from './inngest.js'
import { createAdminSupabaseClient } from './db/supabase-admin.js'
import { trendScout }     from './agents/trend-scout.js'
import { topicSelector }  from './agents/topic-selector.js'
import { topicOptions }   from './agents/topic-options.js'
import { deepResearcher } from './agents/deep-researcher.js'
import { articleWriter }  from './agents/article-writer.js'
import { seoMetadata }    from './agents/seo-metadata.js'
import { imageBrief }     from './agents/image-brief.js'
import { qualityChecker } from './agents/quality-checker.js'
import { revisionAgent }  from './agents/revision.js'

/* ──────────────────────────────────────────────────────────────
   SEARCH TOPICS — runs agents 1+2 only, saves 3 options to DB
   Triggered by POST /api/generate-topics
────────────────────────────────────────────────────────────── */
export const searchTopics = inngest.createFunction(
  { id: 'search-topics', name: 'Search Topics', triggers: [{ event: 'article/search-topics' }], retries: 1 },
  async ({ event, step }) => {
    const { articleId, topicDirection = null } = event.data

    const db = createAdminSupabaseClient()

    async function startProg(name, msg) {
      const { data } = await db.from('article_generation_progress')
        .insert({ article_id: articleId, agent_name: name, status: 'running', message: msg })
        .select('id').single()
      return data?.id ?? null
    }
    async function endProg(id, status, msg) {
      if (!id) return
      await db.from('article_generation_progress').update({ status, message: msg }).eq('id', id)
    }

    // Fetch recent articles for dedup
    const existingArticles = await step.run('fetch-existing-articles', async () => {
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await db.from('articles').select('title, slug')
        .eq('status', 'published').gte('created_at', cutoff)
        .order('created_at', { ascending: false }).limit(30)
      return data ?? []
    })

    // Step 1: Trend Scout
    const ctx1 = await step.run('trend-scout', async () => {
      const pid = await startProg('trend-scout', topicDirection
        ? `Mencari topik berkaitan "${topicDirection}"…`
        : 'Mencari topik trending…')
      try {
        const ctx = await trendScout({}, topicDirection)
        await endProg(pid, 'done', `Dijumpai ${ctx.trends?.length ?? 0} topik trending`)
        return ctx
      } catch (err) { await endProg(pid, 'failed', err.message); throw err }
    })

    await step.sleep('wait-after-trend-scout', '65s')

    // Step 2: Generate 3 topic options
    const ctx2 = await step.run('topic-selector', async () => {
      const pid = await startProg('topic-selector', 'Memilih 3 topik terbaik untuk pentadbir…')
      try {
        const ctx = await topicOptions({ ...ctx1, existingArticles })
        await endProg(pid, 'done', `${ctx.topicOptions?.length ?? 0} pilihan topik sedia`)
        return ctx
      } catch (err) { await endProg(pid, 'failed', err.message); throw err }
    })

    // Save options to DB — admin will choose via UI
    await step.run('save-topic-options', async () => {
      await db.from('articles').update({
        status: 'awaiting_topic_selection',
        topic_options: ctx2.topicOptions ?? [],
      }).eq('id', articleId)
    })

    return { success: true, topicOptions: ctx2.topicOptions ?? [] }
  }
)

/** Inject imagePlaceholder nodes into TipTap JSON at specified paragraph positions */
function injectImagePlaceholders(bodyJson, suggestions) {
  if (!bodyJson?.content || !Array.isArray(suggestions) || !suggestions.length) return bodyJson
  const result = { ...bodyJson, content: [] }
  let paragraphCount = 0
  for (const node of bodyJson.content) {
    result.content.push(node)
    if (node.type === 'paragraph') {
      paragraphCount++
      for (const sug of suggestions) {
        if (sug.paragraphIndex === paragraphCount) {
          result.content.push({
            type: 'imagePlaceholder',
            attrs: { description: sug.description ?? '', placement: `after-paragraph-${paragraphCount}` },
          })
        }
      }
    }
  }
  return result
}

export const generateArticle = inngest.createFunction(
  {
    id: 'generate-article',
    name: 'Generate Article',
    triggers: [{ event: 'article/generate' }],
    retries: 1,
  },
  async ({ event, step, attempt }) => {
    const { articleId, preSelectedTopic = null } = event.data

    // ── Progress helpers ────────────────────────────────────────
    async function startProgress(agentName, message) {
      const db = createAdminSupabaseClient()
      const { data, error } = await db
        .from('article_generation_progress')
        .insert({ article_id: articleId, agent_name: agentName, status: 'running', message })
        .select('id')
        .single()
      if (error) console.error(`[progress] insert error for ${agentName}:`, error.message)
      return data?.id ?? null
    }

    async function endProgress(progressId, status, message) {
      if (!progressId) return
      const db = createAdminSupabaseClient()
      const { error } = await db
        .from('article_generation_progress')
        .update({ status, message })
        .eq('id', progressId)
      if (error) console.error(`[progress] update error:`, error.message)
    }

    // ── All pipeline errors bubble up here for permanent-failure handling ──
    try {

    // ── Pre-fetch recent articles for topic deduplication ───────
    // Fetch titles + slugs published in the last 14 days (outside a step,
    // it's a cheap DB read that happens every replay — this is intentional).
    const existingArticles = await step.run('fetch-existing-articles', async () => {
      const db = createAdminSupabaseClient()
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      const { data } = await db
        .from('articles')
        .select('title, slug')
        .eq('status', 'published')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(30)
      return data ?? []
    })

    // ── Steps 1+2: Topic Discovery ──────────────────────────────
    // If preSelectedTopic is provided (human-in-the-loop), skip discovery.
    // Otherwise run trend-scout + topic-selector with dedup retry.
    const MAX_ATTEMPTS = 3
    let ctx2 = null

    if (preSelectedTopic) {
      // Admin already chose a topic — write a synthetic progress row and skip to step 3
      await step.run('topic-selected', async () => {
        const db = createAdminSupabaseClient()
        const { data } = await db.from('article_generation_progress')
          .insert({ article_id: articleId, agent_name: 'topic-selector', status: 'done',
            message: `Topik dipilih oleh pentadbir: ${preSelectedTopic.topic}` })
          .select('id').single()
        return data?.id ?? null
      })
      ctx2 = {
        trends: [], scoutedAt: new Date().toISOString().split('T')[0],
        selectedTopic: {
          topic: preSelectedTopic.topic,
          description: preSelectedTopic.summary,
          category: preSelectedTopic.category,
          keywords: [],
        },
        articleAngle: preSelectedTopic.angle,
        isDuplicate: false, similarArticles: [],
        existingArticles: existingArticles,
      }
    } else
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const suffix = attempt === 0 ? '' : `-retry-${attempt}`

      // Step 1: Trend Scout
      const ctx1 = await step.run(`trend-scout${suffix}`, async () => {
        const pid = await startProgress('trend-scout', attempt === 0
          ? 'Mencari topik trending…'
          : `Mencari topik trending (percubaan ${attempt + 1})…`)
        try {
          const ctx = await trendScout({})
          await endProgress(pid, 'done', `Dijumpai ${ctx.trends?.length ?? 0} topik trending`)
          return ctx
        } catch (err) {
          await endProgress(pid, 'failed', err.message)
          throw err
        }
      })

      await step.sleep(`wait-after-trend-scout${suffix}`, '65s')

      // Step 2: Topic Selector (with existing articles for dedup)
      const ctx2Candidate = await step.run(`topic-selector${suffix}`, async () => {
        const pid = await startProgress('topic-selector',
          attempt === 0
            ? 'Memilih topik terbaik untuk pembaca Malaysia…'
            : `Memilih topik baharu (percubaan ${attempt + 1})…`)
        try {
          const ctx = await topicSelector({ ...ctx1, existingArticles })
          if (ctx.isDuplicate) {
            await endProgress(pid, 'done', 'Semua topik terlalu serupa — mencuba semula…')
          } else {
            await endProgress(pid, 'done', `Topik dipilih: ${ctx.selectedTopic?.topic ?? '(tiada)'}`)
          }
          return ctx
        } catch (err) {
          await endProgress(pid, 'failed', err.message)
          throw err
        }
      })

      if (!ctx2Candidate.isDuplicate) {
        ctx2 = ctx2Candidate
        break
      }

      // Last attempt — still duplicate, fail the job
      if (attempt === MAX_ATTEMPTS - 1) {
        const db = createAdminSupabaseClient()
        await db.from('articles').update({
          status: 'failed',
          quality_flags: { verdict: 'reject', error: 'Tiada topik baharu dijumpai — cuba lagi esok.' },
        }).eq('id', articleId)
        throw new Error('Tiada topik baharu dijumpai — cuba lagi esok.')
      }

      // Sleep before next attempt
      await step.sleep(`wait-before-retry-${attempt + 1}`, '65s')
    }

    // ── Step 3: Deep Researcher ─────────────────────────────────
    const ctx3 = await step.run('deep-researcher', async () => {
      const pid = await startProgress('deep-researcher', 'Menjalankan penyelidikan mendalam...')
      try {
        const ctx = await deepResearcher(ctx2)
        const factCount = ctx.researchBrief?.keyFacts?.length ?? 0
        await endProgress(pid, 'done', `Brief siap — ${factCount} fakta utama dikumpul`)
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    await step.sleep('wait-after-deep-researcher', '65s')

    // ── Step 4: Article Writer ──────────────────────────────────
    const ctx4 = await step.run('article-writer', async () => {
      const pid = await startProgress('article-writer', 'Menulis artikel dalam Bahasa Malaysia...')
      try {
        const ctx = await articleWriter(ctx3)
        const words = ctx.article?.wordCount ?? 0
        await endProgress(pid, 'done', `Artikel siap — ${words} patah perkataan`)
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    await step.sleep('wait-after-article-writer', '65s')

    // ── Step 5: SEO Metadata ────────────────────────────────────
    const ctx5 = await step.run('seo-metadata', async () => {
      const pid = await startProgress('seo-metadata', 'Menjana metadata SEO...')
      try {
        const ctx = await seoMetadata(ctx4)
        await endProgress(pid, 'done', `Slug: ${ctx.seo?.slug ?? '(tiada)'}`)
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    await step.sleep('wait-after-seo-metadata', '65s')

    // ── Step 6: Image Brief ─────────────────────────────────────
    const ctx6 = await step.run('image-brief', async () => {
      const pid = await startProgress('image-brief', 'Menyediakan brief imej...')
      try {
        const ctx = await imageBrief(ctx5)
        await endProgress(pid, 'done', 'Brief imej hero dan inline siap')
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    await step.sleep('wait-after-image-brief', '65s')

    // ── Step 7: Quality Checker ────────────────────────────────
    const ctx7 = await step.run('quality-checker', async () => {
      const pid = await startProgress('quality-checker', 'Menyemak kualiti dan fakta...')
      try {
        const ctx = await qualityChecker(ctx6)
        const score   = ctx.qualityReport?.overallScore ?? 0
        const verdict = ctx.qualityReport?.verdict ?? 'unknown'
        await endProgress(pid, 'done', `Skor: ${score}/100 — ${verdict}`)
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    // ── Steps 8–10 (conditional): Revision + re-check loop ────
    // Run revision if score < 85 or verdict is not publish.
    // After revision 1, re-check quality. If still < 85, run revision 2.
    // Maximum 2 revision attempts before accepting whatever score was achieved.
    let ctxFinal = ctx7
    const PUBLISH_THRESHOLD = 85

    const needsRevision = (qr) =>
      qr?.verdict !== 'publish' || (qr?.overallScore ?? 0) < PUBLISH_THRESHOLD

    if (needsRevision(ctx7.qualityReport)) {
      await step.sleep('wait-before-revision', '65s')

      const ctx8 = await step.run('revision-agent', async () => {
        const pid = await startProgress('revision-agent', 'Membaiki artikel berdasarkan semakan kualiti...')
        try {
          const ctx = await revisionAgent(ctx7)
          const fixes = ctx.revisionCorrectionsMade?.length ?? 0
          await endProgress(pid, 'done', `${fixes} pembetulan dibuat`)
          return ctx
        } catch (err) {
          await endProgress(pid, 'failed', err.message)
          throw err
        }
      })

      // ── Re-check quality after revision 1 ──
      await step.sleep('wait-before-quality-check-2', '65s')

      const ctx9 = await step.run('quality-checker-2', async () => {
        const pid = await startProgress('quality-checker', 'Semakan kualiti ke-2 selepas pembetulan...')
        try {
          const ctx = await qualityChecker(ctx8)
          const score   = ctx.qualityReport?.overallScore ?? 0
          const verdict = ctx.qualityReport?.verdict ?? 'unknown'
          await endProgress(pid, 'done', `Skor semakan ke-2: ${score}/100 — ${verdict}`)
          return ctx
        } catch (err) {
          await endProgress(pid, 'failed', err.message)
          throw err
        }
      })

      // ── Revision 2 if still below threshold ──
      if (needsRevision(ctx9.qualityReport)) {
        await step.sleep('wait-before-revision-2', '65s')

        const ctx10 = await step.run('revision-agent-2', async () => {
          const pid = await startProgress('revision-agent', 'Semakan semula ke-2 untuk mencapai 85+...')
          try {
            const ctx = await revisionAgent({
              ...ctx9,
              // Pass the second quality report for richer context
              qualityReport: ctx9.qualityReport,
            })
            const fixes = ctx.revisionCorrectionsMade?.length ?? 0
            await endProgress(pid, 'done', `Semakan ke-2 selesai — ${fixes} pembetulan`)
            return ctx
          } catch (err) {
            await endProgress(pid, 'failed', err.message)
            throw err
          }
        })

        ctxFinal = {
          ...ctx10,
          originalQualityReport: ctx7.qualityReport,
          revisionCorrectionsMade: [
            ...(ctx8.revisionCorrectionsMade ?? []),
            ...(ctx10.revisionCorrectionsMade ?? []),
          ],
        }
      } else {
        ctxFinal = {
          ...ctx9,
          originalQualityReport: ctx7.qualityReport,
        }
      }
    }

    // ── Save to Supabase ────────────────────────────────────────
    await step.run('save-article', async () => {
      const savePid = await startProgress('save-article', 'Menyimpan artikel ke pangkalan data...')
      try {

      const db = createAdminSupabaseClient()

      // ── Inject ImagePlaceholder nodes at suggested paragraph positions ──
      const bodyWithPlaceholders = injectImagePlaceholders(
        ctxFinal.article?.body,
        ctxFinal.images?.suggestions
      )

      // ── Core fields (always required — will throw if these fail) ──
      const coreUpdate = {
        title:            ctxFinal.article?.headlines?.[0] ?? null,
        slug:             ctxFinal.seo?.slug ?? null,
        body:             bodyWithPlaceholders ?? null,
        meta_description: ctxFinal.seo?.metaDescription ?? null,
        headline_options: ctxFinal.article?.headlines ?? [],
        tags:             ctxFinal.seo?.tags ?? [],

        // Hero image prompt shown in the editor's Cadangan AI card
        image_brief: ctxFinal.images?.heroImage
          ? `${ctxFinal.images.heroImage.prompt} | Query: ${ctxFinal.images.heroImage.unsplashQuery}`
          : null,

        quality_flags: {
          verdict:           ctxFinal.qualityReport?.verdict ?? null,
          overall_score:     ctxFinal.qualityReport?.overallScore ?? null,
          publish_readiness: ctxFinal.qualityReport?.publishReadiness ?? null,
          required_fixes:    ctxFinal.qualityReport?.requiredFixes ?? [],
          checks:            ctxFinal.qualityReport?.checks ?? {},
          corrections_made:  ctxFinal.revisionCorrectionsMade ?? [],
        },

        sources: (ctxFinal.researchBrief?.suggestedSources ?? []).map((s) => ({
          title: s.outlet,
          url: s.url ?? null,
          description: s.description,
        })),

        status: 'ready_to_review',
      }

      const { error: coreError } = await db
        .from('articles')
        .update(coreUpdate)
        .eq('id', articleId)

      if (coreError) throw new Error(`Failed to save article: ${coreError.message}`)

      // ── Optional fields (audit columns added by migrations 003 + 004)
      // These columns may not exist yet if migrations haven't been applied.
      // Failures here are non-fatal — the article is already marked ready_to_review.
      const optionalUpdate = {}

      if (ctxFinal.originalQualityReport) {
        optionalUpdate.original_quality_flags = {
          verdict:           ctxFinal.originalQualityReport.verdict,
          overall_score:     ctxFinal.originalQualityReport.overallScore,
          publish_readiness: ctxFinal.originalQualityReport.publishReadiness,
          required_fixes:    ctxFinal.originalQualityReport.requiredFixes ?? [],
          checks:            ctxFinal.originalQualityReport.checks ?? {},
        }
      }

      if (ctx2.similarArticles?.length > 0) {
        optionalUpdate.similar_articles = ctx2.similarArticles
      }

      if (Object.keys(optionalUpdate).length > 0) {
        const { error: optError } = await db
          .from('articles')
          .update(optionalUpdate)
          .eq('id', articleId)
        if (optError) {
          // Non-fatal: optional columns may not exist until migrations are applied
          console.warn('[save-article] optional columns skipped (migration pending):', optError.message)
        }
      }

      await endProgress(savePid, 'done', 'Artikel siap untuk semakan')
      return { saved: true, articleId }
      } catch (err) {
        await endProgress(savePid, 'failed', err.message)
        throw err
      }
    })

    return {
      success: true,
      articleId,
      title: ctxFinal.article?.headlines?.[0] ?? null,
      slug:  ctxFinal.seo?.slug ?? null,
      verdict: ctxFinal.qualityReport?.verdict ?? null,
    }

    } catch (err) {
      // ── Permanent failure handler (fires on the last Inngest retry) ──
      // attempt 0 = first run, attempt 1 = retry (last with retries:1)
      if (attempt >= 1) {
        try {
          const failDb = createAdminSupabaseClient()

          // Mark article as failed so it doesn't stay stuck as 'generating'
          await failDb.from('articles').update({
            status: 'failed',
            quality_flags: {
              verdict: 'reject',
              error: err.message ?? 'Pipeline gagal — cuba jana semula.',
            },
          }).eq('id', articleId)

          // Fetch which agents already have progress rows
          const { data: existingRows } = await failDb
            .from('article_generation_progress')
            .select('agent_name')
            .eq('article_id', articleId)
          const existingNames = new Set((existingRows ?? []).map(r => r.agent_name))

          // Write 'failed' rows for every agent that never ran so the
          // JanaClient completion check triggers and removes the stuck card
          const ALL_AGENT_KEYS = [
            'trend-scout', 'topic-selector', 'deep-researcher', 'article-writer',
            'seo-metadata', 'image-brief', 'quality-checker', 'revision-agent', 'save-article',
          ]
          const pending = ALL_AGENT_KEYS.filter(k => !existingNames.has(k))
          if (pending.length > 0) {
            await failDb.from('article_generation_progress').insert(
              pending.map(agent_name => ({
                article_id: articleId,
                agent_name,
                status: 'failed',
                message: 'Pipeline gagal sebelum langkah ini dijalankan',
              }))
            )
          }
        } catch (markErr) {
          console.error('[generate] Failed to mark permanent failure:', markErr.message)
        }
      }
      throw err
    }
  }
)
