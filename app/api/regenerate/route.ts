import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN || ''
const GEMINI_KEY    = process.env.GEMINI_API_KEY || ''
const DEEPSEEK_KEY  = process.env.DEEPSEEK_API_KEY || ''
const OUTCOMES_REPO = 'keithyob26/irishpeptides-jarvis'
const OUTCOMES_PATH = 'memory/outcomes.json'

const SYSTEM_PROMPT = `You are an Irish fitness and nutrition social media expert writing for Irish Peptides (irishpeptides.ie). Write compelling, authentic social posts targeting Irish gym-goers and fitness enthusiasts. Always include relevant hashtags ending with #IrishPeptides.`

async function callGemini(content: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not configured')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nRewrite this social post keeping all product facts (name, price, protein stats). Return ONLY the post text:\n\n${content}` }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
      }),
      signal: AbortSignal.timeout(15000),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

async function callDeepSeek(content: string): Promise<string> {
  if (!DEEPSEEK_KEY) throw new Error('DEEPSEEK_API_KEY not configured')
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Rewrite this social post keeping all product facts (name, price, protein stats). Return ONLY the post text:\n\n${content}` },
      ],
      max_tokens: 500,
      temperature: 0.8,
    }),
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`DeepSeek ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ''
}


export async function POST(req: NextRequest) {
  const { id, model } = await req.json() as { id: string; model: string }
  if (!id || !model) return NextResponse.json({ error: 'id and model required' }, { status: 400 })

  // Fetch current outcomes.json
  if (!GITHUB_TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  const getRes = await fetch(
    `https://api.github.com/repos/${OUTCOMES_REPO}/contents/${OUTCOMES_PATH}`,
    { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }, cache: 'no-store' }
  )
  if (!getRes.ok) return NextResponse.json({ error: 'Failed to fetch outcomes.json' }, { status: 500 })
  const fileData = await getRes.json()
  const parsed = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'))
  const outcomes: Record<string, unknown>[] = parsed.outcomes || []
  const target = outcomes.find((o) => o.id === id)
  if (!target) return NextResponse.json({ error: `Outcome ${id} not found` }, { status: 404 })

  const originalContent = (target.content as string) || ''
  let newContent = ''
  try {
    if (model === 'deepseek') newContent = await callDeepSeek(originalContent)
    else newContent = await callGemini(originalContent) // default + fallback for gemini
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }

  if (!newContent) return NextResponse.json({ error: 'AI returned empty response' }, { status: 502 })

  // Update outcomes.json
  const updated = outcomes.map((o) =>
    o.id === id ? { ...o, content: newContent, model, regenerated_at: new Date().toISOString() } : o
  )
  parsed.outcomes = updated
  const putRes = await fetch(
    `https://api.github.com/repos/${OUTCOMES_REPO}/contents/${OUTCOMES_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `feat: regenerate outcome ${id} with ${model}`,
        content: Buffer.from(JSON.stringify(parsed, null, 2)).toString('base64'),
        sha: fileData.sha,
      }),
    }
  )
  if (!putRes.ok) return NextResponse.json({ error: 'Failed to save regenerated content' }, { status: 500 })

  return NextResponse.json({ ok: true, content: newContent, model })
}

