'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'

interface Msg { role: 'user' | 'assistant'; content: string }

interface Conversation {
  id: string
  title: string
  messages: Msg[]
  created_at: string
  updated_at: string
}

type ModelKey = 'gemini' | 'deepseek' | 'claude'

const MODELS: { key: ModelKey; label: string; note?: string }[] = [
  { key: 'gemini', label: 'Gemini Flash' },
  { key: 'deepseek', label: 'DeepSeek' },
  { key: 'claude', label: 'Claude', note: 'Add ANTHROPIC_API_KEY to Vercel to activate' },
]

const STARTERS = [
  'How many subscribers do I have?',
  'What should I post about this week?',
  'How did my site do yesterday?',
  'How much have I made this month?',
]

const INITIAL_MSG: Msg = {
  role: 'assistant',
  content: "Good morning. I'm your Irish Peptides AI assistant. Ask me about site traffic, subscribers, content ideas, revenue, or anything about the business.",
}

function groupConversations(convs: Conversation[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterday = today - 86400000
  const last7 = today - 7 * 86400000
  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today', items: [] }, { label: 'Yesterday', items: [] },
    { label: 'Last 7 Days', items: [] }, { label: 'Older', items: [] },
  ]
  for (const c of convs) {
    const t = new Date(c.updated_at).getTime()
    if (t >= today) groups[0].items.push(c)
    else if (t >= yesterday) groups[1].items.push(c)
    else if (t >= last7) groups[2].items.push(c)
    else groups[3].items.push(c)
  }
  return groups.filter(g => g.items.length > 0)
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [model, setModel] = useState<ModelKey>('gemini')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const historySha = useRef('')

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, streaming])

  useEffect(() => {
    fetch('/api/chat-history').then(r => r.json()).then(d => {
      setConversations(d.conversations || [])
      historySha.current = d.sha || ''
    }).catch(() => {}).finally(() => setHistoryLoading(false))
  }, [])

  const saveConversation = useCallback(async (conv: Conversation) => {
    const updated = { ...conv, updated_at: new Date().toISOString() }
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === updated.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n }
      return [updated, ...prev]
    })
    try {
      const r = await fetch('/api/chat-history', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation: updated }),
      })
      const d = await r.json()
      if (d.sha) historySha.current = d.sha
    } catch {}
  }, [])

  const newChat = () => {
    setActiveId(null); setMsgs([INITIAL_MSG]); setInput(''); setFiles([]); setStreaming('')
  }

  const loadConversation = (conv: Conversation) => {
    setActiveId(conv.id)
    setMsgs(conv.messages.length > 0 ? conv.messages : [INITIAL_MSG])
    setInput(''); setFiles([]); setStreaming('')
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) newChat()
    await fetch('/api/chat-history', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  const send = async (text?: string) => {
    const message = (text ?? input).trim()
    if ((!message && files.length === 0) || loading) return
    setInput('')
    const newMsgs: Msg[] = [...msgs, { role: 'user', content: message }]
    setMsgs(newMsgs)
    setLoading(true)
    setStreaming('')
    const filesToSend = [...files]
    setFiles([])

    try {
      let body: FormData | string
      let headers: HeadersInit = {}
      if (filesToSend.length > 0) {
        const form = new FormData()
        form.append('message', message)
        form.append('model', model)
        for (const f of filesToSend) form.append('file', f)
        body = form
      } else {
        body = JSON.stringify({ message, model })
        headers = { 'Content-Type': 'application/json' }
      }

      const res = await fetch('/api/chat', { method: 'POST', headers, body })
      if (!res.ok || !res.body) {
        setMsgs(prev => [...prev, { role: 'assistant', content: 'Connection error.' }])
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') continue
          try {
            const parsed = JSON.parse(raw)
            if (parsed.text) {
              accumulated += parsed.text
              setStreaming(accumulated)
            }
          } catch {}
        }
      }

      const finalMsgs: Msg[] = [...newMsgs, { role: 'assistant', content: accumulated || 'No response.' }]
      setMsgs(finalMsgs)
      setStreaming('')

      const convId = activeId || uid()
      const title = message.slice(0, 60) + (message.length > 60 ? '…' : '')
      await saveConversation({
        id: convId,
        title: activeId ? (conversations.find(c => c.id === activeId)?.title ?? title) : title,
        messages: finalMsgs,
        created_at: activeId ? (conversations.find(c => c.id === activeId)?.created_at ?? new Date().toISOString()) : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (!activeId) setActiveId(convId)
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const groups = groupConversations(conversations)

  return (
    <div className="flex overflow-hidden p-8 max-w-6xl gap-0" style={{ height: 'calc(100vh - 40px)' }}>
      {/* Sidebar */}
      <div className={`flex flex-col transition-all duration-200 overflow-hidden ${sidebarOpen ? 'w-56 mr-4' : 'w-0'}`}>
        <div className={`flex flex-col h-full min-w-[224px] ${sidebarOpen ? '' : 'hidden'}`}>
          <button onClick={newChat}
            className="w-full mb-4 px-4 py-2.5 rounded-lg text-[12px] font-semibold border border-[#14B8A6]/40 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-colors text-left flex items-center gap-2">
            <span className="text-base leading-none">+</span> New Chat
          </button>
          <div className="flex-1 overflow-y-auto space-y-4">
            {historyLoading ? (
              <div className="text-[11px] text-[#475569]">Loading…</div>
            ) : groups.length === 0 ? (
              <div className="text-[11px] text-[#475569]">No history yet</div>
            ) : groups.map(g => (
              <div key={g.label}>
                <div className="text-[10px] font-semibold text-[#475569] uppercase tracking-wide mb-1.5">{g.label}</div>
                <div className="space-y-0.5">
                  {g.items.map(c => (
                    <div key={c.id} onClick={() => loadConversation(c)}
                      className={`group relative flex items-center rounded-lg px-2.5 py-2 cursor-pointer transition-colors ${
                        activeId === c.id ? 'bg-[#14B8A6]/10 border border-[#14B8A6]/20' : 'hover:bg-white/[0.04] border border-transparent'
                      }`}>
                      <span className="text-[11px] text-[#94A3B8] truncate flex-1">{c.title}</span>
                      <button onClick={(e) => deleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-[#475569] hover:text-[#EF4444] text-[14px] leading-none ml-1 transition-opacity">×</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-5 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="text-[#64748B] hover:text-[#14B8A6] text-[18px] leading-none transition-colors shrink-0" title="Toggle history">
            ☰
          </button>
          <PageHeader title="AI Chat" subtitle="Streaming · file uploads · conversation history"
            badge={{ label: model === 'gemini' ? 'Gemini' : model === 'deepseek' ? 'DeepSeek' : 'Claude', ok: true }} />
        </div>

        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl overflow-hidden flex flex-col flex-1">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 min-h-0">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={m.role === 'assistant' ? { background: '#14B8A6', color: '#0A0F1E' } : { background: '#334155', color: '#F1F5F9' }}>
                  {m.role === 'assistant' ? 'J' : 'K'}
                </div>
                <div className={`rounded-xl px-4 py-3 max-w-[78%] ${
                  m.role === 'assistant' ? 'bg-[#161616] border border-white/[0.05]' : 'bg-[#14B8A6]/10 border border-[#14B8A6]/20'
                }`}>
                  {m.role === 'assistant' && <div className="text-[11px] text-[#14B8A6] font-semibold mb-1">Jarvis</div>}
                  <p className="text-[13px] text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {(loading || streaming) && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: '#14B8A6', color: '#0A0F1E' }}>J</div>
                <div className="bg-[#161616] border border-white/[0.05] rounded-xl px-4 py-3 max-w-[78%]">
                  <div className="text-[11px] text-[#14B8A6] font-semibold mb-1">Jarvis</div>
                  {streaming ? (
                    <p className="text-[13px] text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                      {streaming}<span className="animate-pulse">▋</span>
                    </p>
                  ) : (
                    <div className="flex gap-1 items-center h-5">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]"
                          style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Starters */}
          {msgs.length === 1 && !loading && (
            <div className="px-6 pb-3 flex flex-wrap gap-2">
              {STARTERS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-[12px] px-3 py-1.5 rounded-full border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* File preview */}
          {files.length > 0 && (
            <div className="px-4 pt-2 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-[#14B8A6]/10 border border-[#14B8A6]/20 rounded-lg px-2.5 py-1.5">
                  <span className="text-[11px] text-[#14B8A6]">{f.type.startsWith('image/') ? '🖼' : '📄'}</span>
                  <span className="text-[11px] text-[#94A3B8] max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    className="text-[#475569] hover:text-[#EF4444] text-[13px] leading-none">×</button>
                </div>
              ))}
            </div>
          )}

          {/* Model selector + input */}
          <div className="border-t border-white/[0.07] p-4">
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {MODELS.map(m => (
                <button key={m.key} onClick={() => setModel(m.key)}
                  title={m.note}
                  className={`text-[11px] px-3 py-1.5 rounded-full border transition-all relative ${
                    model === m.key
                      ? 'bg-[#14B8A6]/10 border-[#14B8A6]/30 text-[#14B8A6]'
                      : 'border-white/[0.07] text-[#64748B] hover:text-[#F1F5F9]'
                  }`}>
                  {m.label}
                  {m.note && <span className="ml-1 text-[9px] text-[#475569]">*</span>}
                </button>
              ))}
              {model === 'claude' && (
                <span className="text-[10px] text-[#F59E0B] ml-1 self-center">
                  * Add ANTHROPIC_API_KEY to Vercel to activate
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*,.pdf" multiple className="hidden"
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
              <button onClick={() => fileRef.current?.click()} disabled={loading}
                className="px-3 py-3 rounded-lg border border-white/[0.07] text-[#64748B] hover:text-[#14B8A6] hover:border-[#14B8A6]/30 transition-colors disabled:opacity-40 text-[15px]"
                title="Attach image or PDF">📎</button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask Jarvis anything…" disabled={loading}
                className="flex-1 bg-[#161616] border border-white/[0.07] rounded-lg px-4 py-3 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50 disabled:opacity-50" />
              <button onClick={() => send()} disabled={loading || (!input.trim() && files.length === 0)}
                className="px-5 py-3 rounded-lg text-[13px] font-semibold text-[#0A0F1E] disabled:opacity-40 transition-opacity"
                style={{ background: '#14B8A6' }}>Send</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
