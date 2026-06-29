import { NextResponse } from "next/server";

const RESEND_KEY  = process.env.RESEND_API_KEY || "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "fe3ebf86-af78-485c-bfe8-96151603d89e";

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

  const { email, name, interest } = body as { email?: string; name?: string; interest?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400, headers: cors });
  }

  if (RESEND_KEY && AUDIENCE_ID) {
    try {
      await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, first_name: name || "", unsubscribed: false }),
      });
    } catch { /* silent */ }
  }

  console.log(`[subscribe] ${email} interest=${interest || "unknown"}`);
  return NextResponse.json({ ok: true }, { headers: cors });
}
