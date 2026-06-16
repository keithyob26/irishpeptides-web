import { NextRequest, NextResponse } from "next/server";

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const AUDIENCE_ID = "fe3ebf86-af78-485c-bfe8-96151603d89e";

export async function POST(req: NextRequest) {
  try {
    const { email, name, calories, preference, training_days, goal } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Add to Resend audience
    await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, first_name: name || "", unsubscribed: false }),
    });

    const calLabel = calories ? `${calories} calories/day` : "calories TBC";
    const greeting = name ? `Hi ${name},` : "Hi there,";

    // Send confirmation email
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Irish Peptides <noreply@irishpeptides.ie>",
        to: [email],
        subject: "Your Personalised Nutrition Plan — Irish Peptides",
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Your Nutrition Plan</title></head><body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e8eaf0;"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 24px;"><tr><td><div style="background:#141720;border:1px solid #2a2f42;border-radius:12px;padding:40px;"><p style="color:#4f8ef7;font-size:0.8rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:16px;">Irish Peptides &amp; Nutrition</p><h1 style="font-size:1.6rem;font-weight:800;margin:0 0 20px;line-height:1.3;">Your nutrition plan is being prepared!</h1><p style="color:#8892a4;margin-bottom:16px;">${greeting}</p><p style="color:#8892a4;margin-bottom:24px;">We have received your details. Your personalised <strong style="color:#e8eaf0;">7-day meal plan</strong> is being prepared and will be sent within 24 hours.</p><table style="background:#1c2030;border-radius:8px;padding:20px;width:100%;border-collapse:collapse;margin-bottom:24px;"><tr><td style="color:#8892a4;font-size:0.85rem;padding:4px 0;">Goal</td><td style="color:#e8eaf0;font-weight:600;text-align:right;">${goal || "N/A"}</td></tr><tr><td style="color:#8892a4;font-size:0.85rem;padding:4px 0;">Preference</td><td style="color:#e8eaf0;font-weight:600;text-align:right;">${preference || "N/A"}</td></tr><tr><td style="color:#8892a4;font-size:0.85rem;padding:4px 0;">Training days</td><td style="color:#e8eaf0;font-weight:600;text-align:right;">${training_days || "N/A"} days/week</td></tr><tr><td style="color:#8892a4;font-size:0.85rem;padding:4px 0;">Calories</td><td style="color:#e8eaf0;font-weight:600;text-align:right;">${calLabel}</td></tr></table><p style="color:#8892a4;margin-bottom:8px;">Questions? Reply to this email or contact <a href="mailto:keith@irishpeptides.ie" style="color:#4f8ef7;">keith@irishpeptides.ie</a></p><p style="color:#3d4558;font-size:0.8rem;margin-top:24px;">&copy; 2026 Irish Peptides &amp; Nutrition Ltd.</p></div></td></tr></table></body></html>`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}