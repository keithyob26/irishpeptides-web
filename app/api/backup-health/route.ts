import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const GITHUB_TOKEN  = process.env.GITHUB_TOKEN
const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_PAGE_ID = '37da0eb7-e3ea-819e-af5b-e76db92a7c8c'

const REPOS = [
  'irishpeptides-jarvis',
  'irishpeptides-web',
  'irishpeptides-desktop',
  'irishpeptides-website',
] as const

type RepoKey = typeof REPOS[number]
type BackupStatus = 'ok' | 'stale' | 'missing' | 'unknown'

interface RepoHealth {
  repo: RepoKey
  status: BackupStatus
  last_backup: string | null
  age_hours: number | null
  detail: string
}

async function fetchBackupStatus(): Promise<Record<string, { last_backup: string | null; status: string }>> {
  if (!GITHUB_TOKEN) return {}

  const url = 'https://api.github.com/repos/keithyob26/irishpeptides-jarvis/contents/memory/backup_status.json'
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  })

  if (!res.ok) return {}

  const data = await res.json()
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  const parsed = JSON.parse(content)
  return parsed.repos || {}
}

async function createNotionAlert(repo: string): Promise<void> {
  if (!NOTION_API_KEY) return

  const msg = `⚠️ Backup stale/missing: ${repo} — last backup >24h ago or never — check post-commit hook`

  await fetch(`https://api.notion.com/v1/blocks/${NOTION_PAGE_ID}/children`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      children: [{
        object: 'block',
        type: 'to_do',
        to_do: {
          rich_text: [{ type: 'text', text: { content: msg } }],
          checked: false,
        },
      }],
    }),
  }).catch(() => {})
}

export async function GET() {
  const repos = await fetchBackupStatus()
  const now = new Date()

  const health: RepoHealth[] = []
  const alertedRepos: string[] = []

  for (const repo of REPOS) {
    const entry = repos[repo]
    if (!entry || !entry.last_backup) {
      health.push({
        repo,
        status: 'missing',
        last_backup: null,
        age_hours: null,
        detail: 'No backup recorded — run git commit to trigger post-commit hook',
      })
      alertedRepos.push(repo)
      continue
    }

    const lastBackup = new Date(entry.last_backup)
    const ageMs    = now.getTime() - lastBackup.getTime()
    const ageHours = Math.round(ageMs / (1000 * 60 * 60) * 10) / 10

    let status: BackupStatus
    let detail: string

    if (ageHours <= 24) {
      status = 'ok'
      detail = `Backed up ${ageHours}h ago`
    } else if (ageHours <= 72) {
      status = 'stale'
      detail = `Last backup ${ageHours}h ago — make a commit to refresh`
      alertedRepos.push(repo)
    } else {
      status = 'stale'
      detail = `Last backup ${Math.round(ageHours / 24)}d ago — check post-commit hook`
      alertedRepos.push(repo)
    }

    health.push({ repo, status, last_backup: entry.last_backup, age_hours: ageHours, detail })
  }

  // Create Notion alerts for stale/missing repos
  await Promise.allSettled(alertedRepos.map(repo => createNotionAlert(repo)))

  const summary = {
    ok:      health.filter(h => h.status === 'ok').length,
    stale:   health.filter(h => h.status === 'stale').length,
    missing: health.filter(h => h.status === 'missing').length,
  }

  return NextResponse.json({
    health,
    summary,
    checked_at: now.toISOString(),
    source: 'keithyob26/irishpeptides-jarvis/memory/backup_status.json',
  })
}
