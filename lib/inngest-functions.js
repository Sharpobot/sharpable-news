import { inngest } from './inngest.js'
import { createAdminSupabaseClient } from './db/supabase-admin.js'
import { trendScout }     from './agents/trend-scout.js'
import { topicSelector }  from './agents/topic-selector.js'
import { deepResearcher } from './agents/deep-researcher.js'
import { articleWriter }  from './agents/article-writer.js'
import { seoMetadata }    from './agents/seo-metadata.js'
import { imageBrief }     from './agents/image-brief.js'
import { qualityChecker } from './agents/quality-checker.js'

export const generateArticle = inngest.createFunction(
  {
    id: 'generate-article',
    name: 'Generate Article',
    triggers: [{ event: 'article/generate' }],
    retries: 1,
  },
  async ({ event, step }) => {
    const { articleId } = event.data

    // ── Progress helpers ────────────────────────────────────────
    // Each agent call: insert a 'running' row, run the agent,
    // then update that same row to 'done' or 'failed'.

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

    // ── Step 1: Trend Scout ─────────────────────────────────────
    const ctx1 = await step.run('trend-scout', async () => {
      const pid = await startProgress('trend-scout', 'Mencari topik trending...')
      try {
        const ctx = await trendScout({})
        await endProgress(pid, 'done', `Dijumpai ${ctx.trends?.length ?? 0} topik trending`)
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    // 65s gap — Gemini free tier allows 10 req/min; spacing prevents quota errors
    await step.sleep('wait-after-trend-scout', '65s')

    // ── Step 2: Topic Selector ──────────────────────────────────
    const ctx2 = await step.run('topic-selector', async () => {
      const pid = await startProgress('topic-selector', 'Memilih topik terbaik untuk pembaca Malaysia...')
      try {
        const ctx = await topicSelector(ctx1)
        await endProgress(pid, 'done', `Topik dipilih: ${ctx.selectedTopic?.topic ?? '(tiada)'}`)
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    await step.sleep('wait-after-topic-selector', '65s')

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

    // ── Step 7: Quality Checker ─────────────────────────────────
    const ctx7 = await step.run('quality-checker', async () => {
      const pid = await startProgress('quality-checker', 'Menyemak kualiti dan fakta...')
      try {
        const ctx = await qualityChecker(ctx6)
        const score = ctx.qualityReport?.overallScore ?? 0
        const verdict = ctx.qualityReport?.verdict ?? 'unknown'
        await endProgress(pid, 'done', `Skor: ${score}/100 — ${verdict}`)
        return ctx
      } catch (err) {
        await endProgress(pid, 'failed', err.message)
        throw err
      }
    })

    // ── Step 8: Save to Supabase ────────────────────────────────
    await step.run('save-article', async () => {
      const db = createAdminSupabaseClient()

      const update = {
        // Core content
        title:            ctx7.article?.headlines?.[0] ?? null,
        slug:             ctx7.seo?.slug ?? null,
        body:             ctx7.article?.body ?? null,
        meta_description: ctx7.seo?.metaDescription ?? null,

        // AI outputs
        headline_options: ctx7.article?.headlines ?? [],
        tags:             ctx7.seo?.tags ?? [],

        // Image brief stored as text description
        image_brief: ctx7.images?.heroImage
          ? `${ctx7.images.heroImage.description} | Query: ${ctx7.images.heroImage.unsplashQuery}`
          : null,

        // Quality flags
        quality_flags: {
          verdict:          ctx7.qualityReport?.verdict ?? null,
          overall_score:    ctx7.qualityReport?.overallScore ?? null,
          publish_readiness: ctx7.qualityReport?.publishReadiness ?? null,
          required_fixes:   ctx7.qualityReport?.requiredFixes ?? [],
          checks:           ctx7.qualityReport?.checks ?? {},
        },

        // Sources from research brief
        sources: (ctx7.researchBrief?.suggestedSources ?? []).map((s) => ({
          title: s.outlet,
          description: s.description,
        })),

        // Mark as ready for editor review
        status: 'ready_to_review',
      }

      const { error } = await db
        .from('articles')
        .update(update)
        .eq('id', articleId)

      if (error) throw new Error(`Failed to save article: ${error.message}`)

      return { saved: true, articleId }
    })

    return {
      success: true,
      articleId,
      title: ctx7.article?.headlines?.[0] ?? null,
      slug: ctx7.seo?.slug ?? null,
      verdict: ctx7.qualityReport?.verdict ?? null,
    }
  }
)
