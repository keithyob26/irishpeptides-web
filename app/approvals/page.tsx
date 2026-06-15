'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'

interface Outcome {
  id: string
  agent: string
  action: string
  content?: string
  status: string
  created_at: string
  title?: string
  type?: string
}

export default function ApprovalsPage() {
  const router = useRouter()
  const [pending, setPending] = useState<Outcome[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/outcomes')
      .then(r => r.json())
      .then(d => {
        const p = (d.outcomes || []).filter((o: Outcome) => o.status === 'pending_approval')
        setPending(p)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="Approvals"
        subtitle="Content approval now handled in Content Studio"
        badge={{ label: loading ? '…' : `${pending.length} pending`, ok: pending.length === 0 }}
      />

      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-8 text-center mb-6">
        <div className="text-4xl mb-3">✍️</div>
        <div className="text-[15px] font-bold text-[#F1F5F9] mb-2">Approvals moved to Content Studio</div>
        <div className="text-[13px] text-[#64748B] mb-6 max-w-md mx-auto">
          All content approval — inline approve/reject, image preview, Buffer/Resend/GitHub publish — now happens directly in Content Studio.
        </div>
        <button
          onClick={() => router.push('/content')}
          className="px-6 py-3 rounded-lg text-[13px] font-semibold text-[#0A0F1E] transition-opacity hover:opacity-90"
          style={{ background: '#14B8A6' }}
        >
          {pending.length > 0 ? `Review ${pending.length} pending →` : 'Go to Content Studio →'}
        </button>
      </div>

      {/* Quick summary */}
      {!loading && pending.length > 0 && (
        <div className="bg-[#1C1C1C] border border-[#F59E0B]/20 rounded-xl p-5">
          <div className="text-[11px] font-semibold text-[#F59E0B] uppercase tracking-wide mb-3">
            Pending Items ({pending.length})
          </div>
          <div className="space-y-2">
            {pending.slice(0, 5).map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 cursor-pointer"
                onClick={() => router.push('/content')}>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[#F1F5F9] truncate">{o.title || o.action}</div>
                  <div className="text-[10px] text-[#64748B]">{o.agent} · {new Date(o.created_at).toLocaleString()}</div>
                </div>
                <span className="text-[10px] text-[#F59E0B] ml-3 shrink-0">Review →</span>
              </div>
            ))}
            {pending.length > 5 && (
              <div className="text-[11px] text-[#64748B] pt-1">
                +{pending.length - 5} more — <button onClick={() => router.push('/content')} className="text-[#14B8A6] hover:underline">view all in Content Studio</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
