import { NextResponse } from 'next/server'

type KeyResult = {
  status: 'ok' | 'warn' | 'missing' | 'error'
  note?: string
}

async function testGemini(key: string): Promise<KeyResult> {
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1`,
      { signal: AbortSignal.timeout(5000) }
    )
    return r.ok ? { status: 'ok' } : { status: 'error', note: `HTTP ${r.status}` }
  } catch {
    return { status: 'error', note: 'timeout' }
  }
}

async function testDeepSeek(key: string): Promise<KeyResult> {
  try {
    const r = await fetch('https://api.deepseek.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    return r.ok ? { status: 'ok' } : { status: 'error', note: `HTTP ${r.status}` }
  } catch {
    return { status: 'error', note: 'timeout' }
  }
}

async function testNotion(key: string): Promise<KeyResult> {
  try {
    const r = await fetch('https://api.notion.com/v1/users/me', {
      headers: { Authorization: `Bearer ${key}`, 'Notion-Version': '2022-06-28' },
      signal: AbortSignal.timeout(5000),
    })
    return r.ok ? { status: 'ok' } : { status: 'error', note: `HTTP ${r.status}` }
  } catch {
    return { status: 'error', note: 'timeout' }
  }
}

async function testGitHub(key: string): Promise<KeyResult> {
  try {
    const r = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    if (r.ok) {
      const d = await r.json()
      return { status: 'ok', note: d.login }
    }
    return { status: 'error', note: `HTTP ${r.status}` }
  } catch {
    return { status: 'error', note: 'timeout' }
  }
}

async function testResend(key: string): Promise<KeyResult> {
  try {
    const r = await fetch('https://api.resend.com/audiences', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    return r.ok ? { status: 'ok' } : { status: 'error', note: `HTTP ${r.status}` }
  } catch {
    return { status: 'error', note: 'timeout' }
  }
}

async function testManyChat(key: string): Promise<KeyResult> {
  try {
    const r = await fetch('https://api.manychat.com/fb/page/getInfo', {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    })
    if (r.status === 401) return { status: 'warn', note: 'Regenerate at app.manychat.com → Settings → API' }
    return r.ok ? { status: 'ok' } : { status: 'error', note: `HTTP ${r.status}` }
  } catch {
    return { status: 'error', note: 'timeout' }
  }
}

export async function GET() {
  const env = process.env

  const checks = await Promise.allSettled([
    env.GEMINI_API_KEY    ? testGemini(env.GEMINI_API_KEY)   : Promise.resolve<KeyResult>({ status: 'missing' }),
    env.DEEPSEEK_API_KEY  ? testDeepSeek(env.DEEPSEEK_API_KEY) : Promise.resolve<KeyResult>({ status: 'missing' }),
    env.NOTION_API_KEY    ? testNotion(env.NOTION_API_KEY)   : Promise.resolve<KeyResult>({ status: 'missing' }),
    env.GITHUB_TOKEN      ? testGitHub(env.GITHUB_TOKEN)     : Promise.resolve<KeyResult>({ status: 'missing' }),
    env.RESEND_API_KEY    ? testResend(env.RESEND_API_KEY)   : Promise.resolve<KeyResult>({ status: 'missing' }),
    env.MANYCHAT_API_KEY  ? testManyChat(env.MANYCHAT_API_KEY) : Promise.resolve<KeyResult>({ status: 'missing' }),
  ])

  const [gemini, deepseek, notion, github, resend, manychat] = checks.map(c =>
    c.status === 'fulfilled' ? c.value : { status: 'error' as const, note: 'check failed' }
  )

  return NextResponse.json({
    GEMINI_API_KEY:    gemini,
    DEEPSEEK_API_KEY:  deepseek,
    NOTION_API_KEY:    notion,
    GITHUB_TOKEN:      github,
    RESEND_API_KEY:    resend,
    MANYCHAT_API_KEY:  manychat,
    GA4_SERVICE_ACCOUNT_JSON: { status: env.GA4_SERVICE_ACCOUNT_JSON ? 'ok' : 'missing' },
    BUFFER_ACCESS_TOKEN:      { status: env.BUFFER_ACCESS_TOKEN ? 'ok' : 'missing' },
    ANTHROPIC_API_KEY:        { status: env.ANTHROPIC_API_KEY ? 'ok' : 'missing' },
    STRIPE_API_KEY:           { status: env.STRIPE_API_KEY ? 'ok' : 'missing' },
    CALLMEBOT_API_KEY:        { status: env.CALLMEBOT_API_KEY ? 'ok' : 'missing' },
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
