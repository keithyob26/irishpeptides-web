"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",          icon: "⬡",  label: "Home"          },
  { href: "/chat",      icon: "💬", label: "AI Chat"       },
  { href: "/analytics", icon: "📊", label: "Analytics"     },
  { href: "/content",   icon: "✍️", label: "Content Studio"},
  { href: "/social",    icon: "📣", label: "Social Hub"    },
  { href: "/agents",    icon: "🤖", label: "Agent Network" },
  { href: "/site",      icon: "🌐", label: "Site Control"  },
  { href: "/settings",  icon: "⚙️", label: "Settings"      },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/[0.06] bg-[#0D0D0D]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0A0F1E] font-black text-sm"
               style={{ background: "#14B8A6" }}>IP</div>
          <div>
            <div className="text-[13px] font-800 text-[#F1F5F9] leading-tight font-bold">Irish Peptides</div>
            <div className="text-[10px] text-[#64748B]">Command Centre</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ href, icon, label }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                active
                  ? "bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20"
                  : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04]"
              }`}>
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="status-dot status-green"></span>
          <span className="text-[11px] text-[#64748B]">Jarvis online</span>
        </div>
        <div className="text-[10px] text-[#475569] mt-1">irishpeptides.ie</div>
      </div>
    </aside>
  );
}
