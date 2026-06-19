import { NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO = 'keithyob26/irishpeptides-jarvis'
const FILE_PATH = 'memory/seo_keywords.json'

async function fetchFile(): Promise<{ data: { keywords: string[]; updated_at?: string }; sha: string }> {
  if (!GITHUB_TOKEN) return { data: { keywords: [] }, sha: '' }
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' },
      cache: 'no-store',
    }
  )
  if (!res.ok) return { data: { keywords: [] }, sha: '' }
  const raw = await res.json()
  const content = Buffer.from(raw.content as string, 'base64').toString('utf-8')
  return { data: JSON.parse(content), sha: raw.sha as string }
}

async function writeFile(data: { keywords: string[]; updated_at?: string }, sha: string, msg: string) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
  return fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: msg, content, sha }),
    }
  )
}

export async function GET() {
  try {
    const { data } = await fetchFile()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ keywords: [] })
  }
}

export async function POST(req: Request) {
  if (!GITHUB_TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 })
  const { keyword } = await req.json() as { keyword: string }
  const kw = keyword?.trim()
  if (!kw) return NextResponse.json({ error: 'keyword required' }, { status: 400 })

  const { data, sha } = await fetchFile()
  if (!data.keywords.includes(kw)) {
    data.keywords.push(kw)
    data.updated_at = new Date().toISOString().slice(0, 10)
  }

  const r = await writeFile(data, sha, `feat: track SEO keyword "${kw}"`)
  if (!r.ok) return NextResponse.json({ error: 'GitHub write failed' }, { status: 500 })
  return NextResponse.json({ ok: true, keywords: data.keywords })
}

export async function DELETE(req: Request) {
  if (!GITHUB_TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 })
  const { keyword } = await req.json() as { keyword: string }

  const { data, sha } = await fetchFile()
  data.keywords = data.keywords.filter((k: string) => k !== keyword)
  data.updated_at = new Date().toISOString().slice(0, 10)

  await writeFile(data, sha, `feat: remove SEO keyword "${keyword}"`)
  return NextResponse.json({ ok: true, keywords: data.keywords })
}
