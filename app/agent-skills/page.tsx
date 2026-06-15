'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface AgentInfo {
  name: string
  file: string
  description: string
  workflow: string | null
  workflowFile: string | null
  lastRun: { status: string; conclusion: string | null; date: string; url: string } | null
  skills: string[]
}

const KNOWN_AGENTS: { file: string; description: string; skills: string[] }[] = [
  { file: 'content_studio.py', description: 'Generates blog posts, social content, SEO pages from brand voice guidelines', skills: ['irishpeptides.md', 'CONTEXT.md', 'SKILLS.md'] },
  { file: 'seo_agent.py', description: 'Keyword research, competitor analysis, meta tag optimization', skills: ['CONTEXT.md', 'SKILLS.md'] },
  { file: 'social_agent.py', description: 'Schedules posts to Buffer, triggers ManyChat keyword flows', skills: ['irishpeptides.md', 'CONTEXT.md'] },
  { file: 'newsletter_agent.py', description: 'Drafts and sends newsletters via Resend', skills: ['irishpeptides.md', 'CONTEXT.md'] },
  { file: 'analytics_agent.py', description: 'Pulls GA4 data, formats weekly traffic report', skills: ['CONTEXT.md'] },
  { file: 'revenue_agent.py', description: 'Stripe revenue tracking and monthly summaries', skills: ['CONTEXT.md'] },
  { file: 'competitor_agent.py', description: 'Monitors competitor sites for price and content changes', skills: ['CONTEXT.md', 'SKILLS.md'] },
  { file: 'site_qa_agent.py', description: 'Playwright smoke tests on irishpeptides.ie — checks all pages load, forms work', skills: ['CONTEXT.md'] },
  { file: 'callmebot_agent.py', description: 'Sends WhatsApp notifications for important events', skills: ['CONTEXT.md'] },
  { file: 'memory_agent.py', description: 'Syncs outcomes.db to outcomes.json for GitHub commit', skills: ['CONTEXT.md'] },
  { file: 'brain_agent.py', description: 'Updates the knowledge graph (brain.json) with new connections', skills: ['irishpeptides.md', 'CONTEXT.md'] },
  { file: 'plan_compliance.py', description: 'Audits context docs against codebase, auto-fixes stale references', skills: ['irishpeptides_plan.md', 'CONTEXT.md'] },
  { file: 'protocol_guard.py', description: 'Pre-commit quality check on content drafts — legal and brand compliance', skills: ['irishpeptides.md', 'SKILLS.md'] },
  { file: 'notion_agent.py', description: 'Reads Notion Build Queue and syncs tasks to outcomes.json', skills: ['CONTEXT.md'] },
  { file: 'watchdog_agent.py', description: 'Monitors Jarvis uptime and restarts if crashed', skills: ['CONTEXT.md'] },
  { file: 'ab_test_agent.py', description: 'Sets up and reads A/B test results for landing pages', skills: ['CONTEXT.md', 'SKILLS.md'] },
  { file: 'image_agent.py', description: 'Generates product and content images via Imagen/Stable Diffusion', skills: ['irishpeptides.md', 'CONTEXT.md'] },
  { file: 'video_agent.py', description: 'Generates short-form video scripts and clips via Veo/MoviePy', skills: ['irishpeptides.md', 'CONTEXT.md'] },
  { file: 'email_agent.py', description: 'Automated email sequences and subscriber segmentation', skills: ['irishpeptides.md', 'CONTEXT.md'] },
]

export default function AgentSkillsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [workflowRes, agentStatusRes] = await Promise.allSettled([
          fetch('https://api.github.com/repos/keithyob26/irishpeptides-jarvis/actions/workflows?per_page=100', {
            headers: { Accept: 'application/vnd.github+json' },
          }).then(r => r.ok ? r.json() : { workflows: [] }),
          fetch('/api/agent-status').then(r => r.json()),
        ])

        const workflows: { name: string; path: string; id: number }[] =
          workflowRes.status === 'fulfilled' ? (workflowRes.value.workflows || []) : []
        const agentStatuses: { name: string; latestRun: AgentInfo['lastRun'] }[] =
          agentStatusRes.status === 'fulfilled' ? (agentStatusRes.value.agents || []) : []

        const result: AgentInfo[] = KNOWN_AGENTS.map(a => {
          const baseName = a.file.replace('.py', '').replace(/_/g, ' ').replace(/agent/i, '').trim()

          // Find matching workflow by name similarity
          const wf = workflows.find(w =>
            w.name.toLowerCase().includes(baseName.toLowerCase()) ||
            w.path.toLowerCase().includes(a.file.replace('.py', '')) ||
            baseName.toLowerCase().includes(w.name.toLowerCase().replace(' agent', ''))
          )

          // Find last run
          const run = agentStatuses.find(s =>
            s.name.toLowerCase().includes(baseName.toLowerCase()) ||
            (wf && s.name.toLowerCase() === wf.name.toLowerCase())
          )

          return {
            name: a.file.replace('.py', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            file: a.file,
            description: a.description,
            workflow: wf?.name ?? null,
            workflowFile: wf?.path?.split('/').pop() ?? null,
            lastRun: run?.latestRun ?? null,
            skills: a.skills,
          }
        })

        setAgents(result)
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function runBadge(run: AgentInfo['lastRun']) {
    if (!run) return { label: 'Never run', color: '#475569' }
    if (run.status === 'in_progress') return { label: 'Running', color: '#14B8A6' }
    if (run.conclusion === 'success') return { label: 'Pass', color: '#22C55E' }
    if (run.conclusion === 'failure') return { label: 'Fail', color: '#EF4444' }
    return { label: run.conclusion || run.status || 'Unknown', color: '#64748B' }
  }

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title="Agent Skills"
        subtitle="All 19 agents — skills loaded, workflow mapping, last run status"
        badge={{ label: `${KNOWN_AGENTS.length} agents`, ok: true }} />

      <div className="mb-4 bg-[#14B8A6]/10 border border-[#14B8A6]/25 rounded-xl p-4">
        <div className="text-[12px] text-[#94A3B8]">
          All agents load skills from{' '}
          <code className="text-[#14B8A6]">skills/irishpeptides.md</code> (brand voice),{' '}
          <code className="text-[#14B8A6]">skills/CONTEXT.md</code> (~240 word context for Gemini/DeepSeek),
          and <code className="text-[#14B8A6]">skills/SKILLS.md</code> (capability registry).
          Claude agents get full <code className="text-[#14B8A6]">irishpeptides.md</code>.
        </div>
      </div>

      {error && <div className="mb-4 text-[12px] text-[#EF4444]">{error}</div>}

      {loading ? (
        <div className="text-[13px] text-[#64748B]">Loading agent data…</div>
      ) : (
        <div className="space-y-2">
          {agents.map(a => {
            const badge = runBadge(a.lastRun)
            return (
              <div key={a.file} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#F1F5F9]">{a.name}</span>
                      <code className="text-[10px] text-[#475569] bg-white/[0.05] px-1.5 py-0.5 rounded">{a.file}</code>
                      {a.workflowFile && (
                        <code className="text-[10px] text-[#14B8A6]/70 bg-[#14B8A6]/10 px-1.5 py-0.5 rounded">
                          {a.workflowFile}
                        </code>
                      )}
                    </div>
                    <div className="text-[12px] text-[#94A3B8] mb-2">{a.description}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {a.skills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#64748B] border border-white/[0.07]">
                          {s}
                        </span>
                      ))}
                    </div>
                    {a.lastRun && (
                      <div className="text-[10px] text-[#334155] mt-1.5">
                        Last: {new Date(a.lastRun.date).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: badge.color, background: badge.color + '20' }}>
                      {badge.label}
                    </span>
                    {a.lastRun?.url && (
                      <a href={a.lastRun.url} target="_blank" rel="noreferrer"
                        className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">
                        View run →
                      </a>
                    )}
                    {!a.workflow && (
                      <span className="text-[9px] text-[#334155]">No workflow</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
