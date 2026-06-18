"use client";

import { useEffect, useState } from "react";

interface Step {
  id: string;
  priority: "critical" | "high" | "low";
  title: string;
  text: string;
  link?: string;
  link_label?: string;
  blocks_what?: string;
  steps?: string[];
  done: boolean;
}

const ALL_STEPS: Step[] = [
  // ── CRITICAL (current session blockers) ──────────────────────────────────
  {
    id: "instagram_business",
    priority: "critical",
    title: "Switch Instagram to Business Account",
    text: "Required before Buffer or ManyChat can connect. 2 minutes.",
    link: "https://www.instagram.com/accounts/convert_to_professional_account/",
    link_label: "Open Instagram",
    blocks_what: "Buffer publishing + ManyChat comment automation",
    steps: [
      "Open Instagram app on your phone",
      "Go to your profile → tap three lines (top right) → Settings",
      "Tap Account → Switch to Professional Account",
      "Choose Business (not Creator)",
      "Category: Health & Beauty → done",
    ],
    done: false,
  },
  {
    id: "tiktok",
    priority: "critical",
    title: "Switch TikTok to Business Account",
    text: "Required for Buffer scheduling. 2 minutes.",
    link: "https://www.tiktok.com/",
    link_label: "Open TikTok",
    blocks_what: "TikTok publishing via Buffer",
    steps: [
      "Open TikTok app → Profile (bottom right)",
      "Tap three lines → Settings and Privacy",
      "Tap Manage Account → Switch to Business Account",
      "Category: Health & Beauty → Continue",
    ],
    done: false,
  },
  {
    id: "buffer",
    priority: "critical",
    title: "Reconnect Buffer — Get Fresh Token",
    text: "Current token expired (401). Reconnect Instagram + TikTok, get new Access Token, send to Claude.",
    link: "https://buffer.com/",
    link_label: "Open Buffer",
    blocks_what: "Daily 7am auto-posting to Instagram + TikTok",
    steps: [
      "Go to buffer.com → log in",
      "Click + Connect Channel → Instagram → connect your Business account",
      "Click + Connect Channel → TikTok → connect your Business account",
      "Set posting schedule: 7am daily on both channels",
      "Go to buffer.com/developers/apps → your app → copy Access Token",
      "Open C:\\Projects\\greyhound-dashboard\\tableau_secrets.env",
      "Replace BUFFER_ACCESS_TOKEN= with the new token",
      "Tell Claude 'Buffer token updated'",
    ],
    done: false,
  },
  {
    id: "manychat",
    priority: "critical",
    title: "ManyChat — Connect Instagram + Build Keyword Flows",
    text: "Comment automation. When someone comments IRISH/GUIDE/TOOLS/PEPTIDES/COACH → auto DM with link.",
    link: "https://app.manychat.com/",
    link_label: "Open ManyChat",
    blocks_what: "Instagram comment automation",
    steps: [
      "Go to app.manychat.com → sign up or log in",
      "Connect your Instagram Business account (requires Facebook Page linked to Instagram)",
      "New Automation → Keywords → Add keyword: IRISH",
      "Action: Send DM → message: 'Hey! Here is your free guide: irishpeptides.ie/free-tools'",
      "Repeat for keywords: GUIDE, TOOLS, PEPTIDES, COACH",
      "Publish each flow",
    ],
    done: false,
  },
  {
    id: "cloudflare_resend",
    priority: "critical",
    title: "Add RESEND_AUDIENCE_ID to Cloudflare Pages",
    text: "Needed so tool-gate email captures save to Resend subscriber list. 2 minutes.",
    link: "https://dash.cloudflare.com/",
    link_label: "Open Cloudflare",
    blocks_what: "Tool-gate email capture saving to subscriber list",
    steps: [
      "Go to dash.cloudflare.com → Workers & Pages",
      "Find your irishpeptides-website project → Settings",
      "Click Environment Variables → Add variable",
      "Name: RESEND_AUDIENCE_ID",
      "Value: fe3ebf86-af78-485c-bfe8-96151603d89e",
      "Save and redeploy",
    ],
    done: false,
  },
  {
    id: "zoho_password",
    priority: "critical",
    title: "Zoho App Password — Email Video Pipeline",
    text: "Agent needs app password to poll keith@irishpeptides.ie for 'IP CONTENT' subject emails.",
    link: "https://accounts.zoho.com/home#security/application_password",
    link_label: "Open Zoho Security",
    blocks_what: "Email video upload pipeline",
    steps: [
      "Go to myaccount.zoho.com → Security → App Passwords",
      "Click Generate New Password",
      "Name: Jarvis Agent → Generate",
      "Copy the password",
      "Open C:\\Projects\\greyhound-dashboard\\tableau_secrets.env",
      "Add line: ZOHO_APP_PASSWORD=<paste password here>",
      "Tell Claude 'Zoho password added'",
    ],
    done: false,
  },
  // ── HIGH PRIORITY ─────────────────────────────────────────────────────────
  {
    id: "anthropic_key",
    priority: "low",
    title: "ANTHROPIC_API_KEY — Optional Upgrade",
    text: "Claude AI Chat works now via CLI workaround (local) + Gemini fallback (Vercel). Add key only if you want Claude on the live Vercel dashboard instead of Gemini.",
    link: "https://console.anthropic.com/settings/keys",
    link_label: "Anthropic Console",
    blocks_what: "Nothing — Claude works locally via CLI, Gemini works on Vercel",
    steps: [
      "Go to console.anthropic.com → Settings → API Keys",
      "Create new key → name: IrishPeptides",
      "Copy the key (sk-ant-...)",
      "STEP A — Vercel: vercel.com → irishpeptides-web → Settings → Environment Variables → Add ANTHROPIC_API_KEY",
      "STEP B — GitHub: github.com/keithyob26/irishpeptides-jarvis → Settings → Secrets → Actions → New secret → ANTHROPIC_API_KEY",
      "Redeploy Vercel",
    ],
    done: false,
  },
  {
    id: "ga4_json",
    priority: "high",
    title: "Add GA4 Service Account JSON to Vercel + GitHub Secrets",
    text: "Analytics panel shows no data. GA4 Monitor agent also failing on GitHub Actions because secret is missing there too.",
    link: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    link_label: "Google Cloud Console",
    blocks_what: "Analytics panel data + GA4 Monitor agent (currently failing daily)",
    steps: [
      "Go to console.cloud.google.com → IAM → Service Accounts",
      "Find or create service account → Keys tab → Add Key → JSON → download",
      "Open the downloaded JSON file — copy ALL the content",
      "STEP A — Vercel: vercel.com → irishpeptides-web → Settings → Env Vars → Add GA4_SERVICE_ACCOUNT_JSON = <paste full JSON>",
      "STEP B — GitHub: github.com/keithyob26/irishpeptides-jarvis → Settings → Secrets → Actions → New secret → GA4_SERVICE_ACCOUNT_JSON = <paste full JSON>",
      "Also add GA4_PROPERTY_ID to GitHub secrets (find in Google Analytics → Admin → Property Settings)",
      "Redeploy Vercel",
    ],
    done: false,
  },
  {
    id: "elevenlabs",
    priority: "high",
    title: "ElevenLabs — Clone Your Voice",
    text: "Record 2 minutes of your voice → agents use it for video voiceovers.",
    link: "https://elevenlabs.io/",
    link_label: "Open ElevenLabs",
    blocks_what: "Video pipeline voiceover",
    steps: [
      "Go to elevenlabs.io → sign up (free tier = 10k chars/month)",
      "Voices → Add Voice → Instant Voice Cloning",
      "Name it: Keith",
      "Record or upload 2 minutes of clear speech (no background noise)",
      "Save voice → copy Voice ID",
      "Go to elevenlabs.io → Profile → API Key → copy",
      "Open tableau_secrets.env → fill ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID",
    ],
    done: false,
  },
  {
    id: "facebook",
    priority: "high",
    title: "Facebook — Link Page to Instagram",
    text: "Instagram Business account must be linked to a Facebook Page for ManyChat and direct publishing.",
    link: "https://accountscenter.facebook.com/",
    link_label: "Accounts Centre",
    blocks_what: "ManyChat Instagram flows",
    steps: [
      "Go to accountscenter.facebook.com",
      "Confirm your phone number is verified",
      "Create or link a Facebook Page to your Instagram Business account",
      "In Instagram app → Settings → Account → Linked Accounts → Facebook",
    ],
    done: false,
  },
  {
    id: "resend_domain",
    priority: "high",
    title: "Verify irishpeptides.ie in Resend",
    text: "Emails currently send from onboarding@resend.dev. Verify domain to send from keith@irishpeptides.ie.",
    link: "https://resend.com/domains",
    link_label: "Resend Domains",
    blocks_what: "Emails from irishpeptides.ie address",
    steps: [
      "Go to resend.com/domains → Add Domain",
      "Enter: irishpeptides.ie",
      "Copy the 3 DNS records (SPF, DKIM, MX)",
      "Log in to your DNS provider (Cloudflare/NameCheap)",
      "Add all 3 DNS records",
      "Click Verify in Resend — takes up to 48 hours",
    ],
    done: false,
  },
  // ── LOWER PRIORITY ────────────────────────────────────────────────────────
  {
    id: "github_pat_workflow",
    priority: "low",
    title: "GitHub PAT — Workflow Write Scope",
    text: "Current token missing workflow scope. Needed to push GitHub Actions .yml files.",
    link: "https://github.com/settings/tokens/new",
    link_label: "New GitHub Token",
    blocks_what: "Pushing workflow changes via Claude",
    steps: [
      "Go to github.com/settings/tokens/new",
      "Note: IrishPeptides Jarvis Workflow",
      "Expiry: 90 days",
      "Scopes: repo + workflow (both checked)",
      "Generate → copy token (ghp_...)",
      "Replace GITHUB_TOKEN in tableau_secrets.env",
    ],
    done: false,
  },
  {
    id: "stripe",
    priority: "low",
    title: "Stripe — When First Client Pays",
    text: "Set up when first coaching client signs up.",
    link: "https://dashboard.stripe.com/",
    link_label: "Stripe Dashboard",
    blocks_what: "Payment processing",
    steps: [
      "Go to dashboard.stripe.com → sign up",
      "Complete business verification (sole trader details)",
      "Developers → API Keys → copy Secret Key (sk_live_...)",
      "Add STRIPE_API_KEY to tableau_secrets.env",
      "Add STRIPE_API_KEY to Vercel env vars",
    ],
    done: false,
  },
  {
    id: "sole_trader",
    priority: "low",
    title: "Register as Sole Trader",
    text: "Register at Revenue.ie before first client invoice.",
    link: "https://www.revenue.ie/en/starting-a-business/registering-for-tax/how-to-register-for-tax.aspx",
    link_label: "Revenue.ie",
    blocks_what: "Legally invoicing clients",
    steps: [
      "Go to revenue.ie → MyAccount login",
      "Register for Income Tax as Sole Trader (Form TR1)",
      "Note your PPS number",
      "Choose trade name: Irish Peptides & Nutrition",
    ],
    done: false,
  },
  {
    id: "bank",
    priority: "low",
    title: "Separate Business Bank Account",
    text: "Keep business money separate when revenue starts.",
    link: "https://revolutbusiness.com/",
    link_label: "Revolut Business",
    blocks_what: "Clean bookkeeping",
    steps: [
      "Revolut Business is free for sole traders",
      "Sign up at business.revolut.com",
      "Upload ID + proof of address",
      "Takes 1-2 business days",
    ],
    done: false,
  },
  {
    id: "logo",
    priority: "low",
    title: "Add Logo to Website",
    text: "Teal shamrock/DNA design — add to header and favicon.",
    link: "https://www.canva.com/",
    link_label: "Canva",
    blocks_what: "Brand consistency",
    steps: [
      "Design in Canva or use existing logo file",
      "Export as SVG (header) and 32x32 PNG (favicon)",
      "Add to C:\\Projects\\irishpeptides\\images\\logo.svg",
      "Tell Claude to wire it into header + favicon",
    ],
    done: false,
  },
  {
    id: "cal_com",
    priority: "low",
    title: "Cal.com Booking Links",
    text: "One booking link per coaching tier (Discovery call, 4-week, 12-week).",
    link: "https://app.cal.com/",
    link_label: "Cal.com",
    blocks_what: "Client bookings",
    steps: [
      "Go to app.cal.com → sign up",
      "Create 3 event types: Discovery (15 min free), 4-Week Check-in (30 min), 12-Week Programme (45 min)",
      "Set availability: Mon-Fri 7pm-9pm",
      "Copy booking links and give to Claude to embed on coaching page",
    ],
    done: false,
  },
  {
    id: "cloudflare",
    priority: "low",
    title: "Cloudflare WAF Rules",
    text: "Basic bot protection for irishpeptides.ie. 5 minutes.",
    link: "https://dash.cloudflare.com/",
    link_label: "Cloudflare Dashboard",
    blocks_what: "Bot protection",
    steps: [
      "dash.cloudflare.com → irishpeptides.ie → Security → WAF",
      "Enable Bot Fight Mode (free)",
      "Add rate limit: 20 req/min per IP on /api/*",
    ],
    done: false,
  },
  {
    id: "uptimerobot",
    priority: "low",
    title: "UptimeRobot Monitoring",
    text: "Alert when irishpeptides.ie goes down.",
    link: "https://uptimerobot.com/",
    link_label: "UptimeRobot",
    blocks_what: "Downtime alerts",
    steps: [
      "uptimerobot.com → sign up (free)",
      "Add monitor → HTTP(S) → https://irishpeptides.ie",
      "Check interval: 5 minutes",
      "Alert contact: your email",
    ],
    done: false,
  },
  {
    id: "beacons",
    priority: "low",
    title: "Beacons.ai Bio Link Page",
    text: "Single link-in-bio for Instagram + TikTok pointing to all tools and coaching.",
    link: "https://beacons.ai/",
    link_label: "Beacons.ai",
    blocks_what: "Link in bio",
    steps: [
      "beacons.ai → sign up → username: irishpeptides",
      "Add links: Free Tools, Coaching, Blog, Instagram",
      "Set theme: dark green matching brand",
      "Copy your beacons.ai URL and update Instagram bio",
    ],
    done: false,
  },
  {
    id: "google_business",
    priority: "low",
    title: "Google Business Profile",
    text: "Health Consultant listing for local search visibility.",
    link: "https://business.google.com/",
    link_label: "Google Business",
    blocks_what: "Local SEO",
    steps: [
      "business.google.com → Add your business",
      "Category: Health Consultant",
      "Name: Irish Peptides & Nutrition",
      "Service area: Ireland",
      "Verify via postcard or phone",
    ],
    done: false,
  },
  {
    id: "tiktok_sounds",
    priority: "low",
    title: "TikTok Trending Sounds — Manual",
    text: "Cannot automate — browse trends and add sound before posting. 30 seconds per video.",
    link: "https://www.tiktok.com/music/",
    link_label: "TikTok Sounds",
    blocks_what: "Nothing (quick manual step per post)",
    steps: [
      "In TikTok app → Discover tab → Sounds",
      "Pick trending sound relevant to fitness/health",
      "Or use the same sound 3-4 times (builds identity)",
      "Add to video in TikTok editor before posting",
    ],
    done: false,
  },
  {
    id: "git_history_scrub",
    priority: "low",
    title: "Scrub Git History Before Going Public",
    text: "Remove API keys from git history with BFG before making irishpeptides-jarvis repo public.",
    link: "https://rtyley.github.io/bfg-repo-cleaner/",
    link_label: "BFG Repo Cleaner",
    blocks_what: "Making jarvis repo public",
    steps: [
      "Download BFG Jar from rtyley.github.io/bfg-repo-cleaner",
      "Run: java -jar bfg.jar --replace-text secrets.txt irishpeptides-jarvis.git",
      "secrets.txt contains each API key value on a separate line",
      "git reflog expire --expire=now --all && git gc --prune=now --aggressive",
      "Force push: git push --force",
    ],
    done: false,
  },
  {
    id: "google_gems",
    priority: "low",
    title: "Google Gems — AI Assistants",
    text: "Create Gems for Protocol Guard, Content Engine, Client Plan Builder.",
    link: "https://gemini.google.com/gems/",
    link_label: "Google Gems",
    blocks_what: "Quick AI reference",
    steps: [
      "gemini.google.com/gems → Create Gem",
      "Gem 1: Protocol Guard — paste legal compliance rules",
      "Gem 2: Content Engine — paste brand voice doc",
      "Gem 3: Client Plan Builder — paste coaching framework",
    ],
    done: false,
  },
  {
    id: "notebooklm",
    priority: "low",
    title: "NotebookLM — Coaching Framework",
    text: "Upload your coaching framework for AI-powered Q&A.",
    link: "https://notebooklm.google.com/",
    link_label: "NotebookLM",
    blocks_what: "AI knowledge base",
    steps: [
      "notebooklm.google.com → New notebook",
      "Upload: skills/irishpeptides.md + any coaching PDFs",
      "Use for answering detailed client questions",
    ],
    done: false,
  },
  {
    id: "obsidian",
    priority: "low",
    title: "Obsidian — Personal Knowledge Base",
    text: "Local Obsidian vault for notes, research, client notes.",
    link: "https://obsidian.md/",
    link_label: "Obsidian",
    blocks_what: "Personal knowledge management",
    steps: [
      "obsidian.md → download for Windows",
      "Create vault at C:\\Projects\\irishpeptides_notes",
      "Install plugins: Dataview, Templater",
      "Create folders: Clients, Research, Content Ideas",
    ],
    done: false,
  },
  {
    id: "firefly",
    priority: "low",
    title: "Firefly III — Finance Tracking",
    text: "Personal finance tracker via Docker when revenue starts.",
    link: "https://firefly-iii.org/",
    link_label: "Firefly III",
    blocks_what: "Personal finance visibility",
    steps: [
      "Install Docker Desktop if not already installed",
      "Run: docker pull fireflyiii/core",
      "docker-compose up -d (get compose file from firefly-iii.org)",
      "Access at localhost:8080",
    ],
    done: false,
  },
];

const PRIORITY_COLOR = {
  critical: "#EF4444",
  high: "#F59E0B",
  low: "#64748B",
};

const PRIORITY_LABEL = {
  critical: "CRITICAL",
  high: "HIGH",
  low: "LOW",
};

export default function ManualStepsPage() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/manual-steps-done")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.done)) setDone(new Set(d.done));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleDone(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    // Fire-and-forget persist to GitHub
    fetch("/api/manual-steps-done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_id: id }),
    }).catch(() => null);
  }

  const pending = ALL_STEPS.filter((s) => !done.has(s.id));
  const doneSteps = ALL_STEPS.filter((s) => done.has(s.id));
  const critical = pending.filter((s) => s.priority === "critical");
  const high = pending.filter((s) => s.priority === "high");
  const low = pending.filter((s) => s.priority === "low");

  function StepCard({ step }: { step: Step }) {
    const isDone = done.has(step.id);
    const isOpen = expanded.has(step.id);
    return (
      <div
        style={{
          background: isDone ? "#0F172A" : "#1E293B",
          border: `1px solid ${isDone ? "#1E293B" : PRIORITY_COLOR[step.priority]}33`,
          borderLeft: isDone ? "3px solid #1E293B" : `3px solid ${PRIORITY_COLOR[step.priority]}`,
          borderRadius: "10px",
          padding: "14px 16px",
          marginBottom: "10px",
          opacity: isDone ? 0.45 : 1,
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          {/* Checkbox */}
          <button
            onClick={() => toggleDone(step.id)}
            style={{
              width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
              background: isDone ? "#14B8A6" : "transparent",
              border: `2px solid ${isDone ? "#14B8A6" : "#475569"}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", color: "#0F172A",
            }}
          >
            {isDone ? "✓" : ""}
          </button>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
              <span style={{
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                color: PRIORITY_COLOR[step.priority], textTransform: "uppercase",
              }}>
                {PRIORITY_LABEL[step.priority]}
              </span>
              <span style={{ color: "#E2E8F0", fontSize: "15px", fontWeight: 600 }}>
                {step.title}
              </span>
            </div>
            <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 8px", lineHeight: "1.5" }}>
              {step.text}
            </p>
            {step.blocks_what && (
              <p style={{ color: "#F59E0B", fontSize: "11px", margin: "0 0 8px" }}>
                Blocks: {step.blocks_what}
              </p>
            )}

            {/* Action row */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {step.link && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block", background: "#14B8A6", color: "#0A0F1E",
                    fontWeight: 700, fontSize: "12px", padding: "5px 12px",
                    borderRadius: "6px", textDecoration: "none",
                  }}
                >
                  {step.link_label || "Open Link"} →
                </a>
              )}
              {step.steps && (
                <button
                  onClick={() => toggleExpand(step.id)}
                  style={{
                    background: "transparent", color: "#14B8A6", border: "1px solid #14B8A620",
                    borderRadius: "6px", padding: "5px 12px", fontSize: "12px", cursor: "pointer",
                  }}
                >
                  {isOpen ? "Hide steps ↑" : `Steps (${step.steps.length}) ↓`}
                </button>
              )}
            </div>

            {/* Expanded steps */}
            {isOpen && step.steps && (
              <ol style={{ margin: "12px 0 0 0", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {step.steps.map((s, i) => (
                  <li key={i} style={{ color: "#CBD5E1", fontSize: "13px", lineHeight: "1.5" }}>
                    {s}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    );
  }

  function Section({ label, steps, color }: { label: string; steps: Step[]; color: string }) {
    if (!steps.length) return null;
    return (
      <>
        <p style={{
          color, fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", margin: "20px 0 10px",
        }}>
          {label} ({steps.length})
        </p>
        {steps.map((s) => <StepCard key={s.id} step={s} />)}
      </>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0F172A", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ color: "#14B8A6", fontSize: "22px", fontWeight: 700, margin: "0 0 4px" }}>
            Manual Steps
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: "0" }}>
            {loading ? "Loading..." : `${pending.length} remaining · ${doneSteps.length} done`} · Tap checkbox to mark complete · Tap &quot;Steps&quot; for instructions
          </p>
        </div>

        {!mounted ? null : !loading && (
          <>
            <Section label="Critical — Do First" steps={critical} color="#EF4444" />
            <Section label="High Priority" steps={high} color="#F59E0B" />
            <Section label="When Ready" steps={low} color="#64748B" />

            {doneSteps.length > 0 && (
              <>
                <p style={{ color: "#1E293B", fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "24px 0 10px" }}>
                  Done ({doneSteps.length})
                </p>
                {doneSteps.map((s) => <StepCard key={s.id} step={s} />)}
              </>
            )}
          </>
        )}

        <p style={{ color: "#1E293B", fontSize: "11px", textAlign: "center", marginTop: "32px" }}>
          Bookmark this page · Tap checkbox to mark complete
        </p>
      </div>
    </main>
  );
}
