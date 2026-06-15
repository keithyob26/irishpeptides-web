'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface NotionTask {
  id: string
  title: string
  status: string
  checked: boolean
  priority?: string
  category?: string
}

export default function NotionPage() {
  const [tasks, setTasks] = useState<NotionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/notion-queue')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setTasks(d.tasks || [])
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const unchecked = tasks.filter(t => !t.checked)
  const checked = tasks.filter(t => t.checked)

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="📋 Notion"
        subtitle="Irish Peptides Build Queue — page 37da0eb7-e3ea-819e-af5b-e76db92a7c8c"
        badge={{ label: `${unchecked.length} open tasks`, ok: unchecked.length === 0 }}
      />

      {error && (
        <div className="mb-4 bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-xl px-4 py-3">
          <div className="text-[12px] text-[#F59E0B]">
            {error.includes('NOTION_API_KEY') ? (
              <>⚠ NOTION_API_KEY not set — <a href="https://vercel.com/keithyob26/irishpeptides-web/settings/environment-variables" target="_blank" className="underline">configure in Vercel</a></>
            ) : (
              <>{error}</>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-[13px] text-[#64748B]">Loading Notion data…</div>
      ) : (
        <>
          {/* Unchecked */}
          <div className="mb-6">
            <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">
              Open Tasks ({unchecked.length})
            </div>
            {unchecked.length === 0 ? (
              <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 text-center">
                <div className="text-2xl mb-2">🎉</div>
                <div className="text-[13px] text-[#64748B]">Build queue empty — all tasks complete</div>
              </div>
            ) : (
              <div className="space-y-2">
                {unchecked.map(t => (
                  <div key={t.id} className="bg-[#1C1C1C] border border-white/[0.07] rounded-lg px-4 py-3 flex items-center gap-3">
                    <div className="w-4 h-4 rounded border border-[#475569] shrink-0" />
                    <div className="flex-1">
                      <div className="text-[13px] text-[#F1F5F9]">{t.title}</div>
                      {(t.priority || t.category) && (
                        <div className="flex gap-2 mt-1">
                          {t.priority && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              t.priority === 'High' ? 'text-[#EF4444] bg-[#EF4444]/10' :
                              t.priority === 'Medium' ? 'text-[#F59E0B] bg-[#F59E0B]/10' :
                              'text-[#64748B] bg-white/[0.05]'
                            }`}>{t.priority}</span>
                          )}
                          {t.category && (
                            <span className="text-[10px] text-[#64748B] bg-white/[0.05] px-1.5 py-0.5 rounded">{t.category}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed */}
          {checked.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">
                Completed ({checked.length})
              </div>
              <div className="space-y-2">
                {checked.slice(0, 10).map(t => (
                  <div key={t.id} className="bg-[#161616] border border-white/[0.04] rounded-lg px-4 py-3 flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-[#22C55E]/20 border border-[#22C55E]/30 flex items-center justify-center shrink-0">
                      <span className="text-[9px] text-[#22C55E]">✓</span>
                    </div>
                    <div className="text-[12px] text-[#475569] line-through">{t.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6">
        <a
          href="https://www.notion.so/37da0eb7e3ea819eaf5be76db92a7c8c"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-[#14B8A6] hover:underline"
        >
          → Open in Notion
        </a>
      </div>
    </div>
  )
}
