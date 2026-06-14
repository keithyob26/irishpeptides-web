'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

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

  useEffect(() => { check() }, [])

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

      {/* Token budget */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Token Budget</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Daily Cap',  value: '15,000 tokens' },
            { label: 'Used Today', value: '—' },
            { label: 'Remaining',  value: '—' },
          ].map(t => (
            <div key={t.label} className="bg-[#161616] border border-white/[0.05] rounded-lg p-3 text-center">
              <div className="text-[11px] text-[#64748B] mb-1">{t.label}</div>
              <div className="text-base font-bold text-[#F1F5F9]">{t.value}</div>
            </div>
          ))}
        </div>
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
