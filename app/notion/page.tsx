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
  const [tasks, setTasks]       = useState<NotionTask[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [showAllDone, setShowAllDone] = useState(false)
  const [newTask, setNewTask]   = useState('')
  const [adding, setAdding]     = useState(false)
  const [addMsg, setAddMsg]     = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/notion-queue')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else { setTasks(d.tasks || []); setError('') }
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const open = tasks.filter(t => !t.checked)
  const done = tasks.filter(t => t.checked)
  const doneVisible = showAllDone ? done : done.slice(0, 5)

  const addTask = async () => {
    if (!newTask.trim()) return
    setAdding(true)
    setAddMsg('')
    try {
      const r = await fetch('/api/notion-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTask.trim() }),
      })
      const d = await r.json()
      if (d.ok) {
        setNewTask('')
        setAddMsg('Added ✓')
        setTimeout(() => { setAddMsg(''); load() }, 800)
      } else {
        setAddMsg(d.error || 'Failed')
      }
    } catch (e) {
      setAddMsg(String(e))
    } finally {
      setAdding(false)
    }
  }

  const toggleTask = async (task: NotionTask) => {
    setTogglingId(task.id)
    try {
      await fetch('/api/notion-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: task.id, checked: !task.checked }),
      })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, checked: !t.checked } : t))
    } catch {}
    setTogglingId(null)
  }

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="📋 Notion Build Queue"
        subtitle="keithyob26/irishpeptides-jarvis — to_do blocks"
        badge={{ label: open.length === 0 ? `${done.length} done` : `${open.length} open · ${done.length} done`, ok: open.length === 0 }}
      />

      {error && (
        <div className="mb-4 bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-xl px-4 py-3">
          <div className="text-[12px] text-[#F59E0B]">
            {error.includes('NOTION_API_KEY') ? (
              <>⚠ NOTION_API_KEY not set — <a href="https://vercel.com/keithyob26/irishpeptides-web/settings/environment-variables" target="_blank" className="underline">configure in Vercel</a></>
            ) : <>{error}</>}
          </div>
        </div>
      )}

      {/* Add task */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add task to Notion queue…"
          className="flex-1 bg-[#1C1C1C] border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50"
        />
        <button
          onClick={addTask}
          disabled={adding || !newTask.trim()}
          className="px-4 py-2 bg-[#14B8A6]/15 border border-[#14B8A6]/30 text-[#14B8A6] text-[12px] font-semibold rounded-lg hover:bg-[#14B8A6]/25 disabled:opacity-40 transition-all"
        >
          {adding ? '…' : addMsg || 'Add'}
        </button>
        <button onClick={load} className="px-3 py-2 border border-white/[0.07] rounded-lg text-[#64748B] hover:text-[#F1F5F9] text-[12px]">↺</button>
      </div>

      {loading ? (
        <div className="text-[13px] text-[#64748B]">Loading…</div>
      ) : (
        <>
          {/* Open tasks */}
          <div className="mb-6">
            <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">
              Open ({open.length})
            </div>
            {open.length === 0 ? (
              <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5 text-center">
                <div className="text-xl mb-1">🎉</div>
                <div className="text-[13px] text-[#64748B]">Queue empty — all {done.length} tasks complete</div>
              </div>
            ) : (
              <div className="space-y-2">
                {open.map(t => (
                  <div key={t.id} className="bg-[#1C1C1C] border border-white/[0.07] rounded-lg px-4 py-3 flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(t)}
                      disabled={togglingId === t.id}
                      className="mt-0.5 w-4 h-4 rounded border border-[#475569] hover:border-[#14B8A6] shrink-0 flex items-center justify-center transition-colors"
                    >
                      {togglingId === t.id && <span className="text-[8px] text-[#64748B]">…</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[#F1F5F9] leading-snug">{t.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Done tasks */}
          {done.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">
                  Done ({done.length})
                </div>
                {done.length > 5 && (
                  <button
                    onClick={() => setShowAllDone(v => !v)}
                    className="text-[11px] text-[#14B8A6] hover:underline"
                  >
                    {showAllDone ? `Show less` : `Show all ${done.length}`}
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {doneVisible.map(t => (
                  <div key={t.id} className="bg-[#161616] border border-white/[0.03] rounded-lg px-4 py-2.5 flex items-center gap-3">
                    <button
                      onClick={() => toggleTask(t)}
                      disabled={togglingId === t.id}
                      className="w-4 h-4 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center shrink-0 hover:bg-[#22C55E]/25 transition-colors"
                    >
                      <span className="text-[9px] text-[#22C55E]">{togglingId === t.id ? '…' : '✓'}</span>
                    </button>
                    <div className="text-[12px] text-[#334155] line-through leading-snug flex-1 min-w-0 truncate">{t.title}</div>
                  </div>
                ))}
                {!showAllDone && done.length > 5 && (
                  <div className="text-[11px] text-[#334155] text-center py-1">
                    +{done.length - 5} more completed tasks
                  </div>
                )}
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
