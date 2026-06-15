'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface WorkflowRun {
  id: number
  status: string
  conclusion: string | null
  date: string
  url: string
  runNumber?: number
}

interface Workflow {
  id: number
  name: string
  path: string
  fileName: string
  state: string
  schedule: string
  latestRun: WorkflowRun | null
}

interface Skill {
  name: string
  trigger: string
  description: string
  section: string
}

// Explicit agent → workflow file mapping (names don't always match)
const AGENT_WORKFLOW_MAP: Record<string, string> = {
  'content_studio.py': 'content-engine.yml',
  'seo_agent.py': 'seo-loop.yml',
  'social_agent.py': 'first-social-post.yml',
  'newsletter_agent.py': 'newsletter-agent.yml',
  'analytics_agent.py': 'ga4-monitor.yml',
  'revenue_agent.py': 'cfo-agent.yml',
  'competitor_agent.py': 'competitor-monitor.yml',
  'site_qa_agent.py': 'site-qa.yml',
  'callmebot_agent.py': 'system-health.yml',
  'memory_agent.py': '',
  'brain_agent.py': '',
  'plan_compliance.py': 'plan-compliance.yml',
  'protocol_guard.py': 'legal-compliance.yml',
  'notion_agent.py': '',
  'watchdog_agent.py': 'system-health.yml',
  'ab_test_agent.py': '',
  'image_agent.py': '',
  'video_agent.py': 'video-pipeline.yml',
  'email_agent.py': 'newsletter-agent.yml',
}

const KNOWN_AGENTS: {
  file: string
  description: string
  skills: string[]
  why: string
}[] = [
  { file: 'content_studio.py', description: 'Generates blog posts, social content, SEO pages from brand voice guidelines', skills: ['irishpeptides.md', 'CONTEXT.md', 'SKILLS.md'], why: 'Creates weekly content to grow organic traffic and engagement' },
  { file: 'seo_agent.py', description: 'Keyword research, competitor analysis, meta tag optimisation', skills: ['CONTEXT.md', 'SKILLS.md'], why: 'Identifies ranking opportunities and keeps on-page SEO current' },
  { file: 'social_agent.py', description: 'Schedules posts to Buffer, triggers ManyChat keyword flows', skills: ['irishpeptides.md', 'CONTEXT.md'], why: 'Automates social posting so content goes out on schedule' },
  { file: 'newsletter_agent.py', description: 'Drafts and sends newsletters via Resend', skills: ['irishpeptides.md', 'CONTEXT.md'], why: 'Maintains subscriber relationship and drives repeat traffic' },
  { file: 'analytics_agent.py', description: 'Pulls GA4 data, formats weekly traffic report', skills: ['CONTEXT.md'], why: 'Surfaces site performance data without manual GA4 login' },
  { file: 'revenue_agent.py', description: 'Stripe revenue tracking and monthly summaries', skills: ['CONTEXT.md'], why: 'Monitors cash flow and flags revenue anomalies' },
  { file: 'competitor_agent.py', description: 'Monitors competitor sites for price and content changes', skills: ['CONTEXT.md', 'SKILLS.md'], why: 'Keeps Keith aware of competitor moves in Irish peptide market' },
  { file: 'site_qa_agent.py', description: 'Playwright smoke tests on irishpeptides.ie — checks all pages load, forms work', skills: ['CONTEXT.md'], why: 'Catches broken pages or forms before visitors do' },
  { file: 'callmebot_agent.py', description: 'Sends WhatsApp notifications for important events', skills: ['CONTEXT.md'], why: 'Real-time alerts to Keith\'s phone without needing to check dashboard' },
  { file: 'memory_agent.py', description: 'Syncs outcomes.db to outcomes.json for GitHub commit', skills: ['CONTEXT.md'], why: 'Makes agent results available to the Vercel dashboard' },
  { file: 'brain_agent.py', description: 'Updates the knowledge graph (brain.json) with new connections', skills: ['irishpeptides.md', 'CONTEXT.md'], why: 'Builds a living map of the business for better AI context' },
  { file: 'plan_compliance.py', description: 'Audits context docs against codebase, auto-fixes stale references', skills: ['irishpeptides_plan.md', 'CONTEXT.md'], why: 'Prevents CLAUDE.md and CONTEXT.md from going out of date' },
  { file: 'protocol_guard.py', description: 'Pre-commit quality check on content drafts — legal and brand compliance', skills: ['irishpeptides.md', 'SKILLS.md'], why: 'Blocks EU-non-compliant health claims before they go live' },
  { file: 'notion_agent.py', description: 'Reads Notion Build Queue and syncs tasks to outcomes.json', skills: ['CONTEXT.md'], why: 'Keeps Notion task state available to the dashboard and AI' },
  { file: 'watchdog_agent.py', description: 'Monitors Jarvis uptime and restarts if crashed', skills: ['CONTEXT.md'], why: 'Keeps Jarvis running 24/7 without manual intervention' },
  { file: 'ab_test_agent.py', description: 'Sets up and reads A/B test results for landing pages', skills: ['CONTEXT.md', 'SKILLS.md'], why: 'Improves conversion rates through data-driven copy testing' },
  { file: 'image_agent.py', description: 'Generates product and content images via Imagen/Stable Diffusion', skills: ['irishpeptides.md', 'CONTEXT.md'], why: 'Creates brand-consistent visuals without designer cost' },
  { file: 'video_agent.py', description: 'Generates short-form video scripts and clips via Veo/MoviePy', skills: ['irishpeptides.md', 'CONTEXT.md'], why: 'Powers TikTok and Reels content pipeline' },
  { file: 'email_agent.py', description: 'Automated email sequences and subscriber segmentation', skills: ['irishpeptides.md', 'CONTEXT.md'], why: 'Nurtures leads from free tools into paid coaching tiers' },
]

function runBadge(run: WorkflowRun | null): { label: string; color: string } {
  if (!run) return { label: 'Never run', color: '#475569' }
  if (run.status === 'in_progress') return { label: 'Running', color: '#14B8A6' }
  if (run.conclusion === 'success') return { label: 'Pass', color: '#22C55E' }
  if (run.conclusion === 'failure') return { label: 'Fail', color: '#EF4444' }
  if (run.conclusion === 'skipped') return { label: 'Skipped', color: '#64748B' }
  return { label: run.conclusion || run.status || 'Unknown', color: '#64748B' }
}

export default function AgentSkillsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'agents' | 'workflows' | 'skills'>('agents')
  const [skillFilter, setSkillFilter] = useState('')

  useEffect(() => {
    fetch('/api/agent-skills')
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setWorkflows(d.workflows || [])
        setSkills(d.skills || [])
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const wfByFile = Object.fromEntries(workflows.map(w => [w.fileName, w]))

  const filteredSkills = skills.filter(s =>
    !skillFilter ||
    s.name.toLowerCase().includes(skillFilter.toLowerCase()) ||
    s.description.toLowerCase().includes(skillFilter.toLowerCase()) ||
    s.section.toLowerCase().includes(skillFilter.toLowerCase())
  )

  const skillSections = [...new Set(filteredSkills.map(s => s.section))]

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title="Agent Skills"
        subtitle={`${KNOWN_AGENTS.length} agents · ${workflows.length} workflows · ${skills.length} skills`}
        badge={{ label: loading ? 'Loading…' : 'Live', ok: !loading }} />

      {/* Context note */}
      <div className="mb-4 bg-[#14B8A6]/10 border border-[#14B8A6]/25 rounded-xl p-4">
        <div className="text-[12px] text-[#94A3B8]">
          All agents load skills from{' '}
          <code className="text-[#14B8A6]">skills/irishpeptides.md</code> (brand voice),{' '}
          <code className="text-[#14B8A6]">skills/CONTEXT.md</code> (~240 word context for Gemini/DeepSeek),
          and <code className="text-[#14B8A6]">skills/SKILLS.md</code> (capability registry).
          Claude agents get full <code className="text-[#14B8A6]">irishpeptides.md</code>.
          Workflow run times and status pulled live from GitHub Actions.
        </div>
      </div>

      {error && <div className="mb-4 text-[12px] text-[#EF4444] bg-[#EF4444]/10 rounded-lg px-4 py-2">{error}</div>}

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.07]">
        {(['agents', 'workflows', 'skills'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-[12px] font-semibold capitalize transition-colors border-b-2 -mb-px ${
              activeTab === t ? 'border-[#14B8A6] text-[#14B8A6]' : 'border-transparent text-[#64748B] hover:text-[#F1F5F9]'
            }`}>
            {t === 'agents' ? `Agents (${KNOWN_AGENTS.length})` : t === 'workflows' ? `Workflows (${workflows.length})` : `Skills (${skills.length})`}
          </button>
        ))}
      </div>

      {loading && <div className="text-[13px] text-[#64748B]">Loading agent and workflow data from GitHub…</div>}

      {/* AGENTS TAB */}
      {activeTab === 'agents' && !loading && (
        <div className="space-y-2">
          {KNOWN_AGENTS.map(a => {
            const wfFile = AGENT_WORKFLOW_MAP[a.file]
            const wf = wfFile ? wfByFile[wfFile] : null
            const badge = runBadge(wf?.latestRun ?? null)

            return (
              <div key={a.file} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#F1F5F9]">
                        {a.file.replace('.py', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                      <code className="text-[10px] text-[#475569] bg-white/[0.05] px-1.5 py-0.5 rounded">{a.file}</code>
                      {wfFile && (
                        <code className="text-[10px] text-[#14B8A6]/70 bg-[#14B8A6]/10 px-1.5 py-0.5 rounded">{wfFile}</code>
                      )}
                    </div>
                    <div className="text-[12px] text-[#94A3B8] mb-1">{a.description}</div>
                    <div className="text-[11px] text-[#475569] mb-2 italic">{a.why}</div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {a.skills.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-[#64748B] border border-white/[0.07]">
                          {s}
                        </span>
                      ))}
                    </div>
                    {wf?.schedule && (
                      <div className="text-[10px] text-[#334155] flex items-center gap-1">
                        <span className="text-[#475569]">Schedule:</span>
                        <span className="text-[#64748B]">{wf.schedule}</span>
                      </div>
                    )}
                    {wf?.latestRun?.date && (
                      <div className="text-[10px] text-[#334155] mt-0.5">
                        Last run: {new Date(wf.latestRun.date).toLocaleString()}
                        {wf.latestRun.runNumber && ` · #${wf.latestRun.runNumber}`}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: badge.color, background: badge.color + '20' }}>
                      {badge.label}
                    </span>
                    {wf?.latestRun?.url && (
                      <a href={wf.latestRun.url} target="_blank" rel="noreferrer"
                        className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">
                        View run →
                      </a>
                    )}
                    {!wfFile && (
                      <span className="text-[9px] text-[#334155]">No workflow</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* WORKFLOWS TAB */}
      {activeTab === 'workflows' && !loading && (
        <div className="space-y-2">
          {workflows.length === 0 ? (
            <div className="text-[13px] text-[#64748B]">No workflows found. Check GITHUB_TOKEN is set in Vercel.</div>
          ) : workflows.map(w => {
            const badge = runBadge(w.latestRun)
            return (
              <div key={w.id} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[13px] font-semibold text-[#F1F5F9]">{w.name}</span>
                      <code className="text-[10px] text-[#475569] bg-white/[0.05] px-1.5 py-0.5 rounded">{w.fileName}</code>
                      {w.state !== 'active' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B]">{w.state}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {w.schedule && (
                        <span className="text-[11px] text-[#64748B]">
                          <span className="text-[#475569]">Schedule: </span>{w.schedule}
                        </span>
                      )}
                      {w.latestRun?.date && (
                        <span className="text-[10px] text-[#334155]">
                          Last: {new Date(w.latestRun.date).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: badge.color, background: badge.color + '20' }}>
                      {badge.label}
                    </span>
                    {w.latestRun?.url && (
                      <a href={w.latestRun.url} target="_blank" rel="noreferrer"
                        className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">
                        View run →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* SKILLS TAB */}
      {activeTab === 'skills' && !loading && (
        <>
          <div className="mb-4">
            <input
              type="text"
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              placeholder="Filter skills by name, description or section…"
              className="w-full bg-[#1C1C1C] border border-white/[0.07] rounded-lg px-4 py-2.5 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50"
            />
          </div>
          {skills.length === 0 ? (
            <div className="text-[13px] text-[#64748B]">Skills not loaded — SKILLS.md fetch may have failed. Check GitHub connectivity.</div>
          ) : skillSections.map(section => {
            const sectionSkills = filteredSkills.filter(s => s.section === section)
            if (!sectionSkills.length) return null
            return (
              <div key={section} className="mb-6">
                <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">{section}</div>
                <div className="space-y-1.5">
                  {sectionSkills.map(s => (
                    <div key={s.trigger} className="bg-[#1C1C1C] border border-white/[0.07] rounded-lg p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-semibold text-[#F1F5F9]">{s.name}</span>
                          <code className="text-[10px] text-[#14B8A6] bg-[#14B8A6]/10 px-1.5 py-0.5 rounded">{s.trigger}</code>
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{s.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {filteredSkills.length === 0 && skillFilter && (
            <div className="text-[13px] text-[#64748B]">No skills match "{skillFilter}"</div>
          )}
        </>
      )}
    </div>
  )
}
