import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN    = process.env.GITHUB_TOKEN || ''
const BUFFER_TOKEN    = process.env.BUFFER_ACCESS_TOKEN || ''
const RESEND_API_KEY  = process.env.RESEND_API_KEY || ''
const OUTCOMES_REPO   = 'keithyob26/irishpeptides-jarvis'
const WEBSITE_REPO    = 'keithyob26/irishpeptides-website'
const OUTCOMES_PATH   = 'memory/outcomes.json'

// ── Update outcome status in GitHub ──────────────────────────────────────────

async function updateOutcomeStatus(id: string, status: string): Promise<void> {
  if (!GITHUB_TOKEN) return
  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${OUTCOMES_REPO}/contents/${OUTCOMES_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }, cache: 'no-store' }
    )
    if (!getRes.ok) return
    const data = await getRes.json()
    const parsed = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
    const outcomes: Record<string, unknown>[] = parsed.outcomes || []
    const updated = outcomes.map((o: Record<string, unknown>) =>
      o.id === id ? { ...o, status, published_at: new Date().toISOString() } : o
    )
    parsed.outcomes = updated
    await fetch(
      `https://api.github.com/repos/${OUTCOMES_REPO}/contents/${OUTCOMES_PATH}`,
      {
        method: 'PUT',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `chore: mark outcome ${id} as ${status}`,
          content: Buffer.from(JSON.stringify(parsed, null, 2)).toString('base64'),
          sha: data.sha,
        }),
      }
    )
  } catch {}
}

// ── Buffer: schedule social post ──────────────────────────────────────────────

async function publishToBuffer(content: string, profileIds?: string[]): Promise<{ ok: boolean; error?: string }> {
  if (!BUFFER_TOKEN) return { ok: false, error: 'BUFFER_ACCESS_TOKEN not configured' }
  try {
    // Get profile IDs if not provided
    let profiles = profileIds
    if (!profiles || profiles.length === 0) {
      const pRes = await fetch('https://api.bufferapp.com/1/profiles.json', {
        headers: { Authorization: `Bearer ${BUFFER_TOKEN}` },
        signal: AbortSignal.timeout(8000),
      })
      if (pRes.ok) {
        const pData = await pRes.json()
        profiles = (pData as { id: string }[]).slice(0, 2).map((p) => p.id)
      }
    }
    if (!profiles || profiles.length === 0) return { ok: false, error: 'No Buffer profiles found' }

    const res = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: { Authorization: `Bearer ${BUFFER_TOKEN}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        text: content.slice(0, 500),
        ...Object.fromEntries(profiles.map((id, i) => [`profile_ids[${i}]`, id])),
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
      }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `Buffer ${res.status}: ${err.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ── Resend: send newsletter ───────────────────────────────────────────────────

async function publishToResend(subject: string, htmlContent: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, error: 'RESEND_API_KEY not configured' }
  try {
    // Get audiences to find recipient list
    const audRes = await fetch('https://api.resend.com/audiences', {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      signal: AbortSignal.timeout(6000),
    })
    let audienceId = ''
    if (audRes.ok) {
      const aud = await audRes.json()
      audienceId = aud.data?.[0]?.id || ''
    }

    const body: Record<string, unknown> = {
      from: 'Irish Peptides <newsletter@irishpeptides.ie>',
      to: ['keith.obeirne@greyhoundrecycling.com'],
      subject,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">${htmlContent.replace(/\n/g, '<br>')}</div>`,
    }
    if (audienceId) body.audience_id = audienceId

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `Resend ${res.status}: ${err.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ── GitHub: commit blog post to irishpeptides-website ────────────────────────

async function publishToBlog(slug: string, content: string, date: string): Promise<{ ok: boolean; error?: string }> {
  if (!GITHUB_TOKEN) return { ok: false, error: 'GITHUB_TOKEN not configured' }
  try {
    const fileName = `_posts/${date}-${slug.replace(/\s+/g, '-').toLowerCase().slice(0, 60)}.md`
    const fileContent = `---\nlayout: post\ntitle: "${slug}"\ndate: ${date}\ncategories: peptides nutrition\n---\n\n${content}`

    // Check if file exists to get SHA for update
    const checkRes = await fetch(
      `https://api.github.com/repos/${WEBSITE_REPO}/contents/${fileName}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' } }
    )
    const checkData = checkRes.ok ? await checkRes.json() : null

    const body: Record<string, unknown> = {
      message: `feat: publish blog post — ${slug.slice(0, 60)}`,
      content: Buffer.from(fileContent).toString('base64'),
    }
    if (checkData?.sha) body.sha = checkData.sha

    const res = await fetch(
      `https://api.github.com/repos/${WEBSITE_REPO}/contents/${fileName}`,
      {
        method: 'PUT',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      }
    )
    if (!res.ok) {
      const err = await res.text()
      return { ok: false, error: `GitHub ${res.status}: ${err.slice(0, 200)}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ── CallMeBot WhatsApp notification ──────────────────────────────────────────

async function sendWhatsApp(message: string): Promise<void> {
  const key = process.env.CALLMEBOT_API_KEY || '7883019'
  const phone = process.env.CALLMEBOT_PHONE || '353896554700'
  const encoded = encodeURIComponent(message)
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${key}`
  try {
    await fetch(url, { signal: AbortSignal.timeout(6000) })
  } catch {}
}

// ── POST /api/publish ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { id, action, type, content, title, slug, date, reason } = await req.json() as {
    id: string
    action: 'approve' | 'reject'
    type: string
    content: string
    title?: string
    slug?: string
    date?: string
    reason?: string
  }

  if (action === 'reject') {
    await updateOutcomeStatus(id, 'rejected')
    // If rejection reason provided, re-queue for rewrite via workflow dispatch
    if (reason && process.env.GITHUB_TOKEN) {
      try {
        await fetch(`https://api.github.com/repos/${OUTCOMES_REPO}/actions/workflows/content-engine.yml/dispatches`, {
          method: 'POST',
          headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref: 'master', inputs: { topic: title || id, feedback: reason } }),
          signal: AbortSignal.timeout(8000),
        })
      } catch {}
    }
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // Approve — publish based on content type
  const results: Record<string, unknown> = {}
  const publishDate = date || new Date().toISOString().split('T')[0]

  if (type === 'blog' || type === 'blog_post') {
    const r = await publishToBlog(slug || title || 'new-post', content, publishDate)
    results.blog = r
  } else if (type === 'newsletter') {
    const r = await publishToResend(title || 'Irish Peptides Newsletter', content)
    results.newsletter = r
  } else {
    const r = await publishToBuffer(content)
    results.social = r
  }

  const anyFailed = Object.values(results).some((r) => !(r as { ok: boolean }).ok)
  const newStatus = anyFailed ? 'approved' : 'published'
  await updateOutcomeStatus(id, newStatus)

  // WhatsApp confirmation
  const blogSlug = (slug || title || 'post').replace(/\s+/g, '-').toLowerCase().slice(0, 60)
  const isBlog = type === 'blog' || type === 'blog_post'
  const statusMsg = anyFailed
    ? `Irish Peptides: "${title || type}" approved — pending manual publish. Check dashboard.`
    : isBlog
      ? `Irish Peptides blog published: "${title || slug}" — https://irishpeptides.ie/blog/${blogSlug}`
      : `Irish Peptides: "${title || type}" published successfully.`
  await sendWhatsApp(statusMsg)

  return NextResponse.json({ ok: true, status: newStatus, results })
}

// ── GET /api/publish — notify when new content pending ───────────────────────

export async function GET() {
  // Called by content agents after writing to outcomes.json
  // Sends WhatsApp alert for pending approval items
  const key = process.env.CALLMEBOT_API_KEY || '7883019'
  if (!key || !GITHUB_TOKEN) return NextResponse.json({ ok: false })

  try {
    const r = await fetch(`https://raw.githubusercontent.com/${OUTCOMES_REPO}/master/${OUTCOMES_PATH}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!r.ok) return NextResponse.json({ ok: false })
    const d = await r.json()
    const pending = (d.outcomes || []).filter((o: Record<string, unknown>) => o.status === 'pending_approval')
    if (pending.length > 0) {
      const titles = pending.slice(0, 3).map((o: Record<string, unknown>) => o.title || o.action).join(', ')
      await sendWhatsApp(`Irish Peptides: ${pending.length} item(s) pending approval — ${titles}. View at irishpeptides-web.vercel.app/content`)
    }
    return NextResponse.json({ ok: true, pending: pending.length })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
