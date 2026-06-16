import { NextRequest, NextResponse } from "next/server";

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const AUDIENCE_ID = "fe3ebf86-af78-485c-bfe8-96151603d89e";

export async function POST(req: NextRequest) {
  try {
    const { name, email, interest } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const r = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, first_name: name || "", unsubscribed: false }),
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}