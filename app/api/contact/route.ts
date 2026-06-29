import { NextResponse } from "next/server";

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const TO_EMAIL   = "keith@irishpeptides.ie";
const FROM_EMAIL = "noreply@irishpeptides.ie";

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

  const { name, email, message } = body as { name?: string; email?: string; message?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400, headers: cors });
  }
  if (!message || (message as string).trim().length < 5) {
    return NextResponse.json({ error: "Message required" }, { status: 400, headers: cors });
  }

  if (RESEND_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: TO_EMAIL,
          reply_to: email,
          subject: `Contact form — ${name || email}`,
          text: `From: ${name || "Unknown"} <${email}>\n\n${message}`,
          html: `<p><strong>From:</strong> ${name || "Unknown"} &lt;${email}&gt;</p><p><strong>Message:</strong></p><p>${(message as string).replace(/\n/g, "<br>")}</p>`,
        }),
      });
    } catch (err) {
      console.error("[contact] Resend error:", err);
      return NextResponse.json({ error: "Failed to send" }, { status: 500, headers: cors });
    }
  } else {
    console.warn("[contact] RESEND_API_KEY not set — message not delivered");
  }

  console.log(`[contact] message from ${email}`);
  return NextResponse.json({ ok: true }, { headers: cors });
}
