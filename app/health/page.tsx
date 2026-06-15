'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface AgentRun {
  id: number
  name: string
  state: string
  latestRun: {
    status: string
    conclusion: string | null
    created_at: string
    html_url: string
  } | null
}

interface CheckItem {
  label: string
  key: string
  status: 'ok' | 'warn' | 'error' | 'unknown'
  detail: string
}

export default function HealthPage() {
  const [agents, setAgents] = useState<AgentRun[]>([])
  const [agentError, setAgentError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/agent-status')
      const d = await r.json()
      if (d.error) setAgentError(d.error)
      else setAgents(d.agents || [])
      setLastChecked(new Date().toLocaleTimeString())
    } catch (e) {
      setAgentError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Service checks based on known env var presence (checked server-side via check-keys)
  const [keys, setKeys] = useState<Record<string, boolean>>({})
  useEffect(() => {
    fetch('/api/check-keys').then(r => r.json()).then(d => setKeys(d || {}))
  }, [])

  const SERVICE_CHECKS: CheckItem[] = [
    { label: 'Resend (Newsletter)', key: 'RESEND_API_KEY', status: keys['RESEND_API_KEY'] ? 'ok' : 'warn', detail: keys['RESEND_API_KEY'] ? 'Connected' : 'API key missing' },
    { label: 'Gemini AI',           key: 'GEMINI_API_KEY', status: keys['GEMINI_API_KEY'] ? 'ok' : 'warn', detail: keys['GEMINI_API_KEY'] ? 'Connected' : 'API key missing' },
    { label: 'DeepSeek AI',         key: 'DEEPSEEK_API_KEY', status: keys['DEEPSEEK_API_KEY'] ? 'ok' : 'warn', detail: keys['DEEPSEEK_API_KEY'] ? 'Connected' : 'API key missing' },
    { label: 'GitHub',              key: 'GITHUB_TOKEN', status: keys['GITHUB_TOKEN'] ? 'ok' : 'error', detail: keys['GITHUB_TOKEN'] ? 'Connected' : 'Token missing — agents cannot commit' },
    { label: 'Notion',              key: 'NOTION_API_KEY', status: keys['NOTION_API_KEY'] ? 'ok' : 'warn', detail: keys['NOTION_API_KEY'] ? 'Connected' : 'API key missing' },
    { label: 'ManyChat',            key: 'MANYCHAT_API_KEY', status: keys['MANYCHAT_API_KEY'] ? 'ok' : 'warn', detail: keys['MANYCHAT_API_KEY'] ? 'Connected' : 'API key missing' },
    { label: 'Buffer',              key: 'BUFFER_ACCESS_TOKEN', status: keys['BUFFER_ACCESS_TOKEN'] ? 'ok' : 'warn', detail: keys['BUFFER_ACCESS_TOKEN'] ? 'Connected' : 'Token missing' },
    { label: 'Stripe',              key: 'STRIPE_API_KEY', status: keys['STRIPE_API_KEY'] ? 'ok' : 'warn', detail: keys['STRIPE_API_KEY'] ? 'Connected' : 'Not configured — revenue data unavailable' },
    { label: 'Google Analytics',    key: 'GA4_SERVICE_ACCOUNT_JSON', status: keys['GA4_SERVICE_ACCOUNT_JSON'] ? 'ok' : 'warn', detail: keys['GA4_SERVICE_ACCOUNT_JSON'] ? 'Connected' : 'Service account JSON missing' },
    { label: 'CallMeBot (WhatsApp)',key: 'CALLMEBOT_API_KEY', status: keys['CALLMEBOT_API_KEY'] ? 'ok' : 'warn', detail: keys['CALLMEBOT_API_KEY'] ? 'Connected' : 'API key missing' },
  ]

  const okCount = SERVICE_CHECKS.filter(c => c.status === 'ok').length
  const errorCount = SERVICE_CHECKS.filter(c => c.status === 'error').length

  function conclusionBadge(run: AgentRun['latestRun']) {
    if (!run) return { label: 'No runs', color: '#475569' }
    if (run.status === 'in_progress') return { label: 'Running', color: '#14B8A6' }
    if (run.conclusion === 'success') return { label: 'Pass', color: '#22C55E' }
    if (run.conclusion === 'failure') return { label: 'Fail', color: '#EF4444' }
    if (run.conclusion === 'cancelled') return { label: 'Cancelled', color: '#F59E0B' }
    if (run.conclusion === 'skipped') return { label: 'Skipped', color: '#475569' }
    return { label: run.conclusion || run.status, color: '#64748B' }
  }

  const statusClass = {
    ok: 'status-green',
    warn: 'status-amber',
    error: 'status-red',
    unknown: 'status-grey',
  }

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🏥 System Health"
        subtitle={`All services and agent status${lastChecked ? ` · checked ${lastChecked}` : ''}`}
        badge={{ label: `${okCount}/${SERVICE_CHECKS.length} ok`, ok: errorCount === 0 }}
      />

      {/* Service checks */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Service Connections
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SERVICE_CHECKS.map(c => (
            <div key={c.key} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <span className={`status-dot ${statusClass[c.status]} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[#F1F5F9]">{c.label}</div>
                <div className="text-[11px] text-[#64748B]">{c.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Actions */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">
            GitHub Actions Workflows
          </div>
          <button onClick={load} className="text-[11px] text-[#64748B] hover:text-[#14B8A6] transition-colors">
            ↺ Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-[13px] text-[#64748B]">Loading workflow status…</div>
        ) : agentError ? (
          <div className="text-[12px] text-[#EF4444]">{agentError}</div>
        ) : (
          <div className="space-y-2">
            {agents.map(a => {
              const badge = conclusionBadge(a.latestRun)
              return (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <div className="text-[12px] font-medium text-[#F1F5F9]">{a.name}</div>
                    {a.latestRun && (
                      <div className="text-[11px] text-[#475569]">
                        {new Date(a.latestRun.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: badge.color, background: badge.color + '20' }}
                    >
                      {badge.label}
                    </span>
                    {a.latestRun?.html_url && (
                      <a href={a.latestRun.html_url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">
                        View →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
            {agents.length === 0 && (
              <div className="text-[13px] text-[#64748B]">No workflows found in repository</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
