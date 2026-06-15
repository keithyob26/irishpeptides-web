'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface Contact {
  id: string
  email: string
  first_name?: string
  last_name?: string
  unsubscribed: boolean
  created_at: string
}

export default function SubscribersPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [audienceName, setAudienceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/subscribers')
      .then(r => r.json())
      .then(d => {
        setContacts(d.contacts || [])
        setAudienceName(d.audienceName || 'Primary List')
        if (d.error) setError(d.error)
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const active = contacts.filter(c => !c.unsubscribed)
  const filtered = active.filter(c =>
    !search || c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.first_name || '').toLowerCase().includes(search.toLowerCase())
  )

  function exportCSV() {
    const rows = [['Email', 'First Name', 'Last Name', 'Created'].join(',')]
    active.forEach(c => rows.push([c.email, c.first_name || '', c.last_name || '', c.created_at].join(',')))
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'subscribers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="📬 Subscribers"
        subtitle={`Resend audience — ${audienceName}`}
        badge={{ label: `${active.length} active`, ok: active.length > 0 }}
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Subscribers', value: active.length, color: '#22C55E' },
          { label: 'Unsubscribed', value: contacts.filter(c => c.unsubscribed).length, color: '#EF4444' },
          { label: 'Total', value: contacts.length, color: '#14B8A6' },
        ].map(s => (
          <div key={s.label} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[11px] text-[#64748B] uppercase tracking-wide mb-2">{s.label}</div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 text-[12px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-4 py-3">
          {error === 'RESEND_API_KEY not set'
            ? '⚠ RESEND_API_KEY not configured — add it in Vercel environment variables'
            : error}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by email…"
          className="flex-1 bg-[#1C1C1C] border border-white/[0.07] rounded-lg px-3 py-2 text-[12px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50"
        />
        <button
          onClick={exportCSV}
          className="text-[12px] font-semibold px-4 py-2 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/25 text-[#14B8A6] hover:bg-[#14B8A6]/20 transition-all"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-[13px] text-[#64748B]">Loading subscribers…</div>
      ) : (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#64748B]">
              {contacts.length === 0 ? 'No subscribers yet' : 'No results for that search'}
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left px-4 py-3 text-[#64748B] font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-[#64748B] font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-[#64748B] font-medium">Joined</th>
                  <th className="text-left px-4 py-3 text-[#64748B] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-[#161616]'}`}>
                    <td className="px-4 py-3 text-[#F1F5F9]">{c.email}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">
                      {[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#64748B]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        c.unsubscribed
                          ? 'text-[#EF4444] bg-[#EF4444]/10'
                          : 'text-[#22C55E] bg-[#22C55E]/10'
                      }`}>
                        {c.unsubscribed ? 'Unsubscribed' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
