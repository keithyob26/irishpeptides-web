import { NextResponse } from "next/server";

const GEMINI_KEY  = process.env.GEMINI_API_KEY  || "";
const RESEND_KEY  = process.env.RESEND_API_KEY   || "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "fe3ebf86-af78-485c-bfe8-96151603d89e";
const FROM        = "Irish Peptides <onboarding@resend.dev>";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  const cors = { "Access-Control-Allow-Origin": "*" };

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors }); }

  const { email, name, calories, preference, training_days, goal } = body as {
    email: string; name?: string; calories?: number;
    preference: string; training_days: string; goal: string;
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400, headers: cors });
  }

  const displayName = name || "there";
  const kcal = calories ? `${calories} kcal/day` : "maintenance calories";
  const days  = training_days ? `${training_days} days/week` : "3 days/week";

  // ── Gemini meal plan generation ─────────────────────────────────────────
  let mealPlan = "";
  if (GEMINI_KEY) {
    const prompt = `You are a nutrition coach specialising in Irish fitness culture. Generate a personalised 7-day meal plan.

User details:
- Name: ${displayName}
- Daily calories: ${kcal}
- Dietary preference: ${preference}
- Training frequency: ${days}
- Primary goal: ${goal}

Rules:
- Use realistic Irish supermarket foods (Lidl, Aldi, Tesco, Dunnes)
- High protein emphasis (aim 1.6-2g protein per kg bodyweight)
- Simple meals that take under 30 minutes
- Include breakfast, lunch, dinner, one snack per day
- Show approximate calories and protein for each day total
- Irish-friendly portions and measurements
- Add one practical tip per day
- End with a note: "This plan is for educational purposes. Adjust based on your preferences and consult a dietitian for medical advice."

Format as clean HTML with <h3> day headings, <ul> meal lists, <strong> for meal names. Keep it readable in an email.`;

    try {
      const gr = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const gd = await gr.json();
      mealPlan = gd?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch { mealPlan = ""; }
  }

  // Fallback if Gemini fails
  if (!mealPlan) {
    mealPlan = `<p>Your personalised plan for <strong>${goal}</strong> on <strong>${kcal}</strong> is being prepared.
    Focus on: high protein (chicken, eggs, Greek yogurt, cottage cheese), complex carbs (oats, rice, sweet potato),
    and plenty of vegetables from your local Lidl or Aldi. Training ${days}.</p>
    <p>For a detailed breakdown, reply to this email and Keith will send you a custom plan within 24 hours.</p>`;
  }

  // ── Email HTML ──────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="color:#14B8A6;font-size:20px;font-weight:700;margin-bottom:4px;">Irish Peptides & Nutrition</div>
  <div style="color:#475569;font-size:13px;margin-bottom:28px;">irishpeptides.ie</div>

  <h1 style="color:#E2E8F0;font-size:22px;margin:0 0 8px;">Your 7-Day Personalised Plan</h1>
  <p style="color:#94A3B8;margin:0 0 24px;font-size:14px;">
    Hi ${displayName}, here's your personalised nutrition plan based on your details:<br>
    <strong style="color:#E2E8F0;">Goal:</strong> ${goal} ·
    <strong style="color:#E2E8F0;">Calories:</strong> ${kcal} ·
    <strong style="color:#E2E8F0;">Diet:</strong> ${preference} ·
    <strong style="color:#E2E8F0;">Training:</strong> ${days}
  </p>

  <div style="background:#111827;border-radius:12px;padding:24px;color:#CBD5E1;font-size:14px;line-height:1.7;margin-bottom:24px;">
    ${mealPlan}
  </div>

  <div style="background:#0D1F1E;border:1px solid #14B8A630;border-radius:10px;padding:20px;margin-bottom:24px;">
    <p style="color:#14B8A6;font-weight:700;margin:0 0 8px;font-size:14px;">Free Tools at irishpeptides.ie</p>
    <p style="color:#94A3B8;margin:0 0 12px;font-size:13px;">Use these to fine-tune your plan:</p>
    <a href="https://irishpeptides.ie/free-tools" style="display:inline-block;background:#14B8A6;color:#0A0F1E;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;">
      Open Free Tools →
    </a>
  </div>

  <p style="color:#475569;font-size:12px;margin:0;">
    You're receiving this because you requested a nutrition plan at irishpeptides.ie.<br>
    Questions? Reply to this email.<br>
    <a href="https://irishpeptides.ie" style="color:#14B8A6;">irishpeptides.ie</a>
  </p>
</div>
</body>
</html>`;

  // ── Send email via Resend ────────────────────────────────────────────────
  if (RESEND_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject: `Your 7-Day ${goal} Plan — Irish Peptides`,
          html,
        }),
      });

      // NOTE: audience contact addition removed — Resend automation was sending
      // a broken "Your Download" template email. Re-enable after fixing in Resend dashboard.
    } catch (e) {
      console.error("Resend error:", e);
      return NextResponse.json({ error: "Email send failed" }, { status: 500, headers: cors });
    }
  }

  return NextResponse.json({ ok: true }, { headers: cors });
}
