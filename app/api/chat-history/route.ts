import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO = 'keithyob26/irishpeptides-jarvis'
const FILE_PATH = 'memory/chat_history.json'
const MAX_CONVERSATIONS = 50

interface Conversation {
  id: string
  title: string
  messages: { role: string; content: string }[]
  created_at: string
  updated_at: string
}

interface HistoryFile {
  conversations: Conversation[]
}

async function readHistory(): Promise<{ data: HistoryFile; sha: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'irishpeptides-jarvis' }, signal: AbortSignal.timeout(10000) }
  )
  if (res.status === 404) {
    return { data: { conversations: [] }, sha: '' }
  }
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const json = await res.json()
  const content = Buffer.from(json.content, 'base64').toString('utf-8')
  return { data: JSON.parse(content), sha: json.sha }
}

export async function GET() {
  try {
    const { data, sha } = await readHistory()
    return NextResponse.json({ ...data, sha })
  } catch (e) {
    return NextResponse.json({ conversations: [], sha: '', error: String(e) })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { conversation: Conversation }
    const { conversation } = body
    if (!conversation?.id) return NextResponse.json({ error: 'Missing conversation.id' }, { status: 400 })

    const { data, sha } = await readHistory()
    const idx = data.conversations.findIndex(c => c.id === conversation.id)
    if (idx >= 0) {
      data.conversations[idx] = conversation
    } else {
      data.conversations.unshift(conversation)
    }
    // Keep last MAX_CONVERSATIONS, sorted newest first
    data.conversations = data.conversations
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, MAX_CONVERSATIONS)

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
    const putRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'irishpeptides-jarvis',
        },
        body: JSON.stringify({
          message: `chat: update history ${new Date().toISOString()}`,
          content,
          ...(sha ? { sha } : {}),
        }),
        signal: AbortSignal.timeout(10000),
      }
    )
    if (!putRes.ok) {
      const err = await putRes.text()
      return NextResponse.json({ error: err }, { status: 500 })
    }
    const newSha = (await putRes.json()).content?.sha ?? ''
    return NextResponse.json({ ok: true, sha: newSha })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string }
    const { data, sha } = await readHistory()
    data.conversations = data.conversations.filter(c => c.id !== id)
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
    await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'irishpeptides-jarvis',
      },
      body: JSON.stringify({ message: `chat: delete conversation ${id}`, content, sha }),
      signal: AbortSignal.timeout(10000),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
