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

type ServiceStatus = 'ok' | 'warn' | 'error' | 'unknown'

interface CheckItem {
  label: string
  key: string
  status: ServiceStatus
  detail: string
  overrideStatus?: ServiceStatus  // hardcoded known-broken override
  overrideDetail?: string
}

const BROKEN_OVERRIDES: Record<string, { status: ServiceStatus; detail: string }> = {
  BUFFER_ACCESS_TOKEN: {
    status: 'warn',
    detail: 'OIDC token rejected — needs OAuth flow at buffer.com/developers/apps',
  },
  MANYCHAT_API_KEY: {
    status: 'warn',
    detail: 'API key returning 401 — regenerate at app.manychat.com/settings/api',
  },
}

export default function HealthPage() {
  const [agents, setAgents] = useState<AgentRun[]>([])
  const [agentError, setAgentError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState('')
  const [keys, setKeys] = useState<Record<string, boolean>>({})

  async function load() {
    setLoading(true)
    try {
      const [agentRes, keyRes] = await Promise.allSettled([
        fetch('/api/agent-status').then(r => r.json()),
        fetch('/api/check-keys').then(r => r.json()),
      ])
      if (agentRes.status === 'fulfilled') {
        if (agentRes.value.error) setAgentError(agentRes.value.error)
        else setAgents(agentRes.value.agents || [])
      }
      if (keyRes.status === 'fulfilled') setKeys(keyRes.value || {})
      setLastChecked(new Date().toLocaleTimeString())
    } catch (e) {
      setAgentError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const SERVICE_CHECKS: CheckItem[] = [
    { label: 'Claude AI (Chat)',      key: 'ANTHROPIC_API_KEY',       status: 'unknown', detail: '' },
    { label: 'Gemini Flash (Chat)',   key: 'GEMINI_API_KEY',          status: 'unknown', detail: '' },
    { label: 'DeepSeek AI (Chat)',    key: 'DEEPSEEK_API_KEY',        status: 'unknown', detail: '' },
    { label: 'GitHub',                key: 'GITHUB_TOKEN',            status: 'unknown', detail: '' },
    { label: 'Notion',                key: 'NOTION_API_KEY',          status: 'unknown', detail: '' },
    { label: 'Resend (Newsletter)',   key: 'RESEND_API_KEY',          status: 'unknown', detail: '' },
    { label: 'Buffer (Scheduling)',   key: 'BUFFER_ACCESS_TOKEN',     status: 'unknown', detail: '' },
    { label: 'ManyChat (DM Auto)',    key: 'MANYCHAT_API_KEY',        status: 'unknown', detail: '' },
    { label: 'CallMeBot (WhatsApp)', key: 'CALLMEBOT_API_KEY',       status: 'unknown', detail: '' },
    { label: 'Stripe (Revenue)',      key: 'STRIPE_API_KEY',          status: 'unknown', detail: '' },
    { label: 'Google Analytics',      key: 'GA4_SERVICE_ACCOUNT_JSON',status: 'unknown', detail: '' },
  ]

  const resolved: CheckItem[] = SERVICE_CHECKS.map(c => {
    const broken = BROKEN_OVERRIDES[c.key]
    const hasKey = keys[c.key]

    // Known-broken integrations regardless of key presence
    if (broken && hasKey) {
      return { ...c, status: broken.status, detail: `Key set — ${broken.detail}` }
    }

    // Key not present
    if (!hasKey) {
      const criticalKeys = ['GITHUB_TOKEN']
      return {
        ...c,
        status: criticalKeys.includes(c.key) ? 'error' : 'warn',
        detail: c.key === 'ANTHROPIC_API_KEY'
          ? 'Not set — add ANTHROPIC_API_KEY to Vercel to activate Claude chat'
          : c.key === 'STRIPE_API_KEY'
          ? 'Not configured — revenue data unavailable'
          : c.key === 'GA4_SERVICE_ACCOUNT_JSON'
          ? 'Not set — Analytics panel shows setup guide'
          : `API key missing`,
      }
    }

    return { ...c, status: 'ok', detail: 'Connected' }
  })

  const okCount = resolved.filter(c => c.status === 'ok').length
  const errorCount = resolved.filter(c => c.status === 'error').length

  function conclusionBadge(run: AgentRun['latestRun']) {
    if (!run) return { label: 'No runs', color: '#475569' }
    if (run.status === 'in_progress') return { label: 'Running', color: '#14B8A6' }
    if (run.conclusion === 'success') return { label: 'Pass', color: '#22C55E' }
    if (run.conclusion === 'failure') return { label: 'Fail', color: '#EF4444' }
    if (run.conclusion === 'cancelled') return { label: 'Cancelled', color: '#F59E0B' }
    if (run.conclusion === 'skipped') return { label: 'Skipped', color: '#475569' }
    return { label: run.conclusion || run.status, color: '#64748B' }
  }

  const statusDot: Record<ServiceStatus, string> = {
    ok: '#22C55E',
    warn: '#F59E0B',
    error: '#EF4444',
    unknown: '#475569',
  }

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="System Health"
        subtitle={`All services and agent status${lastChecked ? ` · checked ${lastChecked}` : ''}`}
        badge={{ label: `${okCount}/${resolved.length} ok`, ok: errorCount === 0 }}
      />

      {/* Service checks */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">
            Service Connections
          </div>
          <button onClick={load} className="text-[11px] text-[#64748B] hover:text-[#14B8A6] transition-colors">
            ↺ Refresh
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {resolved.map(c => (
            <div key={c.key} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: statusDot[c.status] }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[#F1F5F9]">{c.label}</div>
                <div className="text-[11px]" style={{ color: c.status === 'error' ? '#EF4444' : c.status === 'warn' ? '#F59E0B' : '#64748B' }}>
                  {c.detail}
                </div>
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
              <div className="text-[13px] text-[#64748B]">No workflows found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
