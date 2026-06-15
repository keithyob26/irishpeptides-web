'use client'

import { useState, useRef, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'

interface ExecMsg { role: 'user' | 'system'; content: string; status?: 'ok' | 'error' | 'running' }

const EXAMPLES = [
  'Open irishpeptides.ie and take a screenshot of the homepage',
  'Check that all nav links on irishpeptides.ie work (no 404s)',
  'Fill in the contact form with test data',
  'Scrape the current price from https://irishpeptides.ie',
]

export default function CoworkPage() {
  const [msgs, setMsgs] = useState<ExecMsg[]>([
    {
      role: 'system',
      content: 'Cowork ready. Type a browser task in plain English and Playwright will execute it locally, streaming progress in real time.\n\n⚠️ Requires local Jarvis backend running at localhost:8503.\nStart with: cd C:\\Projects\\irishpeptides_jarvis && py -3.14 cowork_server.py',
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown')
  const [files, setFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  useEffect(() => {
    fetch('/api/cowork/ping').then(r => {
      setBackendStatus(r.ok ? 'online' : 'offline')
    }).catch(() => setBackendStatus('offline'))
  }, [])

  const send = async (text?: string) => {
    const task = (text ?? input).trim()
    if (!task || loading) return
    setInput('')
    const baseHistory = [...msgs, { role: 'user' as const, content: task }]
    setMsgs([...baseHistory, { role: 'system', content: 'Starting…', status: 'running' }])
    setLoading(true)

    try {
      const form = new FormData()
      form.append('task', task)
      for (const f of files) form.append('file', f)
      setFiles([])

      const res = await fetch('/api/cowork/run', { method: 'POST', body: form })

      // Check if backend returned an error JSON (not streaming)
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const d = await res.json()
        setMsgs([...baseHistory, {
          role: 'system',
          content: d.error || 'Unknown error',
          status: 'error',
        }])
        return
      }

      if (!res.body) {
        setMsgs([...baseHistory, { role: 'system', content: 'No response from backend.', status: 'error' }])
        return
      }

      // Stream the SSE response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      const lines: string[] = []

      const updateMsg = (done = false) => {
        setMsgs([...baseHistory, {
          role: 'system',
          content: lines.join('\n') || (done ? 'Done.' : 'Running…'),
          status: done ? 'ok' : 'running',
        }])
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n')
        buf = parts.pop() ?? ''
        for (const line of parts) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') { updateMsg(true); continue }
          try {
            const parsed = JSON.parse(raw)
            if (parsed.text) { lines.push(parsed.text); updateMsg(false) }
          } catch {}
        }
      }

      updateMsg(true)
    } catch (e) {
      setMsgs([...msgs, { role: 'user', content: task }, {
        role: 'system',
        content: `Backend unreachable. Start cowork_server.py at localhost:8503.\nError: ${e}`,
        status: 'error',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title="Cowork" subtitle="Browser automation — plain English tasks executed by Playwright locally (streaming)"
        badge={{ label: backendStatus === 'online' ? 'Backend online' : 'Backend offline', ok: backendStatus === 'online' }} />

      {backendStatus === 'offline' && (
        <div className="mb-6 bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-xl p-4">
          <div className="text-[12px] font-semibold text-[#F59E0B] mb-2">Local backend not running</div>
          <p className="text-[12px] text-[#94A3B8] mb-2">
            Cowork runs Playwright browser tasks on your local machine. Start the backend:
          </p>
          <code className="block bg-[#161616] text-[#14B8A6] text-[12px] px-3 py-2 rounded-lg">
            cd C:\Projects\irishpeptides_jarvis &amp;&amp; py -3.14 cowork_server.py
          </code>
          <p className="text-[11px] text-[#475569] mt-2">
            Task history is saved to memory/cowork_history.json and synced to GitHub.
          </p>
        </div>
      )}

      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl overflow-hidden flex flex-col" style={{ height: '580px' }}>
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={m.role === 'system'
                  ? { background: m.status === 'error' ? '#EF4444' : m.status === 'ok' ? '#22C55E' : '#14B8A6', color: '#0A0F1E' }
                  : { background: '#334155', color: '#F1F5F9' }}>
                {m.role === 'system' ? (m.status === 'running' ? '⟳' : 'PW') : 'K'}
              </div>
              <div className={`rounded-xl px-4 py-3 max-w-[80%] ${
                m.role === 'user' ? 'bg-[#14B8A6]/10 border border-[#14B8A6]/20'
                : m.status === 'error' ? 'bg-[#EF4444]/5 border border-[#EF4444]/20'
                : m.status === 'ok' ? 'bg-[#22C55E]/5 border border-[#22C55E]/20'
                : 'bg-[#161616] border border-white/[0.05]'
              }`}>
                {m.role === 'system' && (
                  <div className={`text-[10px] font-semibold mb-1 ${
                    m.status === 'error' ? 'text-[#EF4444]' : m.status === 'ok' ? 'text-[#22C55E]' : 'text-[#14B8A6]'
                  }`}>
                    {m.status === 'running' ? 'Playwright — live' : m.status === 'error' ? 'Error' : m.status === 'ok' ? 'Done' : 'Cowork'}
                  </div>
                )}
                <p className="text-[13px] text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                {m.status === 'running' && (
                  <span className="inline-block mt-1 w-1.5 h-3.5 bg-[#14B8A6] animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Examples */}
        {msgs.length <= 2 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <button key={ex} onClick={() => send(ex)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-colors">
                {ex.length > 50 ? ex.slice(0, 50) + '…' : ex}
              </button>
            ))}
          </div>
        )}

        {/* File preview */}
        {files.length > 0 && (
          <div className="px-4 pt-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] text-[#14B8A6]">📄</span>
                <span className="text-[11px] text-[#94A3B8] max-w-[120px] truncate">{f.name}</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                  className="text-[#475569] hover:text-[#EF4444] text-[13px] leading-none">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-white/[0.07] p-4 flex gap-2">
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.docx,image/*" multiple className="hidden"
            onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            className="px-3 py-3 rounded-lg border border-white/[0.07] text-[#64748B] hover:text-[#14B8A6] hover:border-[#14B8A6]/30 transition-colors disabled:opacity-40 text-[15px]"
            title="Attach PDF or image as context">📎</button>
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Describe a browser task in plain English…" disabled={loading}
            className="flex-1 bg-[#161616] border border-white/[0.07] rounded-lg px-4 py-3 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50 disabled:opacity-50" />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-lg text-[13px] font-semibold text-[#0A0F1E] disabled:opacity-40 transition-opacity"
            style={{ background: '#14B8A6' }}>
            {loading ? '⟳' : 'Run'}
          </button>
        </div>
      </div>
    </div>
  )
}
