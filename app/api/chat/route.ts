import { NextRequest, NextResponse } from 'next/server'

const BRAND_CTX = `You are Jarvis, the AI assistant for Irish Peptides & Nutrition — an Irish sports nutrition and peptide education brand by Keith O'Beirne. Answer like a smart, friendly colleague who knows the business inside out. Use short conversational sentences. Never use bullet points or headers in chat responses. If you have live data, weave it in naturally. Always add context and a suggestion after data. For educational and research purposes only — never give medical advice.`

async function fetchResendCount(key: string): Promise<number> {
  try {
    const r = await fetch('https://api.resend.com/audiences', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) return 0
    const d = await r.json()
    const audiences: { total_subscriptions?: number }[] = d.data ?? []
    return audiences.reduce((sum, a) => sum + (a.total_subscriptions ?? 0), 0)
  } catch { return 0 }
}

export async function POST(req: NextRequest) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({
      reply: "ANTHROPIC_API_KEY not configured. Add it to Vercel environment variables to enable Claude chat."
    })
  }

  let message = ''
  const contentParts: unknown[] = []

  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    message = (form.get('message') as string) || ''
    const files = form.getAll('file') as File[]

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf'

      if (file.type.startsWith('image/')) {
        contentParts.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        })
      } else if (file.type === 'application/pdf') {
        contentParts.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        })
      }
    }
  } else {
    const body = await req.json() as { message?: string }
    message = body.message || ''
  }

  if (!message?.trim() && contentParts.length === 0) {
    return NextResponse.json({ error: 'No message' }, { status: 400 })
  }

  // Build live-data context snippets
  const liveDataParts: string[] = []
  const q = message.toLowerCase()

  if (q.includes('subscriber') || q.includes('email') || q.includes('newsletter')) {
    if (process.env.RESEND_API_KEY) {
      const count = await fetchResendCount(process.env.RESEND_API_KEY)
      liveDataParts.push(`[LIVE] Resend subscribers: ${count}`)
    }
  }

  const systemCtx = BRAND_CTX +
    (liveDataParts.length > 0 ? '\n\nLive data:\n' + liveDataParts.join('\n') : '')

  contentParts.push({ type: 'text', text: message })

  // Call Anthropic with streaming
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
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

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text()
    return NextResponse.json({ reply: `Anthropic error: ${anthropicRes.status} — ${err.slice(0, 200)}` })
  }

  // Proxy the SSE stream directly to the client
  return new Response(anthropicRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
