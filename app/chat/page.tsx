'use client'

import { useState, useRef, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'

type Msg = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  'How many subscribers do I have?',
  'How did my site do yesterday?',
  'What should I post about this week?',
  'How much have I made this month?',
]

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'assistant',
      content: "Good morning. I'm your Irish Peptides AI assistant. Ask me about site traffic, subscribers, content ideas, revenue, or anything about the business."
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState<'gemini' | 'deepseek'>('gemini')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = async (text?: string) => {
    const message = (text ?? input).trim()
    if (!message || loading) return
    setInput('')
    const newMsgs: Msg[] = [...msgs, { role: 'user', content: message }]
    setMsgs(newMsgs)
    setLoading(true)
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model }),
      })
      const d = await r.json()
      setMsgs(prev => [...prev, { role: 'assistant', content: d.reply ?? 'No response.' }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Connection error. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="💬 AI Chat"
        subtitle="Ask Jarvis anything about Irish Peptides — live data, content ideas, revenue"
        badge={{ label: 'Live', ok: true }}
      />

      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl overflow-hidden">
        {/* Chat history */}
        <div className="h-[460px] p-6 overflow-y-auto flex flex-col gap-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={m.role === 'assistant'
                  ? { background: '#14B8A6', color: '#0A0F1E' }
                  : { background: '#334155', color: '#F1F5F9' }
                }
              >
                {m.role === 'assistant' ? 'J' : 'K'}
              </div>
              <div className={`rounded-xl px-4 py-3 max-w-[78%] ${
                m.role === 'assistant'
                  ? 'bg-[#161616] border border-white/[0.05]'
                  : 'bg-[#14B8A6]/10 border border-[#14B8A6]/20'
              }`}>
                {m.role === 'assistant' && (
                  <div className="text-[11px] text-[#14B8A6] font-semibold mb-1">Jarvis</div>
                )}
                <p className="text-[13px] text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                  {m.content}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                   style={{ background: '#14B8A6', color: '#0A0F1E' }}>J</div>
              <div className="bg-[#161616] border border-white/[0.05] rounded-xl px-4 py-3">
                <div className="text-[11px] text-[#14B8A6] font-semibold mb-1">Jarvis</div>
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]"
                         style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Starter prompts */}
        {msgs.length === 1 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {STARTERS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-[12px] px-3 py-1.5 rounded-full border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="border-t border-white/[0.07] p-4">
          <div className="flex gap-2 mb-3">
            {(['gemini', 'deepseek'] as const).map(m => (
              <button key={m} onClick={() => setModel(m)}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                  model === m
                    ? 'bg-[#14B8A6]/10 border-[#14B8A6]/30 text-[#14B8A6]'
                    : 'border-white/[0.07] text-[#64748B] hover:text-[#F1F5F9]'
                }`}>
                {m === 'gemini' ? 'Gemini Flash' : 'DeepSeek'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask Jarvis anything…"
              disabled={loading}
              className="flex-1 bg-[#161616] border border-white/[0.07] rounded-lg px-4 py-3 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50 disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-lg text-[13px] font-semibold text-[#0A0F1E] disabled:opacity-40 transition-opacity"
              style={{ background: '#14B8A6' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
