import { NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export async function GET() {
  if (!RESEND_API_KEY) {
    return NextResponse.json({ contacts: [], total: 0, error: "RESEND_API_KEY not set" });
  }

  try {
    // Get all audiences first
    const audRes = await fetch("https://api.resend.com/audiences", {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      next: { revalidate: 300 },
    });

    if (!audRes.ok) {
      return NextResponse.json({ contacts: [], total: 0, error: "Resend API error" });
    }

    const audData = await audRes.json();
    const audiences = audData.data || [];

    if (audiences.length === 0) {
      return NextResponse.json({ contacts: [], total: 0, audiences: [] });
    }

    // Get contacts for first audience (primary list)
    const primaryAudience = audiences[0];
    const contactsRes = await fetch(
      `https://api.resend.com/audiences/${primaryAudience.id}/contacts`,
      {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
        next: { revalidate: 300 },
      }
    );

    const contactsData = await contactsRes.json();
    const contacts = (contactsData.data || []).map((c: Record<string, unknown>) => ({
      id: c.id,
      email: c.email,
      first_name: c.first_name,
      last_name: c.last_name,
      unsubscribed: c.unsubscribed,
      created_at: c.created_at,
    }));

    return NextResponse.json({
      contacts,
      total: contacts.length,
      audiences,
      audienceName: primaryAudience.name,
    });
  } catch (e) {
    return NextResponse.json({ contacts: [], total: 0, error: String(e) });
  }
}
