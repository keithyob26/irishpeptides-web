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
  overrideStatus?: ServiceStatus
  overrideDetail?: string
}

interface RepoHealth {
  repo: string
  status: 'ok' | 'stale' | 'missing' | 'unknown'
  last_backup: string | null
  age_hours: number | null
  detail: string
}

interface BackupHealthData {
  health: RepoHealth[]
  summary: { ok: number; stale: number; missing: number }
  checked_at: string
}

const BROKEN_OVERRIDES: Record<string, { status: ServiceStatus; detail: string }> = {
  BUFFER_ACCESS_TOKEN: {
    status: 'warn',
    detail: 'Disconnected — needs OAuth flow at buffer.com/developers/apps (manually blocked)',
  },
  MANYCHAT_API_KEY: {
    status: 'warn',
    detail: 'Disconnected — regenerate key at app.manychat.com/settings/api (manually blocked)',
  },
}

export default function HealthPage() {
  const [agents, setAgents] = useState<AgentRun[]>([])
  const [agentError, setAgentError] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState('')
  const [keys, setKeys] = useState<Record<string, boolean>>({})
  const [backupHealth, setBackupHealth] = useState<BackupHealthData | null>(null)
  const [backupLoading, setBackupLoading] = useState(true)

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

  async function loadBackupHealth() {
    setBackupLoading(true)
    try {
      const res = await fetch('/api/backup-health')
      if (res.ok) setBackupHealth(await res.json())
    } catch {
      // silently ignore
    } finally {
      setBackupLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadBackupHealth()
  }, [])

  const SERVICE_CHECKS: CheckItem[] = [
    { label: 'Claude CLI (Chat)',     key: 'CLAUDE_CLI',              status: 'ok',     detail: 'Active — Team plan via CLI, zero personal cost' },
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
    // Static overrides — skip key check for these
    if (c.status === 'ok') return c

    const broken = BROKEN_OVERRIDES[c.key]
    const hasKey = keys[c.key]

    if (broken && hasKey) {
      return { ...c, status: broken.status, detail: `Key set — ${broken.detail}` }
    }

    if (!hasKey) {
      const criticalKeys = ['GITHUB_TOKEN']
      return {
        ...c,
        status: criticalKeys.includes(c.key) ? 'error' : 'warn',
        detail: c.key === 'STRIPE_API_KEY'
          ? 'Not configured — revenue data unavailable'
          : c.key === 'GA4_SERVICE_ACCOUNT_JSON'
          ? 'Not set — check Vercel environment variables'
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

  const backupDot: Record<string, string> = {
    ok:      '#22C55E',
    stale:   '#F59E0B',
    missing: '#EF4444',
    unknown: '#475569',
  }

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="System Health"
        subtitle={`All services and agent status${lastChecked ? ` · checked ${lastChecked}` : ''}`}
        badge={{ label: `${okCount}/${resolved.length} ok`, ok: errorCount === 0 }}
      />

      {/* Backup Status */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">
            Google Drive Backups
          </div>
          <button onClick={loadBackupHealth} className="text-[11px] text-[#64748B] hover:text-[#14B8A6] transition-colors">
            ↺ Refresh
          </button>
        </div>

        {backupLoading ? (
          <div className="text-[13px] text-[#64748B]">Checking backup status…</div>
        ) : !backupHealth ? (
          <div className="text-[12px] text-[#F59E0B]">Could not load backup status — GITHUB_TOKEN required</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              {backupHealth.health.map(h => (
                <div key={h.repo} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: backupDot[h.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-[#F1F5F9] font-mono">{h.repo}</div>
                    <div className="text-[11px]" style={{
                      color: h.status === 'missing' ? '#EF4444' : h.status === 'stale' ? '#F59E0B' : '#64748B'
                    }}>
                      {h.detail}
                    </div>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: backupDot[h.status], background: backupDot[h.status] + '20' }}
                  >
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-[#475569]">
              {backupHealth.summary.ok}/{backupHealth.health.length} repos backed up within 24h
              {backupHealth.summary.stale > 0 && ` · ${backupHealth.summary.stale} stale`}
              {backupHealth.summary.missing > 0 && ` · ${backupHealth.summary.missing} missing`}
              {' · '}Source: irishpeptides-jarvis/memory/backup_status.json
            </div>
          </>
        )}
      </div>

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
