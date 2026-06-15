import { NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO = 'keithyob26/irishpeptides-jarvis'
const RAW = 'https://raw.githubusercontent.com/keithyob26/irishpeptides-jarvis/master'

const headers = () => ({
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

// Cron expression to human-readable schedule
function parseCron(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return cron
  const [min, hour, dom, month, dow] = parts

  const days: Record<string, string> = { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat', '7': 'Sun' }
  const hrNum = parseInt(hour)
  const minNum = parseInt(min)
  const timeStr = `${hrNum.toString().padStart(2, '0')}:${minNum.toString().padStart(2, '0')} UTC`

  if (dow !== '*' && dom === '*') {
    const dayNames = dow.split(',').map(d => days[d] || d).join('/')
    return `${dayNames} at ${timeStr}`
  }
  if (dom !== '*') return `Day ${dom} at ${timeStr}`
  if (dow === '*' && dom === '*') return `Daily at ${timeStr}`
  return cron
}

async function fetchWorkflowSchedules(): Promise<Record<string, string>> {
  const schedules: Record<string, string> = {}
  // Fetch known workflow files to extract cron schedules
  const WORKFLOW_FILES = [
    'content-engine.yml', 'ga4-monitor.yml', 'newsletter-agent.yml',
    'competitor-monitor.yml', 'affiliate-monitor.yml', 'site-qa.yml',
    'site-optimiser.yml', 'seo-loop.yml', 'plan-compliance.yml',
    'cfo-agent.yml', 'legal-compliance.yml', 'video-pipeline.yml',
    'system-health.yml', 'supermarket-scraper.yml', 'weekly-content-brief.yml',
    'daily-site-health.yml', 'first-social-post.yml', 'build-blueprint-pdf.yml',
    'client-plan-builder.yml',
  ]

  await Promise.allSettled(WORKFLOW_FILES.map(async f => {
    try {
      const r = await fetch(`${RAW}/.github/workflows/${f}`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!r.ok) return
      const text = await r.text()
      // Extract cron lines
      const cronMatches = text.matchAll(/cron:\s*['"]?([^'"#\n]+)['"]?/g)
      const cronsFound: string[] = []
      for (const match of cronMatches) {
        const cron = match[1].trim()
        cronsFound.push(parseCron(cron))
      }
      if (cronsFound.length > 0) {
        schedules[f] = cronsFound.join(' · ')
      } else if (text.includes('workflow_dispatch')) {
        schedules[f] = 'Manual trigger'
      }
    } catch {}
  }))

  return schedules
}

async function fetchSkillsMd(): Promise<string> {
  try {
    const r = await fetch(`${RAW}/skills/SKILLS.md`, { signal: AbortSignal.timeout(5000) })
    return r.ok ? r.text() : ''
  } catch { return '' }
}

function parseSkillsTable(md: string): { name: string; trigger: string; description: string; section: string }[] {
  const skills: { name: string; trigger: string; description: string; section: string }[] = []
  let currentSection = 'General'

  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) {
      currentSection = line.replace('## ', '').trim()
      continue
    }
    // Table row: | Skill Name | `@trigger` | Description |
    if (line.startsWith('|') && !line.includes('---') && !line.toLowerCase().includes('skill') && !line.toLowerCase().includes('trigger')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length >= 3) {
        const name = cells[0]
        const trigger = cells[1].replace(/`/g, '').trim()
        const description = cells[2]
        if (name && trigger && description && name !== 'Skill') {
          skills.push({ name, trigger, description, section: currentSection })
        }
      }
    }
  }

  return skills
}

export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not configured' }, { status: 500 })
  }

  try {
    const [workflowsRes, runsRes, skillsMdText, schedules] = await Promise.allSettled([
      fetch(`https://api.github.com/repos/${REPO}/actions/workflows?per_page=100`, {
        headers: headers(), signal: AbortSignal.timeout(8000),
      }).then(r => r.ok ? r.json() : { workflows: [] }),
      fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=100`, {
        headers: headers(), signal: AbortSignal.timeout(8000),
      }).then(r => r.ok ? r.json() : { workflow_runs: [] }),
      fetchSkillsMd(),
      fetchWorkflowSchedules(),
    ])

    const workflows: Record<string, unknown>[] = workflowsRes.status === 'fulfilled' ? (workflowsRes.value.workflows || []) : []
    const runs: Record<string, unknown>[] = runsRes.status === 'fulfilled' ? (runsRes.value.workflow_runs || []) : []
    const skillsMd: string = skillsMdText.status === 'fulfilled' ? skillsMdText.value : ''
    const workflowSchedules: Record<string, string> = schedules.status === 'fulfilled' ? schedules.value : {}

    // Map workflows to their latest runs
    const workflowsWithRuns = workflows.map(wf => {
      const wfRuns = runs.filter(r => r.workflow_id === wf.id)
      const latestRun = wfRuns[0] || null
      const fileName = ((wf.path as string) || '').split('/').pop() || ''
      return {
        id: wf.id,
        name: wf.name,
        path: wf.path,
        fileName,
        state: wf.state,
        schedule: workflowSchedules[fileName] || (String(wf.path || '').includes('workflow') ? 'No schedule' : ''),
        latestRun: latestRun ? {
          id: latestRun.id,
          status: latestRun.status,
          conclusion: latestRun.conclusion,
          date: latestRun.updated_at || latestRun.created_at,
          url: latestRun.html_url,
          runNumber: latestRun.run_number,
        } : null,
      }
    })

    const skills = parseSkillsTable(skillsMd)

    return NextResponse.json({
      workflows: workflowsWithRuns,
      skills,
      totalWorkflows: workflowsWithRuns.length,
      totalSkills: skills.length,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
