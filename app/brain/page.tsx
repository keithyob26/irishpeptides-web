'use client'

import { useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface Node {
  id: string
  label: string
  category: string
  color: string
  x: number
  y: number
  status: 'connected' | 'partial' | 'not_connected'
  desc: string
}

interface Edge {
  from: string
  to: string
  label?: string
}

const NODES: Node[] = [
  // Core
  { id: 'jarvis',      label: 'Jarvis\nDashboard',   category: 'core',      color: '#14B8A6', x: 400, y: 260, status: 'connected',     desc: 'Next.js command centre at irishpeptides-web.vercel.app' },
  // Content
  { id: 'notion',      label: 'Notion\nBuild Queue', category: 'content',   color: '#8B5CF6', x: 160, y: 120, status: 'connected',     desc: 'Build queue, content calendar, task management' },
  { id: 'content',     label: 'Content\nEngine',     category: 'content',   color: '#8B5CF6', x: 160, y: 260, status: 'connected',     desc: 'Tue/Thu/Sat content generation — blog, social, newsletter' },
  { id: 'github',      label: 'GitHub\nActions',     category: 'infra',     color: '#E2E8F0', x: 160, y: 400, status: 'connected',     desc: '17+ scheduled workflows — agents run here' },
  // AI
  { id: 'gemini',      label: 'Gemini\nFlash',       category: 'ai',        color: '#4285F4', x: 640, y: 100, status: 'connected',     desc: 'Primary AI — content generation, SEO, analysis' },
  { id: 'deepseek',    label: 'DeepSeek',            category: 'ai',        color: '#22C55E', x: 640, y: 220, status: 'connected',     desc: 'Fallback AI — reasoning tasks' },
  { id: 'ollama',      label: 'Ollama\n(local)',      category: 'ai',        color: '#F59E0B', x: 640, y: 340, status: 'partial',       desc: 'Local LLM — laptop only, not on Vercel' },
  // Publishing
  { id: 'resend',      label: 'Resend\nEmail',       category: 'publish',   color: '#EC4899', x: 400, y: 440, status: 'connected',     desc: 'Newsletter send, subscriber list, 2 active subscribers' },
  { id: 'buffer',      label: 'Buffer\nSocial',      category: 'publish',   color: '#F97316', x: 240, y: 440, status: 'connected',     desc: 'Social scheduling — Instagram, TikTok, LinkedIn' },
  { id: 'site',        label: 'irishpeptides.ie',    category: 'publish',   color: '#14B8A6', x: 560, y: 440, status: 'connected',     desc: 'Main website on Vercel — Next.js frontend' },
  // Analytics
  { id: 'ga4',         label: 'Google\nAnalytics',   category: 'analytics', color: '#FF6D00', x: 160, y: 520, status: 'partial',       desc: 'GA4 tracking — service account JSON needed for API access' },
  { id: 'manychat',    label: 'ManyChat\nIGs/WA',    category: 'publish',   color: '#0084FF', x: 400, y: 140, status: 'connected',     desc: 'Instagram DM automation, WhatsApp flows' },
  // Alerts
  { id: 'callmebot',   label: 'WhatsApp\nAlerts',    category: 'alert',     color: '#25D366', x: 640, y: 460, status: 'connected',     desc: 'Agent alerts via CallMeBot → WhatsApp' },
]

const EDGES: Edge[] = [
  { from: 'jarvis', to: 'notion',    label: 'reads' },
  { from: 'jarvis', to: 'github',    label: 'triggers' },
  { from: 'jarvis', to: 'resend',    label: 'reads' },
  { from: 'jarvis', to: 'manychat',  label: 'reads' },
  { from: 'content', to: 'gemini',   label: 'uses' },
  { from: 'content', to: 'deepseek', label: 'fallback' },
  { from: 'content', to: 'buffer',   label: 'posts to' },
  { from: 'content', to: 'resend',   label: 'sends via' },
  { from: 'content', to: 'site',     label: 'deploys to' },
  { from: 'github',  to: 'content',  label: 'runs' },
  { from: 'github',  to: 'callmebot',label: 'notifies' },
  { from: 'ga4',     to: 'jarvis',   label: 'reports to' },
  { from: 'notion',  to: 'content',  label: 'feeds topics' },
  { from: 'ollama',  to: 'content',  label: 'local only' },
]

const CATEGORY_LABELS: Record<string, string> = {
  core:      'Core',
  content:   'Content',
  ai:        'AI Models',
  publish:   'Publishing',
  analytics: 'Analytics',
  infra:     'Infrastructure',
  alert:     'Alerts',
}

const STATUS_COLORS: Record<string, string> = {
  connected:     '#22C55E',
  partial:       '#F59E0B',
  not_connected: '#EF4444',
}

export default function BrainPage() {
  const [selected, setSelected] = useState<Node | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)

  const getNode = (id: string) => NODES.find(n => n.id === id)

  const connectedCount = NODES.filter(n => n.status === 'connected').length
  const partialCount = NODES.filter(n => n.status === 'partial').length

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🧬 Brain"
        subtitle="Connected systems knowledge graph"
        badge={{ label: `${connectedCount}/${NODES.length} connected`, ok: partialCount === 0 }}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5 text-[11px]" style={{ color: c }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            {s === 'connected' ? 'Connected' : s === 'partial' ? 'Partial' : 'Not connected'}
          </div>
        ))}
        <div className="ml-2 flex flex-wrap gap-3">
          {Object.entries(CATEGORY_LABELS).map(([cat]) => {
            const color = NODES.find(n => n.category === cat)?.color || '#475569'
            return (
              <div key={cat} className="flex items-center gap-1.5 text-[11px] text-[#475569]">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ background: color + '60' }} />
                {CATEGORY_LABELS[cat]}
              </div>
            )
          })}
        </div>
      </div>

      {/* SVG Graph */}
      <div className="bg-[#0D1117] border border-white/[0.07] rounded-xl overflow-hidden mb-4" style={{ height: 560 }}>
        <svg width="100%" height="100%" viewBox="0 80 800 480" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#334155" />
            </marker>
          </defs>

          {/* Edges */}
          {EDGES.map(e => {
            const from = getNode(e.from)
            const to = getNode(e.to)
            if (!from || !to) return null
            const edgeId = `${e.from}-${e.to}`
            const isHovered = hoveredEdge === edgeId
            const mx = (from.x + to.x) / 2
            const my = (from.y + to.y) / 2
            return (
              <g key={edgeId} onMouseEnter={() => setHoveredEdge(edgeId)} onMouseLeave={() => setHoveredEdge(null)}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isHovered ? '#14B8A6' : '#1E293B'}
                  strokeWidth={isHovered ? 1.5 : 1}
                  markerEnd="url(#arrow)"
                />
                {isHovered && e.label && (
                  <text x={mx} y={my - 4} textAnchor="middle" className="text-[9px]" fontSize={9} fill="#64748B">{e.label}</text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {NODES.map(n => {
            const isSelected = selected?.id === n.id
            return (
              <g key={n.id} onClick={() => setSelected(isSelected ? null : n)} style={{ cursor: 'pointer' }}>
                <circle
                  cx={n.x} cy={n.y} r={isSelected ? 30 : 24}
                  fill={n.color + '15'}
                  stroke={isSelected ? n.color : n.color + '60'}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ filter: isSelected ? `drop-shadow(0 0 8px ${n.color}60)` : 'none', transition: 'all 0.15s' }}
                />
                <circle
                  cx={n.x} cy={n.y - 16} r={4}
                  fill={STATUS_COLORS[n.status]}
                />
                {n.label.split('\n').map((line, li) => (
                  <text key={li} x={n.x} y={n.y + li * 11} textAnchor="middle"
                    fontSize={9} fontWeight={600} fill={isSelected ? n.color : '#94A3B8'}>
                    {line}
                  </text>
                ))}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected node detail */}
      {selected && (
        <div className="bg-[#1C1C1C] border rounded-xl p-5" style={{ borderColor: selected.color + '40' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-[15px] font-bold text-[#F1F5F9]">{selected.label.replace('\n', ' ')}</div>
              <div className="text-[11px] mt-0.5" style={{ color: STATUS_COLORS[selected.status] }}>
                {selected.status} · {CATEGORY_LABELS[selected.category]}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#475569] hover:text-[#F1F5F9] text-xl">×</button>
          </div>
          <p className="text-[13px] text-[#94A3B8]">{selected.desc}</p>
          <div className="mt-3 text-[11px]">
            <span className="text-[#64748B]">Connected edges: </span>
            <span className="text-[#F1F5F9]">
              {EDGES.filter(e => e.from === selected.id || e.to === selected.id).length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
