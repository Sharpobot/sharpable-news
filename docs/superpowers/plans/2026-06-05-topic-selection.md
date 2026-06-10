# Human-in-the-Loop Topic Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single "Jana Artikel Baru" button with a two-step flow: admin enters optional topic direction → agents 1+2 produce 3 distinct topic options → admin picks one → pipeline resumes from agent 3.

**Architecture:** A single Inngest `generateArticle` function handles the full pipeline. After agents 1+2, it saves 3 topic options to `topic_options` column and uses `step.waitForEvent('topic/selected')` to pause. Admin selects a card → `/api/select-topic` fires the event → pipeline resumes from agent 3. Cancel fires the same event with `cancelled: true` and deletes the article row.

**Tech Stack:** Inngest v4 `step.waitForEvent`, Supabase (`topic_options` + `selected_topic` JSONB columns), Next.js API routes, React polling via `/api/progress` every 3s.

---

## Files to Modify
- `lib/agents/topic-selector.js` — return 3 options instead of 1 selected topic
- `lib/inngest-functions.js` — add waitForEvent pause; accept topicDirection from event
- `app/api/generate-topics/route.js` — set initial status to `awaiting_topic_selection`
- `app/admin/jana/JanaClient.js` — topic direction text field; call generate-topics
- `app/admin/artikel/ArtikelClient.js` — cancel button for awaiting_topic_selection too

## Files to Create
- `app/api/cancel-topic/route.js` — delete article + fire cancelled event

## DB prerequisite
- `supabase/migrations/007_topic_selection.sql` — already exists locally, must be applied to remote

---

### Task 1: Apply migration 007 to Supabase

**Files:** `supabase/migrations/007_topic_selection.sql` (apply to remote only, no local changes)

- [ ] **Step 1: Apply migration via Supabase MCP**

Use the Supabase MCP `apply_migration` tool with:
- name: `007_topic_selection`
- query:
```sql
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS topic_options   JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selected_topic  JSONB DEFAULT NULL;
```

Expected: migration applied successfully with no errors.

- [ ] **Step 2: Verify columns exist**

Use Supabase MCP `execute_sql`:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'articles'
  AND column_name IN ('topic_options', 'selected_topic');
```

Expected: 2 rows returned with `data_type = 'jsonb'`.

---

### Task 2: Rewrite `lib/agents/topic-selector.js`

**Files:**
- Modify: `lib/agents/topic-selector.js`

- [ ] **Step 1: Replace entire file**

```js
import { ask } from './_client.js'

/**
 * Agent 2: Topic Selector
 * Produces exactly 3 distinct topic options for human-in-the-loop selection.
 * Each option covers a different story/event — never 3 angles on the same topic.
 * Returns topicOptions: Array<{ topic, summary, category, angle, sourceName, sourceUrl }>
 */
export async function topicSelector(context = {}) {
  const { trends = [], existingArticles = [] } = context

  if (trends.length === 0) {
    return { ...context, topicOptions: [] }
  }

  const recentBlock = existingArticles.length > 0
    ? `\nARTIKEL YANG BARU DITERBITKAN (14 hari lepas — ELAKKAN topik terlalu serupa):\n${
        existingArticles.map((a, i) => `${i + 1}. "${a.title}" (${a.slug})`).join('\n')
      }\n`
    : ''

  const result = await ask(
    `You are a senior editor for Sharpable News, a Bahasa Malaysia AI/tech news publication.
Your audience: tech-savvy Malaysians aged 20-40, bilingual (BM/English), interested in how
global technology affects their daily lives and career.
Always respond with valid JSON only — no markdown, no extra text.`,

    `Here are the trending topics identified by our trend scout:

${JSON.stringify(trends, null, 2)}
${recentBlock}

Return EXACTLY 3 topic options for the editor to choose from.

STRICT RULES:
1. Each option MUST be a completely different story/event — do NOT return 3 variations of the same topic.
2. Cover different categories where possible (e.g. one AI policy, one product launch, one research breakthrough).
3. Avoid topics semantically identical to any recently published article listed above.
4. Each option must support a substantive 600-700 word Bahasa Malaysia article.
5. Rank by reader interest (option 1 = strongest pick for Malaysian audience).

Return this exact JSON format:
{
  "topicOptions": [
    {
      "topic": "Concise topic headline (max 80 chars)",
      "summary": "One sentence: what happened and why it matters to Malaysian readers.",
      "category": "AI | Tech | Business | Society | Science",
      "angle": "The specific article hook for Sharpable News — what unique perspective will we take?",
      "sourceName": "Primary publication or website name that reported this",
      "sourceUrl": "Direct URL to primary source article, or null if unavailable"
    },
    {
      "topic": "...",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    },
    {
      "topic": "...",
      "summary": "...",
      "category": "...",
      "angle": "...",
      "sourceName": "...",
      "sourceUrl": "..."
    }
  ]
}`,
    600
  )

  return {
    ...context,
    topicOptions: result.topicOptions ?? [],
  }
}
```

- [ ] **Step 2: Verify file saved correctly — no old `selectedTopic` or `isDuplicate` references**

---

### Task 3: Rewrite `lib/inngest-functions.js`

**Files:**
- Modify: `lib/inngest-functions.js`

Key changes from current:
- Destructure `topicDirection` from `event.data`
- Pass `topicDirection` to `trendScout`
- Remove the `for (let attempt...)` dedup retry loop
- Single run each for agents 1 and 2
- New `save-topic-options` step → saves 3 options to DB, updates status to `awaiting_topic_selection`, writes pause progress row
- `step.waitForEvent` for 24h
- Timeout → mark failed and throw
- `cancelled: true` → clean return
- New `resume-pipeline` step → update status to `generating`, save `selected_topic`, mark pause row as done
- Build `selectedTopicCtx` to pass to agent 3
- Continue agents 3-8 with `selectedTopicCtx`
- In save-article: remove `ctx2.similarArticles` reference (replaced by empty array)
- In permanent failure handler: add `'topic-selection-pause'` to ALL_AGENT_KEYS

- [ ] **Step 1: Replace the entire file**

```js
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
    const { articleId, topicDirection } = event.data

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
      } catch (err) { await endProgress(pid, 'failed', err.message); throw err }
    })

    await step.sleep('wait-after-trend-scout', '65s')

    // ── Agent 2: Topic Selector (returns 3 options) ─────────────
    const ctx2 = await step.run('topic-selector', async () => {
      const pid = await startProgress('topic-selector', 'Menyediakan 3 pilihan topik untuk editor…')
      try {
        const ctx = await topicSelector({ ...ctx1, existingArticles })
        await endProgress(pid, 'done', `${ctx.topicOptions?.length ?? 0} pilihan topik siap`)
        return ctx
      } catch (err) { await endProgress(pid, 'failed', err.message); throw err }
    })

    await step.sleep('wait-after-topic-selector', '65s')

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
```

- [ ] **Step 2: Verify the file has no references to the old `ctx2.similarArticles` or dedup retry loop**

---

### Task 4: Update `app/api/generate-topics/route.js`

**Files:**
- Modify: `app/api/generate-topics/route.js`

Change the initial article status from `'generating'` to `'awaiting_topic_selection'` so it shows immediately in the correct state.

- [ ] **Step 1: Replace the file**

```js
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const topicDirection = body.topicDirection?.trim() || null

  const db = createAdminSupabaseClient()

  const tempSlug = `draft-${Date.now()}`
  const { data, error } = await db
    .from('articles')
    .insert({ status: 'awaiting_topic_selection', slug: tempSlug })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[generate-topics] DB insert error:', error?.message)
    return Response.json({ error: 'Gagal mencipta artikel' }, { status: 500 })
  }

  const articleId = data.id

  const inngestUrl = process.env.INNGEST_DEV === '1'
    ? 'http://localhost:8288/e/test'
    : `https://inn.gs/e/${process.env.INNGEST_EVENT_KEY ?? ''}`

  fetch(inngestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'article/generate',
      data: { articleId, topicDirection },
    }),
  }).catch(err => console.error('[generate-topics] Inngest send error:', err))

  return Response.json({ articleId })
}
```

---

### Task 5: Create `app/api/cancel-topic/route.js`

**Files:**
- Create: `app/api/cancel-topic/route.js`

Handles cancel during topic selection: deletes the article row and fires `topic/selected` with `cancelled: true` so the paused Inngest pipeline exits cleanly without waiting 24 hours.

- [ ] **Step 1: Create the file**

```js
import { createAdminSupabaseClient } from '@/lib/db/supabase-admin'
import { isAuthed } from '@/lib/api/isAuthed'

/**
 * POST /api/cancel-topic
 * Cancels a paused topic-selection pipeline:
 * 1. Deletes the article row from Supabase
 * 2. Fires topic/selected with cancelled:true so waitForEvent exits cleanly
 */
export async function POST(request) {
  if (!await isAuthed()) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { articleId } = await request.json()
  if (!articleId) return Response.json({ error: 'articleId required' }, { status: 400 })

  const db = createAdminSupabaseClient()

  // Delete article row first
  const { error: deleteError } = await db
    .from('articles')
    .delete()
    .eq('id', articleId)

  if (deleteError) {
    console.error('[cancel-topic] delete error:', deleteError.message)
    return Response.json({ error: 'Gagal memadam artikel' }, { status: 500 })
  }

  // Fire cancellation event to resume and cleanly exit the waiting pipeline
  const inngestUrl = process.env.INNGEST_DEV === '1'
    ? 'http://localhost:8288/e/test'
    : `https://inn.gs/e/${process.env.INNGEST_EVENT_KEY ?? ''}`

  try {
    await fetch(inngestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'topic/selected',
        data: { articleId, cancelled: true },
      }),
    })
  } catch (err) {
    // Non-fatal: pipeline will time out on its own in 24h if event fails
    console.warn('[cancel-topic] Inngest cancel event failed:', err.message)
  }

  return Response.json({ ok: true })
}
```

---

### Task 6: Update `app/admin/jana/JanaClient.js`

**Files:**
- Modify: `app/admin/jana/JanaClient.js`

Changes needed:
1. Add `topicDirection` state
2. Change `handleSearchTopics` to call `/api/generate-topics` with `topicDirection`
3. Replace "Jana Artikel Baru" button with a form row: text input + "Cari Topik" button
4. Update `confirmCancel` to call `/api/cancel-topic` for `awaiting_topic_selection` articles (instead of DELETE)
5. Show initial status as `awaiting_topic_selection` in the new article (not `generating`)

- [ ] **Step 1: Add `topicDirection` state after line 148 (`const [cancelTarget...`)**

Find:
```js
  const [cancelTarget,   setCancelTarget]   = useState(null)
```

Replace with:
```js
  const [cancelTarget,   setCancelTarget]   = useState(null)
  const [topicDirection, setTopicDirection] = useState('')
```

- [ ] **Step 2: Update `handleSearchTopics` (currently calls `/api/generate`)**

Find:
```js
  /* ── Search Topics ── */
  const handleSearchTopics = async () => {
    setIsSearching(true)
    const tid = toast.loading('Mencari topik trending…')
    try {
      const res = await fetch('/api/generate', { method: 'POST' })
      const { articleId, error } = await res.json()
      if (error) { toast.error(`Ralat: ${error}`, { id: tid }); return }
      toast.success('Artikel sedang dijana! (~9 minit)', { id: tid })
      const newArticle = { id: articleId, status: 'generating', title: null, created_at: new Date().toISOString() }
      setArticles(prev => [newArticle, ...prev])
      setGeneratingIds(prev => [...prev, articleId])
      setStatusMap(prev => ({ ...prev, [articleId]: 'generating' }))
    } catch {
      toast.error('Ralat semasa mencari topik.', { id: tid })
    } finally {
      setIsSearching(false)
    }
  }
```

Replace with:
```js
  /* ── Search Topics ── */
  const handleSearchTopics = async () => {
    setIsSearching(true)
    const tid = toast.loading('Mencari topik trending…')
    try {
      const res = await fetch('/api/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicDirection: topicDirection.trim() || null }),
      })
      const { articleId, error } = await res.json()
      if (error) { toast.error(`Ralat: ${error}`, { id: tid }); return }
      toast.success('Mencari topik… tunggu sebentar.', { id: tid })
      const newArticle = { id: articleId, status: 'awaiting_topic_selection', title: null, created_at: new Date().toISOString() }
      setArticles(prev => [newArticle, ...prev])
      setGeneratingIds(prev => [...prev, articleId])
      setStatusMap(prev => ({ ...prev, [articleId]: 'awaiting_topic_selection' }))
    } catch {
      toast.error('Ralat semasa mencari topik.', { id: tid })
    } finally {
      setIsSearching(false)
    }
  }
```

- [ ] **Step 3: Update `confirmCancel` to use `/api/cancel-topic` for awaiting articles**

Find:
```js
  const confirmCancel = async () => {
    if (!cancelTarget) return
    setModal(false)
    const tid = toast.loading('Membatalkan…')
    try {
      const res = await fetch(`/api/articles/${cancelTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('Gagal membatalkan.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== cancelTarget.id))
      setGeneratingIds(prev => prev.filter(id => id !== cancelTarget.id))
      toast.success('Dibatalkan.', { id: tid })
    } catch { toast.error('Ralat semasa membatalkan.', { id: tid }) }
  }
```

Replace with:
```js
  const confirmCancel = async () => {
    if (!cancelTarget) return
    setModal(false)
    const tid = toast.loading('Membatalkan…')
    try {
      const isAwaiting = statusMap[cancelTarget.id] === 'awaiting_topic_selection'
      let res
      if (isAwaiting) {
        res = await fetch('/api/cancel-topic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: cancelTarget.id }),
        })
      } else {
        res = await fetch(`/api/articles/${cancelTarget.id}`, { method: 'DELETE' })
      }
      if (!res.ok) { toast.error('Gagal membatalkan.', { id: tid }); return }
      setArticles(prev => prev.filter(a => a.id !== cancelTarget.id))
      setGeneratingIds(prev => prev.filter(id => id !== cancelTarget.id))
      toast.success('Dibatalkan.', { id: tid })
    } catch { toast.error('Ralat semasa membatalkan.', { id: tid }) }
  }
```

- [ ] **Step 4: Replace the "Generate button" section (lines 362–374) with topic direction form**

Find:
```js
      {/* ── Generate button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button onClick={handleSearchTopics} disabled={isSearching} className="search-btn">
          {isSearching ? <><Spinner size={13} /> Memulakan…</> : (
            <>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Jana Artikel Baru
            </>
          )}
        </button>
      </div>
```

Replace with:
```js
      {/* ── Step 1: Topic direction input + Search button ── */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="section-label">Langkah 1 — Cari Topik</div>
        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--t3)' }}>
          Masukkan hala tuju topik (pilihan), kemudian klik Cari Topik.
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="topic-dir-input"
            style={{ flex: '1 1 200px' }}
            type="text"
            placeholder="e.g. Malaysian AI policy, new language models, AI in healthcare..."
            value={topicDirection}
            onChange={e => setTopicDirection(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !isSearching) handleSearchTopics() }}
            disabled={isSearching}
          />
          <button onClick={handleSearchTopics} disabled={isSearching} className="search-btn" style={{ flexShrink: 0 }}>
            {isSearching ? <><Spinner size={13} /> Memulakan…</> : (
              <>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                Cari Topik
              </>
            )}
          </button>
        </div>
        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--t3)' }}>
          Biarkan kosong untuk biarkan AI memilih topik trending terkini.
        </div>
      </div>
```

---

### Task 7: Update `app/admin/artikel/ArtikelClient.js`

**Files:**
- Modify: `app/admin/artikel/ArtikelClient.js`

The delete button currently opens cancel modal only for `generating` status. `awaiting_topic_selection` should also trigger cancel (not delete), and show the cancel icon.

- [ ] **Step 1: Update the delete button `onClick` and icon logic**

Find:
```js
                <button
                  className="delete-btn"
                  onClick={() => article.status === 'generating' ? openCancel(article) : openDelete(article)}
                  title={article.status === 'generating' ? 'Batalkan penjanaan' : 'Padam artikel'}
                >
                  {article.status === 'generating' ? (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
                  )}
                </button>
```

Replace with:
```js
                <button
                  className="delete-btn"
                  onClick={() => ['generating', 'awaiting_topic_selection'].includes(article.status) ? openCancel(article) : openDelete(article)}
                  title={['generating', 'awaiting_topic_selection'].includes(article.status) ? 'Batalkan penjanaan' : 'Padam artikel'}
                >
                  {['generating', 'awaiting_topic_selection'].includes(article.status) ? (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                    </svg>
                  )}
                </button>
```

---

### Task 8: Commit

- [ ] **Step 1: Stage and commit**

```bash
git add lib/agents/topic-selector.js
git add lib/inngest-functions.js
git add app/api/generate-topics/route.js
git add app/api/cancel-topic/route.js
git add app/admin/jana/JanaClient.js
git add app/admin/artikel/ArtikelClient.js
git commit -m "feat: human-in-the-loop topic selection with waitForEvent pause

- topic-selector returns 3 distinct options instead of 1 selected topic
- generateArticle pauses after agents 1+2 using step.waitForEvent('topic/selected')
- save-topic-options step saves 3 options to topic_options column + status awaiting_topic_selection
- resume-pipeline step resumes from agent 3 with admin-selected topic
- 24h timeout marks article as failed; cancelled flag allows clean early exit
- /api/generate-topics sets initial status to awaiting_topic_selection
- /api/cancel-topic deletes article + fires cancellation event
- JanaClient: topic direction input, Cari Topik button, cancel calls cancel-topic API
- ArtikelClient: cancel icon/action applies to awaiting_topic_selection too

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 2: Push**

```bash
git push
```

---

## Self-Review

### Spec coverage check

| Requirement | Task |
|---|---|
| Topic Direction optional text field with correct placeholder | Task 6 Step 4 |
| "Cari Topik" button → create article as `awaiting_topic_selection` + fire Inngest | Task 4 + Task 6 Step 2 |
| Run only Agent 1 + 2 then pause | Task 3 |
| 3 topic option cards with topic, summary, source name/URL, Pilih button | Already in JanaClient TopicCard component |
| Poll every 3s for topic options | Already in JanaClient polling (unchanged) |
| Pilih Topik Ini → fire topic/selected event → resume from Agent 3 | Task 3 (waitForEvent resume) + existing select-topic route |
| `awaiting_topic_selection` status blue badge "Pilih Topik" | Already in ArtikelClient STATUS_CFG |
| `topic_options` + `selected_topic` columns | Task 1 |
| Cancel button visible during loading + card states | Already in JanaClient |
| Cancel → delete article + cancel pipeline cleanly | Task 5 (cancel-topic route) + Task 6 Step 3 |
| 24h timeout → mark failed | Task 3 |
| Agent 2 returns 3 distinct options covering different angles | Task 2 |
| `topic-selection-pause` progress row shown while waiting | Task 3 (save-topic-options step) |
| ArtikelClient cancel for awaiting status | Task 7 |

### No gaps found.

### Type consistency check
- `topicOptions` array shape: `{ topic, summary, category, angle, sourceName, sourceUrl }` — defined in Task 2, consumed in Task 3 (`ctx2.topicOptions`)
- `selectedOption` (from `selection.data.selectedTopic`): same shape — mapped to `selectedTopicCtx.selectedTopic` in Task 3
- `selectedTopicCtx.articleAngle` uses `selectedOption.angle ?? selectedOption.summary` — consistent
- `cancel-topic` sends `{ articleId, cancelled: true }` — pipeline checks `selection.data.cancelled` — consistent
- `generate-topics` sends event `{ articleId, topicDirection }` — pipeline reads `event.data.topicDirection` — consistent
