'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface Outcome {
  id: string
  agent: string
  action: string
  content?: string
  status: string
  created_at: string
  token?: string
  reason?: string
}

export default function ApprovalsPage() {
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [sha, setSha] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/outcomes')
      const d = await r.json()
      setOutcomes(d.outcomes || [])
      setSha(d.sha || '')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const pending = outcomes.filter(o => o.status === 'pending_approval')
  const history = outcomes.filter(o => o.status !== 'pending_approval').slice(0, 20)

  async function decide(id: string, decision: 'approve' | 'reject') {
    setProcessing(id)
    try {
      // Trigger GitHub Actions workflow
      const outcome = outcomes.find(o => o.id === id)
      if (outcome?.token) {
        await fetch(`/api/approve?token=${outcome.token}&action=${decision}`)
      }
      // Update local state
      const updated = outcomes.map(o =>
        o.id === id ? { ...o, status: decision === 'approve' ? 'approved' : 'rejected' } : o
      )
      setOutcomes(updated)
      // Write back to GitHub
      if (sha) {
        await fetch('/api/outcomes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcomes: updated, sha }),
        })
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="✅ Approvals"
        subtitle="Agent actions awaiting your approval"
        badge={{ label: `${pending.length} pending`, ok: pending.length === 0 }}
      />

      {error && (
        <div className="mb-4 text-[12px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-[13px] text-[#64748B]">Loading outcomes…</div>
      ) : (
        <>
          {/* Pending */}
          <div className="mb-8">
            <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">
              Pending Approval ({pending.length})
            </div>
            {pending.length === 0 ? (
              <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">✅</div>
                <div className="text-[13px] text-[#64748B]">No pending approvals</div>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(o => (
                  <div key={o.id} className="bg-[#1C1C1C] border border-[#F59E0B]/30 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wide">
                            {o.agent}
                          </span>
                          <span className="text-[10px] text-[#475569]">
                            {new Date(o.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[13px] font-semibold text-[#F1F5F9] mb-2">{o.action}</div>
                        {o.content && (
                          <div className="text-[12px] text-[#94A3B8] bg-[#161616] rounded-lg p-3 max-h-24 overflow-y-auto">
                            {o.content}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => decide(o.id, 'approve')}
                          disabled={processing === o.id}
                          className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/20 transition-all disabled:opacity-50"
                        >
                          {processing === o.id ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => decide(o.id, 'reject')}
                          disabled={processing === o.id}
                          className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all disabled:opacity-50"
                        >
                          {processing === o.id ? '…' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">
                Recent History
              </div>
              <div className="space-y-2">
                {history.map(o => (
                  <div key={o.id} className="bg-[#161616] border border-white/[0.05] rounded-lg px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-[#94A3B8]">{o.agent}</span>
                      <span className="text-[11px] text-[#475569] mx-2">·</span>
                      <span className="text-[12px] text-[#F1F5F9]">{o.action}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#475569]">
                        {new Date(o.created_at).toLocaleDateString()}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        o.status === 'approved'
                          ? 'text-[#22C55E] bg-[#22C55E]/10'
                          : o.status === 'rejected'
                          ? 'text-[#EF4444] bg-[#EF4444]/10'
                          : 'text-[#F59E0B] bg-[#F59E0B]/10'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6">
        <button
          onClick={load}
          className="text-[12px] text-[#14B8A6] hover:text-[#0D9488] transition-colors"
        >
          ↺ Refresh
        </button>
      </div>
    </div>
  )
}
