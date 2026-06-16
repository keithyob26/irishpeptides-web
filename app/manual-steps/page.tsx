"use client";

import { useEffect, useState } from "react";

const NOTION_PAGE_ID = "381a0eb7-e3ea-81e5-afec-e0785e05de61";

interface Step {
  id: string;
  text: string;
  done: boolean;
  blocks_what?: string;
}

// Hardcoded fallback — keeps working if Notion API is unavailable
const FALLBACK_STEPS: Step[] = [
  { id: "buffer", text: "Buffer OAuth — buffer.com/developers/apps", done: false, blocks_what: "all social publishing" },
  { id: "manychat", text: "ManyChat key — app.manychat.com Settings > API", done: false, blocks_what: "comment automation" },
  { id: "elevenlabs", text: "ElevenLabs voice — elevenlabs.io — record 2 minutes — name it Keith", done: false, blocks_what: "video pipeline" },
  { id: "tiktok", text: "TikTok — convert existing 2000 follower account to Business — rebrand", done: false, blocks_what: "TikTok publishing" },
  { id: "facebook", text: "Facebook developer — update phone at accountscenter.facebook.com", done: false, blocks_what: "Instagram direct publishing" },
  { id: "github_emails", text: "GitHub emails — github.com/settings/notifications — turn off Actions failures", done: false },
  { id: "resend_domain", text: "Resend domain — resend.com/domains", done: false, blocks_what: "sending from irishpeptides.ie email" },
  { id: "stripe", text: "Stripe key — when first client pays", done: false, blocks_what: "payment processing" },
  { id: "cloudflare", text: "Cloudflare WAF — dash.cloudflare.com — 5 minutes", done: false },
  { id: "uptimerobot", text: "UptimeRobot — monitors — uptimerobot.com", done: false },
  { id: "cal_com", text: "Cal.com — booking links per coaching tier", done: false },
  { id: "beacons", text: "Beacons.ai — bio link page", done: false },
  { id: "google_business", text: "Google Business Profile — Health Consultant — business.google.com", done: false },
  { id: "google_gems", text: "Google Gems — Protocol Guard, Content Engine, Client Plan Builder", done: false },
  { id: "notebooklm", text: "NotebookLM — upload coaching framework — notebooklm.google.com", done: false },
  { id: "obsidian", text: "Obsidian — local install for personal knowledge base", done: false },
  { id: "sole_trader", text: "Register sole trader — Revenue.ie Form TR1 when first client pays", done: false, blocks_what: "invoicing clients" },
  { id: "bank", text: "Separate bank account — needed when first client pays", done: false },
  { id: "logo", text: "Add Irish Peptides logo (teal shamrock/DNA/bicep) to website header and favicon", done: false },
  { id: "firefly", text: "Firefly III — Docker install when revenue starts (personal finance tracking)", done: false },
  { id: "git_history", text: "Scrub git history with BFG before making irishpeptides-jarvis public", done: false },
  { id: "tiktok_sounds", text: "TikTok trending sounds — cannot automate via API. Browse trends and add manually before posting (30 seconds). Note on every video in Content Studio.", done: false },
];

const BLOCKERS: Record<string, string[]> = {
  buffer: ["all social publishing — Instagram, Facebook, TikTok"],
  manychat: ["comment automation — keywords IRISH, GUIDE, TOOLS, PEPTIDES, COACH"],
  elevenlabs: ["video pipeline — faceless reels with Keith's voice"],
  facebook: ["Instagram direct publishing"],
  stripe: ["payment processing when first client pays"],
  sole_trader: ["invoicing clients legally"],
};

export default function ManualStepsPage() {
  const [steps, setSteps] = useState<Step[]>(FALLBACK_STEPS);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("");

  useEffect(() => {
    fetchSteps();
  }, []);

  async function fetchSteps() {
    setLoading(true);
    try {
      const res = await fetch(`/api/notion-manual-steps?page=${NOTION_PAGE_ID}`);
      if (res.ok) {
        const data = await res.json();
        if (data.steps?.length) {
          setSteps(data.steps);
        }
      }
    } catch { /* use fallback */ }
    setLastRefresh(new Date().toLocaleTimeString("en-IE"));
    setLoading(false);
  }

  function toggleStep(id: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
    // Fire-and-forget Notion update
    fetch("/api/notion-manual-steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step_id: id }),
    }).catch(() => null);
  }

  const pending = steps.filter((s) => !s.done);
  const done = steps.filter((s) => s.done);

  return (
    <main style={{ minHeight: "100vh", background: "#0F172A", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ color: "#14B8A6", fontSize: "22px", fontWeight: 700, margin: "0 0 4px" }}>
            Manual Steps
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: "0 0 12px" }}>
            Irish Peptides — Section 3 from Notion Master Status
          </p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ color: "#94A3B8", fontSize: "12px" }}>
              {pending.length} remaining · Last: {lastRefresh}
            </span>
            <button
              onClick={fetchSteps}
              style={{
                background: "transparent", color: "#14B8A6", border: "1px solid #14B8A6",
                borderRadius: "6px", padding: "4px 12px", fontSize: "12px", cursor: "pointer",
              }}
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Pending steps */}
        {pending.map((step) => (
          <div
            key={step.id}
            style={{
              background: "#1E293B", border: "1px solid #334155", borderRadius: "10px",
              padding: "16px", marginBottom: "10px", display: "flex", gap: "14px",
              cursor: "pointer",
            }}
            onClick={() => toggleStep(step.id)}
          >
            <div style={{
              width: "22px", height: "22px", borderRadius: "50%",
              border: "2px solid #475569", flexShrink: 0, marginTop: "2px",
            }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: "#E2E8F0", fontSize: "15px", margin: "0 0 4px", lineHeight: "1.4" }}>
                {step.text}
              </p>
              {step.blocks_what && (
                <p style={{ color: "#F59E0B", fontSize: "12px", margin: 0 }}>
                  Blocks: {step.blocks_what}
                </p>
              )}
              {BLOCKERS[step.id] && (
                <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0" }}>
                  Blocking: {BLOCKERS[step.id].join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Done section */}
        {done.length > 0 && (
          <>
            <p style={{ color: "#475569", fontSize: "12px", margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Done ({done.length})
            </p>
            {done.map((step) => (
              <div
                key={step.id}
                style={{
                  background: "#0F172A", border: "1px solid #1E293B", borderRadius: "10px",
                  padding: "12px 16px", marginBottom: "8px", display: "flex", gap: "14px",
                  cursor: "pointer", opacity: 0.5,
                }}
                onClick={() => toggleStep(step.id)}
              >
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  background: "#14B8A6", flexShrink: 0, marginTop: "2px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", color: "#0F172A",
                }}>✓</div>
                <p style={{ color: "#475569", fontSize: "14px", margin: 0, textDecoration: "line-through" }}>
                  {step.text}
                </p>
              </div>
            ))}
          </>
        )}

        <p style={{ color: "#1E293B", fontSize: "11px", textAlign: "center", marginTop: "32px" }}>
          Bookmark this page · Tap items to mark complete
        </p>
      </div>
    </main>
  );
}
