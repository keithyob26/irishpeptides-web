"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; icon: string; label: string; badge?: number };

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "",
    items: [
      { href: "/",              icon: "⬡",  label: "Home"            },
      { href: "/manual-steps",  icon: "☑️", label: "Manual Steps"    },
      { href: "/chat",          icon: "💬", label: "AI Chat"         },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/content",    icon: "✍️", label: "Content Studio"  },
      { href: "/upload",     icon: "📸", label: "Upload Photo"    },
      { href: "/calendar",   icon: "📅", label: "Content Calendar"},
      { href: "/optimizer",  icon: "🔍", label: "Optimizer"       },
      { href: "/competitor",          icon: "🎯", label: "Competitors"     },
      { href: "/market-intelligence", icon: "📈", label: "Market Intel"    },
    ],
  },
  {
    title: "Business",
    items: [
      { href: "/analytics",  icon: "📊", label: "Analytics"       },
      { href: "/seo",        icon: "🔎", label: "SEO & Rankings"  },
      { href: "/revenue",    icon: "💰", label: "Revenue"         },
      { href: "/subscribers",icon: "📬", label: "Subscribers"     },
      { href: "/social",     icon: "📣", label: "Social Hub"      },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/agents",        icon: "🤖", label: "Agent Network"   },
      { href: "/agent-skills",  icon: "🎓", label: "Agent Skills"    },
      { href: "/approvals",     icon: "✅", label: "Approvals"       },
      { href: "/notion",        icon: "📋", label: "Notion"          },
      { href: "/health",        icon: "🏥", label: "System Health"   },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/site",       icon: "🌐", label: "Site Control"    },
      { href: "/cowork",     icon: "🤝", label: "Cowork"          },
      { href: "/brain",      icon: "🧬", label: "Brain"           },
      { href: "/memory",     icon: "🧠", label: "Memory"          },
      { href: "/self-build", icon: "⚙️", label: "Self Build"      },
      { href: "/settings",   icon: "⚙️", label: "Settings"        },
      { href: "/help",       icon: "❓", label: "Help"             },
    ],
  },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/[0.06] bg-[#0D0D0D]">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0A0F1E] font-black text-sm"
               style={{ background: "#14B8A6" }}>IP</div>
          <div>
            <div className="text-[13px] font-bold text-[#F1F5F9] leading-tight">Irish Peptides</div>
            <div className="text-[10px] text-[#64748B]">Command Centre</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-3" : ""}>
            {section.title && (
              <div className="text-[9px] font-bold text-[#334155] uppercase tracking-wider px-3 py-1.5">
                {section.title}
              </div>
            )}
            {section.items.map(({ href, icon, label, badge }) => {
              const active = path === href || (href !== "/" && path.startsWith(href));
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-100 ${
                    active
                      ? "bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20"
                      : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04]"
                  }`}>
                  <span className="text-[13px] leading-none shrink-0">{icon}</span>
                  <span className="flex-1 truncate">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="text-[9px] font-bold bg-[#EF4444] text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="status-dot status-green"></span>
          <span className="text-[11px] text-[#64748B]">Jarvis online</span>
        </div>
        <div className="text-[10px] text-[#475569] mt-0.5">irishpeptides-web.vercel.app</div>
      </div>
    </aside>
  );
}
