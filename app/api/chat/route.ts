import { NextRequest, NextResponse } from 'next/server'
import { spawnSync } from 'child_process'
import fs from 'fs'

export const runtime = 'nodejs'

const CLAUDE_CMD = 'C:\\Users\\keith.obeirne\\AppData\\Roaming\\npm\\claude.cmd'

const BRAND_CTX = `You are Jarvis, the AI assistant for Irish Peptides & Nutrition — an Irish sports nutrition and peptide education brand by Keith O'Beirne. Answer like a smart, friendly colleague who knows the business inside out. Use short conversational sentences. Never use bullet points or headers in chat responses. If you have live data, weave it in naturally. Always add context and a suggestion after data. For educational and research purposes only — never give medical advice.`

const GITHUB_RAW = 'https://raw.githubusercontent.com/keithyob26/irishpeptides-jarvis/master'
const NOTION_API = 'https://api.notion.com/v1'

// ── Intent detection ─────────────────────────────────────────────────────────

function detectIntents(message: string): Set<string> {
  const q = message.toLowerCase()
  const intents = new Set<string>()

  if (/visitor|traffic|session|pageview|ga4|analytics|how.*site.*do|site.*do|bounce|top page/.test(q)) intents.add('analytics')
  if (/subscriber|email list|newsletter|sign.?up|how many.*email|resend/.test(q)) intents.add('subscribers')
  if (/agent|workflow|run|jarvis.*doing|how.*doing|last ran|status|failing|passed/.test(q)) intents.add('agents')
  if (/task|queue|notion|build|to.?do|pending|backlog/.test(q)) intents.add('notion')
  if (/social|tiktok|instagram|follower|post.*perform|content.*perform/.test(q)) intents.add('social')
  if (/schedul|calendar|upcoming|post.*week|week.*post|what.*post/.test(q)) intents.add('calendar')
  if (/site.*health|health.*site|qa|broken.*link|error.*site|site.*down|page.*load/.test(q)) intents.add('sitehealth')
  if (/competitor|competition|rival|market|what.*others|who.*selling/.test(q)) intents.add('competitor')
  if (/revenue|money|stripe|income|earn|sale|payment|how much.*made|profit/.test(q)) intents.add('revenue')

  // General catch-all — inject summary context
  if (intents.size === 0 || /everything|overview|summary|update|brief|morning|how.*going|catch me up/.test(q)) {
    intents.add('summary')
  }

  return intents
}

// ── Data fetchers ────────────────────────────────────────────────────────────

async function fetchResendSubscribers(key: string): Promise<{ count: number; label: string }> {
  try {
    const r = await fetch('https://api.resend.com/audiences', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return { count: 0, label: 'Resend error' }
    const d = await r.json()
    const audiences: { total_subscriptions?: number; name?: string }[] = d.data ?? []
    const count = audiences.reduce((sum, a) => sum + (a.total_subscriptions ?? 0), 0)
    return { count, label: `${count} total subscribers across ${audiences.length} audience(s)` }
  } catch { return { count: 0, label: 'Resend unavailable' } }
}

async function fetchOutcomesJson(): Promise<Record<string, unknown>[]> {
  try {
    const r = await fetch(`${GITHUB_RAW}/memory/outcomes.json`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) return []
    const d = await r.json()
    return d.outcomes || []
  } catch { return [] }
}

async function fetchGA4Summary(): Promise<string> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const r = await fetch(`${baseUrl}/api/analytics?days=30`, {
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) return ''
    const d = await r.json()
    if (!d.connected || !d.summary) return ''
    const s = d.summary
    const top3 = (d.topPages || []).slice(0, 3).map((p: { path: string; pageviews: number }) => `${p.path} (${p.pageviews} views)`).join(', ')
    return `GA4 last 30 days: ${s.sessions} sessions, ${s.users} unique visitors, ${s.pageviews} pageviews, ${s.bounceRate}% bounce rate, ${s.pagesPerSession} pages/session. Top pages: ${top3 || 'unknown'}.`
  } catch { return '' }
}

async function fetchNotionQueueCount(notionKey: string): Promise<string> {
  try {
    const r = await fetch(`${NOTION_API}/databases/37da0eb7-e3ea-819e-af5b-e76db92a7c8c/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: { property: 'Done', checkbox: { equals: false } },
        page_size: 100,
      }),
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return ''
    const d = await r.json()
    const count = d.results?.length ?? 0
    return `Notion Build Queue: ${count} open task(s) remaining.`
  } catch { return '' }
}

async function fetchAgentStatus(githubToken: string): Promise<string> {
  try {
    const r = await fetch('https://api.github.com/repos/keithyob26/irishpeptides-jarvis/actions/runs?per_page=30', {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return ''
    const d = await r.json()
    const runs: Record<string, unknown>[] = d.workflow_runs || []
    // Dedupe by workflow name, keep latest
    const seen = new Set<string>()
    const latestRuns: Record<string, unknown>[] = []
    for (const run of runs) {
      const name = run.name as string
      if (!seen.has(name)) { seen.add(name); latestRuns.push(run) }
    }
    const passing = latestRuns.filter(r => r.conclusion === 'success').length
    const failing = latestRuns.filter(r => r.conclusion === 'failure').length
    const running = latestRuns.filter(r => r.status === 'in_progress').length
    const summaryLine = `${latestRuns.length} workflows tracked: ${passing} passing, ${failing} failing, ${running} running.`
    const failNames = latestRuns.filter(r => r.conclusion === 'failure').map(r => r.name as string).join(', ')
    return summaryLine + (failNames ? ` Failing: ${failNames}.` : '')
  } catch { return '' }
}

function summariseOutcomes(outcomes: Record<string, unknown>[]): { social: string; siteHealth: string; competitor: string; calendar: string; revenue: string } {
  const byAgent: Record<string, Record<string, unknown>[]> = {}
  for (const o of outcomes) {
    const agent = (o.agent as string) || 'unknown'
    if (!byAgent[agent]) byAgent[agent] = []
    byAgent[agent].push(o)
  }

  const latest = (agent: string) => byAgent[agent]?.[0]

  const socialOut = latest('social_agent') || latest('social_performance')
  const social = socialOut
    ? `Social last run: ${socialOut.created_at || 'unknown date'}. Status: ${socialOut.status || 'unknown'}.`
    : 'No social agent data in outcomes yet.'

  const qaOut = latest('site_qa_agent')
  const siteHealth = qaOut
    ? `Site QA last run: ${qaOut.created_at || 'unknown'}. Status: ${qaOut.status || 'unknown'}.${qaOut.content ? ' Details: ' + String(qaOut.content).slice(0, 100) : ''}`
    : 'No site QA data in outcomes yet.'

  const compOut = latest('competitor_agent')
  const competitor = compOut
    ? `Competitor monitor last run: ${compOut.created_at || 'unknown'}. ${compOut.content ? String(compOut.content).slice(0, 150) : ''}`
    : 'No competitor data in outcomes yet.'

  const calOut = latest('content_studio')
  const calendar = calOut
    ? `Content engine last run: ${calOut.created_at || 'unknown'}. ${calOut.content ? String(calOut.content).slice(0, 150) : ''}`
    : 'No content calendar data in outcomes yet.'

  const revOut = latest('revenue_agent')
  const revenue = revOut
    ? `Revenue agent last run: ${revOut.created_at || 'unknown'}. ${revOut.content ? String(revOut.content).slice(0, 150) : ''}`
    : 'No revenue data in outcomes yet.'

  return { social, siteHealth, competitor, calendar, revenue }
}

// ── Live data injector ───────────────────────────────────────────────────────

async function buildLiveContext(message: string): Promise<{ context: string; sources: string[] }> {
  const intents = detectIntents(message)
  const sources: string[] = []
  const lines: string[] = []

  const RESEND_KEY = process.env.RESEND_API_KEY || ''
  const NOTION_KEY = process.env.NOTION_API_KEY || ''
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''

  // Fetch outcomes.json once — many intents use it
  const needsOutcomes = intents.has('social') || intents.has('sitehealth') || intents.has('competitor') || intents.has('calendar') || intents.has('revenue') || intents.has('summary')
  let outcomes: Record<string, unknown>[] = []
  if (needsOutcomes) {
    outcomes = await fetchOutcomesJson()
  }

  const summaries = needsOutcomes ? summariseOutcomes(outcomes) : null

  const tasks: Promise<void>[] = []

  if (intents.has('analytics') || intents.has('summary')) {
    tasks.push(fetchGA4Summary().then(s => {
      if (s) { lines.push(s); sources.push('GA4') }
    }))
  }

  if ((intents.has('subscribers') || intents.has('summary')) && RESEND_KEY) {
    tasks.push(fetchResendSubscribers(RESEND_KEY).then(r => {
      if (r.count >= 0) { lines.push(`Subscribers: ${r.label}`); sources.push('Resend') }
    }))
  }

  if ((intents.has('agents') || intents.has('summary')) && GITHUB_TOKEN) {
    tasks.push(fetchAgentStatus(GITHUB_TOKEN).then(s => {
      if (s) { lines.push(s); sources.push('GitHub Actions') }
    }))
  }

  if ((intents.has('notion') || intents.has('summary')) && NOTION_KEY) {
    tasks.push(fetchNotionQueueCount(NOTION_KEY).then(s => {
      if (s) { lines.push(s); sources.push('Notion') }
    }))
  }

  if (intents.has('social') || intents.has('summary')) {
    if (summaries) { lines.push(summaries.social); sources.push('Outcomes') }
  }

  if (intents.has('sitehealth') || intents.has('summary')) {
    if (summaries) lines.push(summaries.siteHealth)
  }

  if (intents.has('competitor')) {
    if (summaries) lines.push(summaries.competitor)
  }

  if (intents.has('calendar')) {
    if (summaries) lines.push(summaries.calendar)
  }

  if (intents.has('revenue')) {
    if (summaries) { lines.push(summaries.revenue); if (!sources.includes('Outcomes')) sources.push('Outcomes') }
  }

  await Promise.allSettled(tasks)

  return {
    context: lines.length > 0 ? `\n\n[LIVE DATA — ${new Date().toUTCString()}]\n${lines.join('\n')}` : '',
    sources: [...new Set(sources)],
  }
}

// ── Stream helpers ────────────────────────────────────────────────────────────

function makeEncoder() { return new TextEncoder() }
function textChunk(enc: TextEncoder, text: string): Uint8Array {
  return enc.encode(`data: ${JSON.stringify({ text })}\n\n`)
}
function doneChunk(enc: TextEncoder): Uint8Array {
  return enc.encode('data: [DONE]\n\n')
}
function sourcesChunk(enc: TextEncoder, sources: string[]): Uint8Array {
  return enc.encode(`data: ${JSON.stringify({ sources })}\n\n`)
}

// ── Model streamers ───────────────────────────────────────────────────────────

async function streamGemini(apiKey: string, systemCtx: string, contentParts: unknown[]): Promise<Response> {
  const geminiParts = contentParts.map(p => {
    const part = p as Record<string, unknown>
    if (part.type === 'text') return { text: part.text }
    if (part.type === 'image') {
      const src = part.source as Record<string, unknown>
      return { inlineData: { mimeType: src.media_type, data: src.data } }
    }
    if (part.type === 'document') {
      const src = part.source as Record<string, unknown>
      return { inlineData: { mimeType: 'application/pdf', data: src.data } }
    }
    return { text: String(part) }
  })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: geminiParts }],
        systemInstruction: { parts: [{ text: systemCtx }] },
        generationConfig: { maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(30000),
    }
  )

  if (!res.ok || !res.body) {
    const err = await res.text()
    const enc = makeEncoder()
    return new Response(new ReadableStream({
      start(c) {
        c.enqueue(textChunk(enc, `Gemini error: ${res.status} — ${err.slice(0, 200)}`))
        c.enqueue(doneChunk(enc))
        c.close()
      }
    }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  }

  const enc = makeEncoder()
  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  return new Response(new ReadableStream({
    async start(controller) {
      let buf = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue
            try {
              const parsed = JSON.parse(raw)
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) controller.enqueue(textChunk(enc, text))
            } catch {}
          }
        }
      } finally {
        controller.enqueue(doneChunk(enc))
        controller.close()
      }
    }
  }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } })
}

async function streamDeepSeek(apiKey: string, systemCtx: string, message: string): Promise<Response> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'system', content: systemCtx }, { role: 'user', content: message }],
      stream: true,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok || !res.body) {
    const err = await res.text()
    const enc = makeEncoder()
    return new Response(new ReadableStream({
      start(c) {
        c.enqueue(textChunk(enc, `DeepSeek error: ${res.status} — ${err.slice(0, 200)}`))
        c.enqueue(doneChunk(enc))
        c.close()
      }
    }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  }

  const enc = makeEncoder()
  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  return new Response(new ReadableStream({
    async start(controller) {
      let buf = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') continue
            try {
              const parsed = JSON.parse(raw)
              const text = parsed?.choices?.[0]?.delta?.content
              if (text) controller.enqueue(textChunk(enc, text))
            } catch {}
          }
        }
      } finally {
        controller.enqueue(doneChunk(enc))
        controller.close()
      }
    }
  }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } })
}

async function streamOllama(systemCtx: string, message: string): Promise<Response> {
  const enc = makeEncoder()
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemma3',
        prompt: `${systemCtx}\n\nUser: ${message}\nAssistant:`,
        stream: true,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok || !res.body) {
      return new Response(new ReadableStream({
        start(c) {
          c.enqueue(textChunk(enc, `Ollama error: ${res.status}. Make sure Ollama is running at localhost:11434.`))
          c.enqueue(doneChunk(enc))
          c.close()
        }
      }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    return new Response(new ReadableStream({
      async start(controller) {
        let buf = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.trim()) continue
              try {
                const parsed = JSON.parse(line)
                if (parsed.response) controller.enqueue(textChunk(enc, parsed.response))
              } catch {}
            }
          }
        } finally {
          controller.enqueue(doneChunk(enc))
          controller.close()
        }
      }
    }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } })
  } catch (e: unknown) {
    const msg = (String(e).includes('ECONNREFUSED') || String(e).includes('fetch failed'))
      ? 'Ollama is not running. Start it with: ollama serve — then try again.'
      : `Ollama error: ${String(e)}`
    return new Response(new ReadableStream({
      start(c) {
        c.enqueue(textChunk(enc, msg))
        c.enqueue(doneChunk(enc))
        c.close()
      }
    }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  }
}

async function streamClaude(systemCtx: string, contentParts: unknown[]): Promise<Response> {
  const enc = makeEncoder()
  try {
    const textParts = contentParts.filter(p => (p as Record<string, unknown>).type === 'text')
    const lastText = textParts[textParts.length - 1] as Record<string, unknown>
    const message = (lastText?.text as string) || ''
    const fullPrompt = `${systemCtx}\n\nUser: ${message}\nAssistant:`

    const result = spawnSync(
      CLAUDE_CMD,
      ['--dangerously-skip-permissions', '-p', fullPrompt.slice(0, 50000)],
      { encoding: 'utf-8', timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
    )

    if (result.error) {
      const msg = String(result.error).includes('ENOENT')
        ? 'Claude CLI not available in this environment. Run locally or set CLAUDE_CLI_PATH.'
        : `Claude CLI error: ${String(result.error).slice(0, 200)}`
      return new Response(new ReadableStream({
        start(c) { c.enqueue(textChunk(enc, msg)); c.enqueue(doneChunk(enc)); c.close() }
      }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
    }

    if (result.status !== 0) {
      const errMsg = result.stderr?.slice(0, 300) || `Claude CLI exited with code ${result.status}`
      return new Response(new ReadableStream({
        start(c) { c.enqueue(textChunk(enc, `Claude error: ${errMsg}`)); c.enqueue(doneChunk(enc)); c.close() }
      }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
    }

    const responseText = result.stdout?.trim() || 'No response from Claude.'
    return new Response(new ReadableStream({
      start(c) { c.enqueue(textChunk(enc, responseText)); c.enqueue(doneChunk(enc)); c.close() }
    }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' } })
  } catch (e: unknown) {
    const msg = `Claude CLI exception: ${String(e).slice(0, 200)}`
    return new Response(new ReadableStream({
      start(c) { c.enqueue(textChunk(enc, msg)); c.enqueue(doneChunk(enc)); c.close() }
    }), { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  }
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

  let message = ''
  let model = 'claude'
  const contentParts: unknown[] = []

  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    message = (form.get('message') as string) || ''
    model = (form.get('model') as string) || 'claude'
    const files = form.getAll('file') as File[]
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      if (file.type.startsWith('image/')) {
        contentParts.push({ type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } })
      } else if (file.type === 'application/pdf') {
        contentParts.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } })
      }
    }
  } else {
    const body = await req.json() as { message?: string; model?: string }
    message = body.message || ''
    model = body.model || 'claude'
  }

  if (!message?.trim() && contentParts.length === 0) {
    return NextResponse.json({ error: 'No message' }, { status: 400 })
  }

  // Build live context based on intent detection
  const { context: liveContext, sources } = await buildLiveContext(message)
  const systemCtx = BRAND_CTX + liveContext

  contentParts.push({ type: 'text', text: message })

  const enc = makeEncoder()

  // Wrap the model stream to prepend a sources chunk
  async function wrapWithSources(modelStream: Response): Promise<Response> {
    if (!modelStream.body || sources.length === 0) return modelStream

    const reader = modelStream.body.getReader()
    const stream = new ReadableStream({
      async start(controller) {
        // Send sources metadata first
        controller.enqueue(sourcesChunk(enc, sources))
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
  }

  // Match jarvis-web: check if Claude CLI exists before calling, fall back to Gemini if not
  const claudeAvailable = (() => { try { return fs.existsSync(CLAUDE_CMD) } catch { return false } })()

  let modelRes: Response
  if (model === 'deepseek') modelRes = await streamDeepSeek(DEEPSEEK_API_KEY, systemCtx, message)
  else if (model === 'claude') {
    if (claudeAvailable) {
      modelRes = await streamClaude(systemCtx, contentParts)
    } else {
      // Claude CLI not available (cloud deploy) — fall back to Gemini silently
      modelRes = await streamGemini(GEMINI_API_KEY, systemCtx, contentParts)
    }
  }
  else if (model === 'ollama') modelRes = await streamOllama(systemCtx, message)
  else modelRes = await streamGemini(GEMINI_API_KEY, systemCtx, contentParts)

  return wrapWithSources(modelRes)
}
