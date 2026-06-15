'use client'

import { useState } from 'react'
import PageHeader from '@/components/PageHeader'

const PLATFORM_COLORS: Record<string, string> = {
  Blog:       '#8B5CF6',
  Instagram:  '#EC4899',
  TikTok:     '#14B8A6',
  Newsletter: '#F59E0B',
  YouTube:    '#EF4444',
  LinkedIn:   '#3B82F6',
}

const PLATFORM_ICONS: Record<string, string> = {
  Blog:       '📝',
  Instagram:  '📸',
  TikTok:     '🎵',
  Newsletter: '📧',
  YouTube:    '▶️',
  LinkedIn:   '💼',
}

interface CalEvent {
  date: string // YYYY-MM-DD
  platform: string
  title: string
  status: 'scheduled' | 'draft' | 'published'
}

const EVENTS: CalEvent[] = [
  { date: '2026-06-17', platform: 'Blog',       title: 'TB-500 vs BPC-157: Which Peptide Heals Faster?', status: 'scheduled' },
  { date: '2026-06-17', platform: 'Instagram',  title: 'TB-500 reel — recovery science',                  status: 'draft' },
  { date: '2026-06-19', platform: 'TikTok',     title: '3 peptides for joint recovery',                   status: 'scheduled' },
  { date: '2026-06-21', platform: 'Newsletter', title: 'Week 3 — Peptide science roundup',                status: 'scheduled' },
  { date: '2026-06-22', platform: 'Blog',       title: 'BPC-157 Ireland: Buy Guide + Dosing',             status: 'draft' },
  { date: '2026-06-24', platform: 'Instagram',  title: 'BPC-157 infographic post',                        status: 'scheduled' },
  { date: '2026-06-26', platform: 'TikTok',     title: 'Peptide storage — fridge vs freezer?',            status: 'scheduled' },
  { date: '2026-06-28', platform: 'Newsletter', title: 'Week 4 — New products drop preview',              status: 'scheduled' },
  { date: '2026-07-01', platform: 'Blog',       title: 'Sermorelin vs Ipamorelin — GH peptides compared', status: 'scheduled' },
  { date: '2026-07-03', platform: 'YouTube',    title: 'Peptide Protocol Video — BPC-157 + TB-500',       status: 'draft' },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<string[]>([])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const filteredEvents = EVENTS.filter(e => {
    if (platforms.length > 0 && !platforms.includes(e.platform)) return false
    const [ey, em] = e.date.split('-').map(Number)
    return ey === year && em - 1 === month
  })

  function togglePlatform(p: string) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const selectedEvents = selected ? EVENTS.filter(e => e.date === selected) : []

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="📅 Content Calendar"
        subtitle="Scheduled content across all platforms"
        badge={{ label: `${EVENTS.length} planned`, ok: true }}
      />

      {/* Platform filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.keys(PLATFORM_COLORS).map(p => (
          <button
            key={p}
            onClick={() => togglePlatform(p)}
            className="text-[11px] px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5"
            style={{
              borderColor: platforms.includes(p) ? PLATFORM_COLORS[p] + '80' : 'rgba(255,255,255,0.07)',
              background: platforms.includes(p) ? PLATFORM_COLORS[p] + '15' : 'transparent',
              color: platforms.includes(p) ? PLATFORM_COLORS[p] : '#94A3B8',
            }}
          >
            <span>{PLATFORM_ICONS[p]}</span>
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-[#94A3B8] hover:text-[#F1F5F9] text-lg px-2">←</button>
        <div className="text-[15px] font-bold text-[#F1F5F9]">{MONTH_NAMES[month]} {year}</div>
        <button onClick={nextMonth} className="text-[#94A3B8] hover:text-[#F1F5F9] text-lg px-2">→</button>
      </div>

      {/* Calendar grid */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl overflow-hidden mb-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.07]">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-[#475569] py-2 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-white/[0.04]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = filteredEvents.filter(e => e.date === dateStr)
            const isToday = dateStr === today.toISOString().split('T')[0]
            const isSelected = dateStr === selected

            return (
              <div
                key={day}
                onClick={() => setSelected(isSelected ? null : dateStr)}
                className={`min-h-[80px] border-b border-r border-white/[0.04] p-1.5 cursor-pointer transition-all ${
                  isSelected ? 'bg-[#14B8A6]/10' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className={`text-[11px] font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-[#14B8A6] text-[#0A0F1E]' : 'text-[#64748B]'
                }`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((e, ei) => (
                    <div
                      key={ei}
                      className="text-[9px] rounded px-1 py-0.5 truncate"
                      style={{ background: PLATFORM_COLORS[e.platform] + '25', color: PLATFORM_COLORS[e.platform] }}
                    >
                      {PLATFORM_ICONS[e.platform]} {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-[#475569]">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selected && selectedEvents.length > 0 && (
        <div className="bg-[#1C1C1C] border border-[#14B8A6]/25 rounded-xl p-5">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">
            {selected}
          </div>
          <div className="space-y-3">
            {selectedEvents.map((e, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                  style={{ background: PLATFORM_COLORS[e.platform] + '20', color: PLATFORM_COLORS[e.platform] }}
                >
                  {PLATFORM_ICONS[e.platform]} {e.platform}
                </span>
                <div>
                  <div className="text-[13px] text-[#F1F5F9]">{e.title}</div>
                  <div className={`text-[10px] mt-0.5 ${
                    e.status === 'published' ? 'text-[#22C55E]' :
                    e.status === 'scheduled' ? 'text-[#14B8A6]' : 'text-[#F59E0B]'
                  }`}>
                    {e.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
