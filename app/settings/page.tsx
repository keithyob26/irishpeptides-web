'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface TokenSummary {
  generated_at?: string
  summary?: {
    total_calls: number
    total_tokens: number
    total_cost_eur: number
    today_tokens: number
    today_cost_eur: number
    cache_hit_rate_pct: number
    monthly_projection_eur: number
    daily_cap_tokens: number
  }
  by_model?: Record<string, { tokens_in: number; tokens_out: number; cost_eur: number; calls: number; cache_hit_rate_pct: number }>
}

type KeyStatus = { status: 'ok' | 'warn' | 'missing' | 'error'; note?: string }
type Results = Record<string, KeyStatus>

const KEY_LABELS: Record<string, string> = {
  GEMINI_API_KEY:           'Gemini',
  DEEPSEEK_API_KEY:         'DeepSeek',
  NOTION_API_KEY:           'Notion',
  GITHUB_TOKEN:             'GitHub',
  RESEND_API_KEY:           'Resend',
  MANYCHAT_API_KEY:         'ManyChat',
  GA4_SERVICE_ACCOUNT_JSON: 'GA4',
  BUFFER_ACCESS_TOKEN:      'Buffer',
  ANTHROPIC_API_KEY:        'Anthropic',
  STRIPE_API_KEY:           'Stripe',
  CALLMEBOT_API_KEY:        'CallMeBot',
}

const DOT: Record<string, string> = {
  ok:      'bg-[#10B981]',
  warn:    'bg-[#F59E0B]',
  missing: 'bg-[#334155]',
  error:   'bg-[#EF4444]',
}

const LABEL: Record<string, string> = {
  ok:      'Connected',
  warn:    'Warning',
  missing: 'Not set',
  error:   'Error',
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${DOT[status] ?? DOT.missing}`} />
  )
}

export default function SettingsPage() {
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<string>('')
  const [tokenData, setTokenData] = useState<TokenSummary | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)

  const check = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/check-keys', { cache: 'no-store' })
      const d: Results = await r.json()
      setResults(d)
      setLastChecked(new Date().toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      // network error — keep previous results
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    check()
    fetch('/api/token-usage', { cache: 'no-store' })
      .then(r => r.json()).then(setTokenData).catch(() => {}).finally(() => setTokenLoading(false))
  }, [])

  const keys = Object.keys(KEY_LABELS)
  const connected = results ? keys.filter(k => results[k]?.status === 'ok').length : 0

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="⚙️ Settings"
        subtitle="API keys · Token budget · Notifications"
      />

      {/* API Keys card */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">
            API Keys
            {!loading && results && (
              <span className="ml-2 text-[#64748B] normal-case font-normal">
                {connected}/{keys.length} connected
              </span>
            )}
          </div>
          <button
            onClick={check}
            disabled={loading}
            className="text-[11px] text-[#14B8A6] border border-[#14B8A6]/30 rounded-md px-2.5 py-1
                       hover:bg-[#14B8A6]/10 disabled:opacity-40 transition-colors"
          >
            {loading ? '⟳ Checking…' : '↺ Re-check'}
          </button>
        </div>

        {loading && !results ? (
          <div className="py-8 text-center text-[13px] text-[#475569]">
            Checking live connections…
          </div>
        ) : (
          <div className="space-y-1">
            {keys.map(k => {
              const r = results?.[k] ?? { status: 'missing' as const }
              return (
                <div
                  key={k}
                  className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <StatusDot status={r.status} />
                    <div>
                      <span className="text-[13px] text-[#F1F5F9]">{KEY_LABELS[k]}</span>
                      <code className="text-[11px] text-[#475569] ml-2">{k}</code>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] text-[#64748B]">{LABEL[r.status] ?? 'Unknown'}</span>
                    {r.note && (
                      <div className="text-[11px] text-[#F59E0B] max-w-[200px] text-right">{r.note}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {lastChecked && (
          <div className="text-[11px] text-[#334155] mt-3">Last checked: {lastChecked}</div>
        )}
      </div>

      {/* Token Usage Dashboard */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">Token Usage & Costs</div>
          {tokenData?.generated_at && (
            <span className="text-[11px] text-[#334155]">
              Updated {new Date(tokenData.generated_at).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {tokenLoading ? (
          <div className="py-6 text-center text-[13px] text-[#475569]">Loading token data…</div>
        ) : !tokenData?.summary ? (
          <div className="py-6 text-center text-[13px] text-[#475569]">No token usage data yet — runs after first agent call.</div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
              {[
                { label: 'Today tokens', value: tokenData.summary.today_tokens.toLocaleString() },
                { label: 'Today cost', value: `€${tokenData.summary.today_cost_eur.toFixed(4)}` },
                { label: 'Monthly est.', value: `€${tokenData.summary.monthly_projection_eur.toFixed(2)}` },
                { label: 'Cache hit rate', value: `${tokenData.summary.cache_hit_rate_pct}%` },
              ].map(s => (
                <div key={s.label} className="bg-[#161616] border border-white/[0.05] rounded-lg p-3 text-center">
                  <div className="text-[11px] text-[#64748B] mb-1">{s.label}</div>
                  <div className="text-base font-bold text-[#F1F5F9]">{s.value}</div>
                </div>
              ))}
            </div>

            {/* Daily cap progress */}
            {(() => {
              const pct = Math.min((tokenData.summary.today_tokens / tokenData.summary.daily_cap_tokens) * 100, 100)
              const color = pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#14B8A6'
              return (
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] text-[#64748B] mb-1">
                    <span>Daily cap usage</span>
                    <span>{tokenData.summary.today_tokens.toLocaleString()} / {tokenData.summary.daily_cap_tokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })()}

            {/* Per-model breakdown */}
            {tokenData.by_model && Object.keys(tokenData.by_model).length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] text-[#475569] mb-2 uppercase tracking-wide">Per model</div>
                {Object.entries(tokenData.by_model).map(([model, stats]) => (
                  <div key={model} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#F1F5F9] capitalize">{model}</span>
                      <span className="text-[11px] text-[#475569]">{stats.calls} calls</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] text-[#14B8A6]">€{stats.cost_eur.toFixed(4)}</span>
                      <span className="text-[11px] text-[#475569] ml-2">{stats.cache_hit_rate_pct}% cached</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 text-[11px] text-[#334155]">
              Total all time: {tokenData.summary.total_tokens.toLocaleString()} tokens · €{tokenData.summary.total_cost_eur.toFixed(4)}
            </div>
          </>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Notifications</div>
        <div className="space-y-3 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Email alerts</span>
            <span className="text-[#F1F5F9]">keithyob@gmail.com</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">WhatsApp</span>
            {results?.CALLMEBOT_API_KEY?.status === 'ok'
              ? <span className="text-[#10B981]">CallMeBot connected</span>
              : <span className="text-[#F59E0B]">CallMeBot key missing — see TOMORROW.md</span>
            }
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Resend from</span>
            <span className="text-[#F1F5F9]">onboarding@resend.dev</span>
          </div>
        </div>
      </div>
    </div>
  )
}
