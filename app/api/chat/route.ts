import { NextRequest, NextResponse } from 'next/server'

const BRAND_CTX = `You are Jarvis, the AI assistant for Irish Peptides & Nutrition — an Irish sports nutrition and peptide education brand by Keith O'Beirne. Answer like a smart, friendly colleague who knows the business inside out. Use short conversational sentences. Never use bullet points or headers in chat responses. If you have live data, weave it in naturally. Always add context and a suggestion after data. For educational and research purposes only — never give medical advice.`

async function fetchResendCount(key: string): Promise<number> {
  try {
    const r = await fetch('https://api.resend.com/audiences', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return 0
    const d = await r.json()
    const audiences: { total_subscriptions?: number }[] = d.data ?? []
    return audiences.reduce((sum, a) => sum + (a.total_subscriptions ?? 0), 0)
  } catch { return 0 }
}

// Unified SSE format: data: {"text":"chunk"}\n\n  →  data: [DONE]\n\n
function makeEncoder() {
  return new TextEncoder()
}

function textChunk(enc: TextEncoder, text: string): Uint8Array {
  return enc.encode(`data: ${JSON.stringify({ text })}\n\n`)
}

function doneChunk(enc: TextEncoder): Uint8Array {
  return enc.encode('data: [DONE]\n\n')
}

async function streamGemini(
  apiKey: string,
  systemCtx: string,
  contentParts: unknown[],
): Promise<Response> {
  // Gemini parts format
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
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
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(textChunk(enc, `Gemini error: ${res.status} — ${err.slice(0, 200)}`))
        c.enqueue(doneChunk(enc))
        c.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  }

  const enc = makeEncoder()
  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
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
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' }
  })
}

async function streamDeepSeek(
  apiKey: string,
  systemCtx: string,
  message: string,
): Promise<Response> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemCtx },
        { role: 'user', content: message },
      ],
      stream: true,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok || !res.body) {
    const err = await res.text()
    const enc = makeEncoder()
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(textChunk(enc, `DeepSeek error: ${res.status} — ${err.slice(0, 200)}`))
        c.enqueue(doneChunk(enc))
        c.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  }

  const enc = makeEncoder()
  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
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
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' }
  })
}

async function streamClaude(
  apiKey: string,
  systemCtx: string,
  contentParts: unknown[],
): Promise<Response> {
  if (!apiKey) {
    const enc = makeEncoder()
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(textChunk(enc, 'Claude requires ANTHROPIC_API_KEY. Add it to Vercel environment variables at vercel.com/keithyob26/irishpeptides-web/settings/environment-variables to activate.'))
        c.enqueue(doneChunk(enc))
        c.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemCtx,
      messages: [{ role: 'user', content: contentParts }],
      stream: true,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok || !res.body) {
    const err = await res.text()
    const enc = makeEncoder()
    const stream = new ReadableStream({
      start(c) {
        c.enqueue(textChunk(enc, `Claude error: ${res.status} — ${err.slice(0, 200)}`))
        c.enqueue(doneChunk(enc))
        c.close()
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } })
  }

  const enc = makeEncoder()
  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
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
            try {
              const parsed = JSON.parse(raw)
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                controller.enqueue(textChunk(enc, parsed.delta.text))
              }
            } catch {}
          }
        }
      } finally {
        controller.enqueue(doneChunk(enc))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' }
  })
}

export async function POST(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

  let message = ''
  let model = 'gemini'
  const contentParts: unknown[] = []

  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    message = (form.get('message') as string) || ''
    model = (form.get('model') as string) || 'gemini'
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
    model = body.model || 'gemini'
  }

  if (!message?.trim() && contentParts.length === 0) {
    return NextResponse.json({ error: 'No message' }, { status: 400 })
  }

  // Inject live data snippets
  const liveData: string[] = []
  const q = message.toLowerCase()
  if ((q.includes('subscriber') || q.includes('email') || q.includes('newsletter')) && process.env.RESEND_API_KEY) {
    const count = await fetchResendCount(process.env.RESEND_API_KEY)
    liveData.push(`[LIVE] Resend subscribers: ${count}`)
  }
  const systemCtx = BRAND_CTX + (liveData.length ? '\n\nLive data:\n' + liveData.join('\n') : '')

  contentParts.push({ type: 'text', text: message })

  if (model === 'deepseek') return streamDeepSeek(DEEPSEEK_API_KEY, systemCtx, message)
  if (model === 'claude') return streamClaude(ANTHROPIC_API_KEY, systemCtx, contentParts)
  return streamGemini(GEMINI_API_KEY, systemCtx, contentParts)
}
