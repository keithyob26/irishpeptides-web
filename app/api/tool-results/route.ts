import { NextResponse } from "next/server";

const RESEND_KEY  = process.env.RESEND_API_KEY || "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "fe3ebf86-af78-485c-bfe8-96151603d89e";
const FROM        = "Irish Peptides <tools@irishpeptides.ie>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors }); }

  const { email, tool, results_html, results_text } = body as {
    email: string; tool: string; results_html?: string; results_text?: string;
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400, headers: cors });
  }
  if (!tool) {
    return NextResponse.json({ error: "tool name required" }, { status: 400, headers: cors });
  }

  const resultsBlock = results_html
    ? `<div style="background:#111827;border-radius:10px;padding:24px;color:#CBD5E1;font-size:14px;line-height:1.7;">${results_html}</div>`
    : `<pre style="background:#111827;border-radius:10px;padding:20px;color:#CBD5E1;font-size:13px;white-space:pre-wrap;">${results_text || "No results provided."}</pre>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="color:#14B8A6;font-size:20px;font-weight:700;margin-bottom:4px;">Irish Peptides & Nutrition</div>
  <div style="color:#475569;font-size:13px;margin-bottom:28px;">irishpeptides.ie</div>

  <h1 style="color:#E2E8F0;font-size:22px;margin:0 0 6px;">Your ${tool} Results</h1>
  <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">Here are your results from the ${tool} at irishpeptides.ie</p>

  ${resultsBlock}

  <div style="background:#0D1F1E;border:1px solid #14B8A630;border-radius:10px;padding:20px;margin:24px 0;">
    <p style="color:#14B8A6;font-weight:700;margin:0 0 8px;font-size:14px;">Get Your Free Personalised Nutrition Plan</p>
    <p style="color:#94A3B8;margin:0 0 12px;font-size:13px;">AI-generated 7-day meal plan built around Irish supermarket foods.</p>
    <a href="https://irishpeptides.ie/nutrition-guide" style="display:inline-block;background:#14B8A6;color:#0A0F1E;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;">
      Get My Free Plan →
    </a>
  </div>

  <div style="background:#111827;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
    <p style="color:#64748B;font-weight:700;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">More Free Tools</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      <a href="https://irishpeptides.ie/macro-calculator" style="color:#94A3B8;font-size:13px;text-decoration:none;">Macro Calculator</a> ·
      <a href="https://irishpeptides.ie/body-fat-calculator" style="color:#94A3B8;font-size:13px;text-decoration:none;">Body Fat Calculator</a> ·
      <a href="https://irishpeptides.ie/tdee-calculator" style="color:#94A3B8;font-size:13px;text-decoration:none;">TDEE Calculator</a> ·
      <a href="https://irishpeptides.ie/recovery-score-calculator" style="color:#94A3B8;font-size:13px;text-decoration:none;">Recovery Score</a>
    </div>
  </div>

  <p style="color:#475569;font-size:12px;margin:0;">
    You're receiving this because you requested results from irishpeptides.ie.<br>
    Questions? Reply to this email.<br>
    <a href="https://irishpeptides.ie" style="color:#14B8A6;">irishpeptides.ie</a>
  </p>
</div>
</body>
</html>`;

  if (!RESEND_KEY) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500, headers: cors });
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: `Your ${tool} Results — Irish Peptides`,
        html,
      }),
    });

    // Add to audience
    if (AUDIENCE_ID) {
      await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, unsubscribed: false }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error("[tool-results] email error:", e);
    return NextResponse.json({ error: "Email send failed" }, { status: 500, headers: cors });
  }

  return NextResponse.json({ ok: true }, { headers: cors });
}
