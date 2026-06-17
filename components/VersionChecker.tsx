'use client'

import { useEffect, useRef, useState } from 'react'

export default function VersionChecker() {
  const [newVersion, setNewVersion] = useState(false)
  const knownSha = useRef<string | null>(null)

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/version', { cache: 'no-store' })
        if (!r.ok) return
        const d = await r.json()
        if (!knownSha.current) {
          knownSha.current = d.sha
        } else if (d.sha !== knownSha.current) {
          setNewVersion(true)
        }
      } catch {}
    }

    check()
    const interval = setInterval(check, 5 * 60 * 1000) // check every 5 min
    return () => clearInterval(interval)
  }, [])

  if (!newVersion) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#14B8A6] text-[#0A0F1E] rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg text-[12px] font-semibold">
      <span>New version deployed</span>
      <button
        onClick={() => window.location.reload()}
        className="bg-[#0A0F1E]/20 hover:bg-[#0A0F1E]/40 rounded-lg px-3 py-1.5 transition-colors"
      >
        Reload
      </button>
      <button
        onClick={() => setNewVersion(false)}
        className="text-[#0A0F1E]/60 hover:text-[#0A0F1E] text-[15px] leading-none"
      >
        ×
      </button>
    </div>
  )
}
