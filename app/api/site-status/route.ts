import { NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const SITE_REPO = 'keithyob26/irishpeptides-website'
const JARVIS_REPO = 'keithyob26/irishpeptides-jarvis'

export async function GET() {
  if (!GITHUB_TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN not set' })

  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'irishpeptides-jarvis',
  }

  try {
    const [siteCommits, jarvisStatus] = await Promise.allSettled([
      fetch(`https://api.github.com/repos/${SITE_REPO}/commits?per_page=10`, {
        headers, cache: 'no-store',
      }).then(r => r.ok ? r.json() : []),
      fetch(`https://api.github.com/repos/${JARVIS_REPO}/commits?per_page=5`, {
        headers, cache: 'no-store',
      }).then(r => r.ok ? r.json() : []),
    ])

    const siteCommitsData = siteCommits.status === 'fulfilled' ? siteCommits.value : []
    const jarvisCommitsData = jarvisStatus.status === 'fulfilled' ? jarvisStatus.value : []

    const formatCommits = (commits: Record<string, unknown>[]) =>
      commits.map(c => ({
        sha: (c.sha as string)?.slice(0, 7),
        message: (c.commit as Record<string, unknown>)?.message as string || '',
        author: ((c.commit as Record<string, unknown>)?.author as Record<string, unknown>)?.name as string || '',
        date: ((c.commit as Record<string, unknown>)?.author as Record<string, unknown>)?.date as string || '',
        url: c.html_url as string || '',
      }))

    return NextResponse.json({
      siteCommits: formatCommits(Array.isArray(siteCommitsData) ? siteCommitsData : []),
      jarvisCommits: formatCommits(Array.isArray(jarvisCommitsData) ? jarvisCommitsData : []),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) })
  }
}
