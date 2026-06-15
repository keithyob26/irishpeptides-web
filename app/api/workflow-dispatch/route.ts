import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO = 'keithyob26/irishpeptides-jarvis'

export async function POST(req: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ ok: false, error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  const { workflow, inputs } = await req.json() as { workflow: string; inputs?: Record<string, string> }
  if (!workflow) {
    return NextResponse.json({ ok: false, error: 'workflow required' }, { status: 400 })
  }

  const safeWorkflow = workflow.replace(/[^a-zA-Z0-9._-]/g, '')
  const url = `https://api.github.com/repos/${REPO}/actions/workflows/${safeWorkflow}/dispatches`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'master', inputs: inputs ?? {} }),
      signal: AbortSignal.timeout(15000),
    })

    if (res.status === 204) {
      return NextResponse.json({ ok: true, workflow: safeWorkflow })
    }
    const body = await res.text()
    return NextResponse.json({ ok: false, status: res.status, error: body.slice(0, 300) })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

// Get last deploy info from Cloudflare Pages via GitHub commit history
export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' })
  }

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }

  try {
    // Last commit to irishpeptides-website (triggers CF Pages auto-deploy)
    const [commitsRes, runsRes] = await Promise.allSettled([
      fetch('https://api.github.com/repos/keithyob26/irishpeptides-website/commits?per_page=1', {
        headers, signal: AbortSignal.timeout(8000),
      }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=20`, {
        headers, signal: AbortSignal.timeout(8000),
      }).then(r => r.ok ? r.json() : { workflow_runs: [] }),
    ])

    const commits = commitsRes.status === 'fulfilled' ? commitsRes.value : []
    const lastCommit = Array.isArray(commits) && commits[0] ? commits[0] : null

    const runs = runsRes.status === 'fulfilled' ? (runsRes.value.workflow_runs || []) : []
    const qaRun = runs.find((r: Record<string, unknown>) =>
      String(r.path || '').includes('site-qa') || String(r.name || '').toLowerCase().includes('qa')
    )

    return NextResponse.json({
      lastDeploy: lastCommit ? {
        sha: (lastCommit.sha as string)?.slice(0, 7),
        message: (lastCommit.commit as Record<string, unknown>)?.message as string || '',
        date: ((lastCommit.commit as Record<string, unknown>)?.author as Record<string, unknown>)?.date as string || '',
        url: lastCommit.html_url as string || '',
      } : null,
      lastQA: qaRun ? {
        status: qaRun.status,
        conclusion: qaRun.conclusion,
        date: qaRun.updated_at,
        url: qaRun.html_url,
      } : null,
      autoDeployEnabled: true,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
