import { NextRequest, NextResponse } from 'next/server'

const BRAND_CTX = `You are Jarvis, the AI assistant for Irish Peptides & Nutrition — an Irish sports nutrition and peptide education brand. Answer like a smart, friendly colleague who knows the business inside out. Use short conversational sentences. Never use bullet points or headers in chat responses. If you have live data, weave it in naturally like: "You have 12 subscribers right now" not "Subscribers: 12". Always add context and a suggestion after data.`

async function fetchResendCount(key: string): Promise<number> {
  try {
    const r = await fetch('https://api.resend.com/audiences', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) return 0
    const d = await r.json()
    const audiences: { total_subscriptions?: number }[] = d.data ?? []
    return audiences.reduce((sum: number, a) => sum + (a.total_subscriptions ?? 0), 0)
  } catch { return 0 }
}

async function fetchStripeRevenue(key: string): Promise<{ total: number; count: number }> {
  try {
    const ts30 = Math.floor(Date.now() / 1000) - 30 * 86400
    const r = await fetch(`https://api.stripe.com/v1/charges?limit=50&created[gte]=${ts30}`, {
      headers: { Authorization: `Basic ${Buffer.from(key + ':').toString('base64')}` },
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return { total: 0, count: 0 }
    const d = await r.json()
    const charges: { amount?: number; paid?: boolean }[] = d.data ?? []
    const total = charges.filter(c => c.paid).reduce((s, c) => s + (c.amount ?? 0), 0) / 100
    return { total, count: charges.length }
  } catch { return { total: 0, count: 0 } }
}

async function callGemini(key: string, systemCtx: string, userMessage: string): Promise<string> {
  const body = {
    contents: [
      { role: 'user', parts: [{ text: `System context:\n${systemCtx}\n\nUser: ${userMessage}` }] }
    ],
    generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
  }
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) }
  )
  if (!r.ok) throw new Error(`Gemini ${r.status}`)
  const d = await r.json()
  return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '(no response)'
}

async function callDeepSeek(key: string, systemCtx: string, userMessage: string): Promise<string> {
  const body = {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemCtx },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 400,
    temperature: 0.7,
  }
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })
  if (!r.ok) throw new Error(`DeepSeek ${r.status}`)
  const d = await r.json()
  return d.choices?.[0]?.message?.content ?? '(no response)'
}

export async function POST(req: NextRequest) {
  const { message, model = 'gemini' } = await req.json() as { message: string; model?: string }
  if (!message?.trim()) return NextResponse.json({ error: 'No message' }, { status: 400 })

  const env = process.env
  const q = message.toLowerCase()

  // Build live-data context
  const liveDataParts: string[] = []

  if (q.includes('subscriber') || q.includes('email') || q.includes('newsletter') || q.includes('list')) {
    if (env.RESEND_API_KEY) {
      const count = await fetchResendCount(env.RESEND_API_KEY)
      liveDataParts.push(`[LIVE] Resend subscribers: ${count}`)
    }
  }

  if (q.includes('revenue') || q.includes('money') || q.includes('stripe') || q.includes('sales') || q.includes('made')) {
    if (env.STRIPE_API_KEY) {
      const stripe = await fetchStripeRevenue(env.STRIPE_API_KEY)
      liveDataParts.push(`[LIVE] Stripe last 30 days: €${stripe.total.toFixed(2)} from ${stripe.count} transactions`)
    } else {
      liveDataParts.push('[INFO] Stripe not connected yet — can\'t show revenue')
    }
  }

  const systemCtx = BRAND_CTX + (liveDataParts.length > 0 ? '\n\nLive data:\n' + liveDataParts.join('\n') : '')

  let reply = ''
  try {
    if (model === 'deepseek' && env.DEEPSEEK_API_KEY) {
      reply = await callDeepSeek(env.DEEPSEEK_API_KEY, systemCtx, message)
    } else if (env.GEMINI_API_KEY) {
      reply = await callGemini(env.GEMINI_API_KEY, systemCtx, message)
    } else if (env.DEEPSEEK_API_KEY) {
      reply = await callDeepSeek(env.DEEPSEEK_API_KEY, systemCtx, message)
    } else {
      reply = "No AI keys configured yet. Add GEMINI_API_KEY or DEEPSEEK_API_KEY to the Vercel environment variables."
    }
  } catch (e) {
    reply = `AI error: ${e instanceof Error ? e.message : 'unknown'}`
  }

  return NextResponse.json({ reply })
}
