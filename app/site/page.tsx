'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface Commit {
  sha: string
  message: string
  author: string
  date: string
  url: string
}

interface DeployInfo {
  lastDeploy: { sha: string; message: string; date: string; url: string } | null
  lastQA: { status: string; conclusion: string | null; date: string; url: string } | null
  autoDeployEnabled: boolean
}

const PAGES = [
  { path: '/', title: 'Home' }, { path: '/about.html', title: 'About' },
  { path: '/coaching', title: 'Coaching' }, { path: '/blog', title: 'Blog' },
  { path: '/free-tools', title: 'Free Tools' }, { path: '/calculators', title: 'Calculators' },
  { path: '/contact.html', title: 'Contact' }, { path: '/faq.html', title: 'FAQ' },
]

const TASK_BUTTONS = [
  { id: 'qa', label: 'Run QA Tests', description: 'Playwright smoke tests on irishpeptides.ie', workflow: 'site-qa.yml' },
  { id: 'seo', label: 'SEO Audit', description: 'Run SEO agent — keyword gaps + technical', workflow: 'seo-loop.yml' },
  { id: 'content', label: 'Content Engine', description: 'Generate content plan', workflow: 'content-engine.yml' },
  { id: 'compliance', label: 'Plan Compliance', description: 'Check context docs against codebase', workflow: 'plan-compliance.yml' },
  { id: 'health', label: 'System Health', description: 'Full system health check', workflow: 'system-health.yml' },
  { id: 'optimiser', label: 'Site Optimiser', description: 'On-page SEO + performance audit', workflow: 'site-optimiser.yml' },
]

export default function SitePage() {
  const [siteCommits, setSiteCommits] = useState<Commit[]>([])
  const [jarvisCommits, setJarvisCommits] = useState<Commit[]>([])
  const [deployInfo, setDeployInfo] = useState<DeployInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<{ ok?: boolean; sha?: string; error?: string } | null>(null)
  const [runningTask, setRunningTask] = useState<string | null>(null)
  const [taskResults, setTaskResults] = useState<Record<string, { ok: boolean; msg: string }>>({})

  async function load() {
    setLoading(true)
    try {
      const [statusRes, deployRes] = await Promise.allSettled([
        fetch('/api/site-status').then(r => r.json()),
        fetch('/api/workflow-dispatch').then(r => r.json()),
      ])
      if (statusRes.status === 'fulfilled') {
        setSiteCommits(statusRes.value.siteCommits || [])
        setJarvisCommits(statusRes.value.jarvisCommits || [])
      }
      if (deployRes.status === 'fulfilled') {
        setDeployInfo(deployRes.value)
      }
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const deploy = async () => {
    setDeploying(true)
    setDeployResult(null)
    try {
      const r = await fetch('/api/site-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'chore: manual deploy trigger from Jarvis dashboard' }),
      })
      const d = await r.json()
      setDeployResult(d)
      if (d.ok) load()
    } catch (e) {
      setDeployResult({ error: String(e) })
    } finally {
      setDeploying(false)
    }
  }

  const runWorkflow = async (task: typeof TASK_BUTTONS[0]) => {
    setRunningTask(task.id)
    try {
      const r = await fetch('/api/workflow-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: task.workflow }),
      })
      const d = await r.json()
      if (d.ok) {
        setTaskResults(prev => ({ ...prev, [task.id]: { ok: true, msg: 'Triggered — check GitHub Actions' } }))
      } else {
        setTaskResults(prev => ({ ...prev, [task.id]: { ok: false, msg: d.error || `HTTP ${d.status}` } }))
      }
    } catch (e) {
      setTaskResults(prev => ({ ...prev, [task.id]: { ok: false, msg: String(e) } }))
    } finally {
      setRunningTask(null)
    }
  }

  const qaOk = deployInfo?.lastQA?.conclusion === 'success'
  const qaFail = deployInfo?.lastQA?.conclusion === 'failure'

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title="Site Control"
        subtitle="irishpeptides.ie · keithyob26/irishpeptides-website"
        badge={{ label: 'GitHub connected', ok: true }} />

      {/* Deploy status bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[10px] text-[#475569] uppercase tracking-wide mb-1">Last Deploy</div>
          {deployInfo?.lastDeploy ? (
            <>
              <div className="text-[12px] text-[#F1F5F9] font-semibold truncate">{deployInfo.lastDeploy.message.split('\n')[0].slice(0, 50)}</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">{new Date(deployInfo.lastDeploy.date).toLocaleString()}</div>
              <a href={deployInfo.lastDeploy.url} target="_blank" rel="noreferrer"
                className="text-[10px] text-[#14B8A6] hover:underline">commit {deployInfo.lastDeploy.sha}</a>
            </>
          ) : (
            <div className="text-[12px] text-[#64748B]">{loading ? 'Loading…' : '—'}</div>
          )}
        </div>

        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[10px] text-[#475569] uppercase tracking-wide mb-1">Auto Deploy</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-[12px] text-[#22C55E] font-semibold">ON</span>
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">Cloudflare Pages auto-deploys on every commit to irishpeptides-website</div>
        </div>

        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
          <div className="text-[10px] text-[#475569] uppercase tracking-wide mb-1">Last QA Run</div>
          {deployInfo?.lastQA ? (
            <>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${qaOk ? 'bg-[#22C55E]' : qaFail ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`} />
                <span className={`text-[12px] font-semibold ${qaOk ? 'text-[#22C55E]' : qaFail ? 'text-[#EF4444]' : 'text-[#F59E0B]'}`}>
                  {qaOk ? 'Pass' : qaFail ? 'Fail' : deployInfo.lastQA.conclusion || deployInfo.lastQA.status}
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">{new Date(deployInfo.lastQA.date).toLocaleString()}</div>
              <a href={deployInfo.lastQA.url} target="_blank" rel="noreferrer"
                className="text-[10px] text-[#14B8A6] hover:underline">View run →</a>
            </>
          ) : (
            <div className="text-[12px] text-[#64748B]">{loading ? 'Loading…' : 'No QA runs found'}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Deploy button */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Deploy</div>
          <p className="text-[12px] text-[#64748B] mb-4">
            Commits a deploy trigger to <code className="text-[#14B8A6]">keithyob26/irishpeptides-website</code>.
            Cloudflare Pages auto-deploys on every commit.
          </p>
          <button onClick={deploy} disabled={deploying}
            className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-[#0A0F1E] disabled:opacity-60 transition-opacity"
            style={{ background: '#14B8A6' }}>
            {deploying ? 'Deploying…' : '⬆ Deploy to Cloudflare Pages'}
          </button>
          {deployResult && (
            <div className={`mt-3 text-[12px] px-3 py-2 rounded-lg ${
              deployResult.ok ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
              : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
            }`}>
              {deployResult.ok ? `✓ Deployed — commit ${deployResult.sha}` : `✗ ${deployResult.error}`}
            </div>
          )}
        </div>

        {/* Pages */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Site Pages</div>
          <div className="space-y-1">
            {PAGES.map(p => (
              <div key={p.path} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                <div>
                  <span className="text-[12px] text-[#F1F5F9]">{p.title}</span>
                  <span className="text-[11px] text-[#475569] ml-2 font-mono">{p.path}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              </div>
            ))}
          </div>
          <a href="https://irishpeptides.ie" target="_blank" rel="noreferrer"
            className="text-[12px] text-[#14B8A6] hover:underline mt-3 inline-block">
            ↗ Open irishpeptides.ie
          </a>
        </div>
      </div>

      {/* Task Runner */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-1">Task Runner</div>
        <p className="text-[11px] text-[#475569] mb-4">Triggers GitHub Actions workflows server-side (token never exposed to browser).</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TASK_BUTTONS.map(t => {
            const result = taskResults[t.id]
            return (
              <div key={t.id} className="border border-white/[0.05] rounded-lg p-4">
                <div className="text-[12px] font-semibold text-[#F1F5F9] mb-0.5">{t.label}</div>
                <div className="text-[11px] text-[#64748B] mb-3">{t.description}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => runWorkflow(t)} disabled={runningTask === t.id}
                    className="px-4 py-1.5 text-[11px] font-semibold rounded-lg border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-all disabled:opacity-50">
                    {runningTask === t.id ? 'Triggering…' : '▶ Run'}
                  </button>
                  {result && (
                    <span className={`text-[11px] font-medium ${result.ok ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                      {result.ok ? '✓' : '✗'} {result.msg}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#334155] mt-1.5">
                  <code>{t.workflow}</code>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Commit Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">Site Commits</div>
            <button onClick={load} className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">↺</button>
          </div>
          {loading ? <div className="text-[12px] text-[#64748B]">Loading…</div> : (
            <div className="space-y-2">
              {siteCommits.slice(0, 8).map((c, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <code className="text-[10px] text-[#475569] mt-0.5 shrink-0">{c.sha}</code>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[#94A3B8] truncate">{c.message.split('\n')[0]}</div>
                    <div className="text-[10px] text-[#334155]">{new Date(c.date).toLocaleDateString()}</div>
                  </div>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer"
                      className="text-[10px] text-[#475569] hover:text-[#14B8A6] shrink-0">↗</a>
                  )}
                </div>
              ))}
              {siteCommits.length === 0 && <div className="text-[11px] text-[#475569]">No commits found</div>}
            </div>
          )}
        </div>

        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Jarvis Commits</div>
          {loading ? <div className="text-[12px] text-[#64748B]">Loading…</div> : (
            <div className="space-y-2">
              {jarvisCommits.slice(0, 8).map((c, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <code className="text-[10px] text-[#475569] mt-0.5 shrink-0">{c.sha}</code>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[#94A3B8] truncate">{c.message.split('\n')[0]}</div>
                    <div className="text-[10px] text-[#334155]">{new Date(c.date).toLocaleDateString()}</div>
                  </div>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer"
                      className="text-[10px] text-[#475569] hover:text-[#14B8A6] shrink-0">↗</a>
                  )}
                </div>
              ))}
              {jarvisCommits.length === 0 && <div className="text-[11px] text-[#475569]">No commits found</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
