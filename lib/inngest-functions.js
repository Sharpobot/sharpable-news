import { inngest } from './inngest.js'
import { createAdminSupabaseClient } from './db/supabase-admin.js'
import { trendScout }     from './agents/trend-scout.js'
import { topicSelector }  from './agents/topic-selector.js'
import { deepResearcher } from './agents/deep-researcher.js'
import { articleWriter }  from './agents/article-writer.js'
import { seoMetadata }    from './agents/seo-metadata.js'
import { imageBrief }     from './agents/image-brief.js'
import { qualityChecker } from './agents/quality-checker.js'
import { revisionAgent }  from './agents/revision.js'


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
            attrs: {
              description: sug.description ?? '',
              placement:   `after-paragraph-${paragraphCount}`,
              altText:     sug.altText   ?? '',
              caption:     sug.caption   ?? '',
            },
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
    const { articleId, topicDirection } = event.data

    // ── Pipeline failure counter — abort if 3+ agents fail ──────
    let pipelineFailures = 0
    function checkFailureLimit(err) {
      pipelineFailures++
      if (pipelineFailures >= 3) {
        throw new Error(`Pipeline aborted: ${pipelineFailures} agents failed. Last: ${err.message}`)
      }
      throw err
    }

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

    // ── Pre-fetch recent articles for topic dedup awareness ─────
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

    // ── Agent 1: Trend Scout ────────────────────────────────────
    const ctx1 = await step.run('trend-scout', async () => {
      const pid = await startProgress('trend-scout', 'Mencari topik trending…')
      try {
        const ctx = await trendScout({}, topicDirection ?? null)
        await endProgress(pid, 'done', `Dijumpai ${ctx.trends?.length ?? 0} topik trending`)
        return ctx
      } catch (err) { await endProgress(pid, 'failed', err.message); checkFailureLimit(err) }
    })

    await step.sleep('wait-after-trend-scout', '65s')

    // ── Agent 2: Topic Selector (returns 3 options) ─────────────
    const ctx2 = await step.run('topic-selector', async () => {
      const pid = await startProgress('topic-selector', 'Menyediakan 3 pilihan topik untuk editor…')
      try {
        const ctx = await topicSelector({ ...ctx1, existingArticles })
        await endProgress(pid, 'done', `${ctx.topicOptions?.length ?? 0} pilihan topik siap`)
        return ctx
      } catch (err) { await endProgress(pid, 'failed', err.message); checkFailureLimit(err) }
    })

    await step.sleep('wait-after-topic-selector', '65s')

    // ── Fail fast if no topics were found ──────────────────────
    if (!ctx2.topicOptions || ctx2.topicOptions.length === 0) {
      const db = createAdminSupabaseClient()
      await db.from('articles').update({
        status: 'failed',
        quality_flags: { verdict: 'reject', error: 'Tiada topik trending dijumpai — cuba lagi sebentar.' },
      }).eq('id', articleId)
      throw new Error('Tiada topik trending dijumpai — cuba lagi sebentar.')
    }

    // ── Save 3 options → pause for human selection ──────────────
    await step.run('save-topic-options', async () => {
      const db = createAdminSupabaseClient()

      const { error } = await db
        .from('articles')
        .update({
          topic_options: ctx2.topicOptions,
          status: 'awaiting_topic_selection',
        })
        .eq('id', articleId)

      if (error) throw new Error(`Failed to save topic options: ${error.message}`)

      await db.from('article_generation_progress').insert({
        article_id: articleId,
        agent_name: 'topic-selection-pause',
        status: 'running',
        message: 'Menunggu pilihan topik daripada editor…',
      })
    })

    // ── Wait for admin to select a topic (up to 24 hours) ───────
    const selection = await step.waitForEvent('wait-for-topic-selection', {
      event: 'topic/selected',
      timeout: '24h',
      match: 'data.articleId',
    })

    // Timeout: no selection within 24 hours
    if (!selection) {
      const db = createAdminSupabaseClient()
      await db.from('articles').update({
        status: 'failed',
        quality_flags: { verdict: 'reject', error: 'Pemilihan topik tamat masa — cuba jana semula.' },
      }).eq('id', articleId)
      throw new Error('Topic selection timed out after 24 hours.')
    }

    // Admin cancelled during topic selection
    if (selection.data.cancelled) {
      return { cancelled: true, articleId }
    }

    // ── Resume: update status, save selected topic ───────────────
    const selectedOption = selection.data.selectedTopic
    await step.run('resume-pipeline', async () => {
      const db = createAdminSupabaseClient()

      await db.from('articles').update({
        status: 'generating',
        selected_topic: selectedOption,
      }).eq('id', articleId)

      await db.from('article_generation_progress')
        .update({ status: 'done', message: `Topik dipilih: ${selectedOption?.topic ?? ''}` })
        .eq('article_id', articleId)
        .eq('agent_name', 'topic-selection-pause')
    })

    // Build context for Agent 3: map selected option to the shape deepResearcher expects
    const selectedTopicCtx = {
      trends: ctx1.trends,
      scoutedAt: ctx1.scoutedAt,
      selectedTopic: {
        topic: selectedOption.topic,
        description: selectedOption.summary,
        category: selectedOption.category,
        urgency: 'high',
        keywords: [],
      },
      articleAngle: selectedOption.angle ?? selectedOption.summary ?? '',
      isDuplicate: false,
      similarArticles: [],
      existingArticles,
    }

    // ── Agent 3: Deep Researcher ────────────────────────────────
    const ctx3 = await step.run('deep-researcher', async () => {
      const pid = await startProgress('deep-researcher', 'Menjalankan penyelidikan mendalam...')
      try {
        const ctx = await deepResearcher(selectedTopicCtx)
        const factCount = ctx.researchBrief?.keyFacts?.length ?? 0
        await endProgress(pid, 'done', `Brief siap — ${factCount} fakta utama dikumpul`)
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    await step.sleep('wait-after-deep-researcher', '65s')

    // ── Agent 4: Article Writer ─────────────────────────────────
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

    // ── Agent 5: SEO Metadata ───────────────────────────────────
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

    // ── Agent 6: Image Brief ────────────────────────────────────
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

    // ── Agent 7: Quality Checker ────────────────────────────────
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

    // ── Steps 8–10 (conditional): Revision + re-check loop ─────
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

      if (needsRevision(ctx9.qualityReport)) {
        await step.sleep('wait-before-revision-2', '65s')

        const ctx10 = await step.run('revision-agent-2', async () => {
          const pid = await startProgress('revision-agent', 'Semakan semula ke-2 untuk mencapai 85+...')
          try {
            const ctx = await revisionAgent({
              ...ctx9,
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

      const bodyWithPlaceholders = injectImagePlaceholders(
        ctxFinal.article?.body,
        ctxFinal.images?.suggestions
      )

      const coreUpdate = {
        title:            ctxFinal.article?.headlines?.[0] ?? null,
        slug:             ctxFinal.seo?.slug ?? null,
        body:             bodyWithPlaceholders ?? null,
        meta_description: ctxFinal.seo?.metaDescription ?? null,
        headline_options: ctxFinal.article?.headlines ?? [],
        tags:             ctxFinal.seo?.tags ?? [],
        image_brief: ctxFinal.images?.heroImage
          ? JSON.stringify({
              prompt:       ctxFinal.images.heroImage.prompt        ?? '',
              unsplashQuery: ctxFinal.images.heroImage.unsplashQuery ?? '',
              altText:      ctxFinal.images.heroImage.altText        ?? '',
              caption:      ctxFinal.images.heroImage.caption        ?? '',
            })
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

      // Optional fields (migrations 003 + 004 columns)
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

      if (Object.keys(optionalUpdate).length > 0) {
        const { error: optError } = await db
          .from('articles')
          .update(optionalUpdate)
          .eq('id', articleId)
        if (optError) {
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
      if (attempt >= 1) {
        try {
          const failDb = createAdminSupabaseClient()

          await failDb.from('articles').update({
            status: 'failed',
            quality_flags: {
              verdict: 'reject',
              error: err.message ?? 'Pipeline gagal — cuba jana semula.',
            },
          }).eq('id', articleId)

          const { data: existingRows } = await failDb
            .from('article_generation_progress')
            .select('agent_name')
            .eq('article_id', articleId)
          const existingNames = new Set((existingRows ?? []).map(r => r.agent_name))

          const ALL_AGENT_KEYS = [
            'trend-scout', 'topic-selector', 'topic-selection-pause',
            'deep-researcher', 'article-writer', 'seo-metadata',
            'image-brief', 'quality-checker', 'revision-agent', 'save-article',
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
