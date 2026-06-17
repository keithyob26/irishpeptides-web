import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID     = process.env.BUFFER_CLIENT_ID     || "m5KzaZlPR9h0QsR1CdZvy12ley9z-shbgcZMI7BzISz";
const CLIENT_SECRET = process.env.BUFFER_CLIENT_SECRET || "RX-2kalxnsJMRhqugf2hHgJf1XxiIt64W5Sdlp2HLlxIuhBx1tJ1HKiOsm7sHBQqI_44f-EykcDP91QC3zs-8A";
const REDIRECT_URI  = "https://irishpeptides-web.vercel.app/api/buffer-callback";

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:40px;background:#0f172a;color:#ef4444">
      <h2>Buffer Auth Error</h2><p>${error}</p></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }

  if (!code) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:40px;background:#0f172a;color:#f59e0b">
      <h2>No code in callback</h2></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }

  const body = new URLSearchParams({
    grant_type:    "authorization_code",
    code,
    redirect_uri:  REDIRECT_URI,
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const tokenRes = await fetch("https://login.buffer.com/oauth2/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    body.toString(),
  });

  const data = await tokenRes.json();

  if (!tokenRes.ok || !data.access_token) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:40px;background:#0f172a;color:#ef4444">
      <h2>Token exchange failed (${tokenRes.status})</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </body></html>`, { headers: { "Content-Type": "text/html" } });
  }

  const token = data.access_token;

  return new NextResponse(`<!DOCTYPE html>
<html><head><title>Buffer Auth Complete</title></head>
<body style="font-family:system-ui;padding:40px;background:#0f172a;color:#e2e8f0;max-width:700px;margin:0 auto">
  <h2 style="color:#14b8a6">Buffer Auth Complete</h2>
  <p>Copy the token below and add it to GitHub Secrets as <strong>BUFFER_ACCESS_TOKEN</strong>.</p>
  <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:16px;margin:16px 0;word-break:break-all;font-family:monospace;font-size:13px;color:#f1f5f9">
    ${token}
  </div>
  <button onclick="navigator.clipboard.writeText('${token}');this.textContent='Copied!'"
    style="background:#14b8a6;color:#0a0f1e;font-weight:700;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;font-size:14px">
    Copy Token
  </button>
  <hr style="border-color:#1e293b;margin:24px 0"/>
  <p style="color:#64748b;font-size:13px">Add to GitHub: <a href="https://github.com/keithyob26/irishpeptides-jarvis/settings/secrets/actions" style="color:#14b8a6">Repo Secrets</a></p>
  <p style="color:#64748b;font-size:13px">Expires: ${data.expires_in ? Math.round(data.expires_in/86400) + " days" : "long-lived"}</p>
</body></html>`, { headers: { "Content-Type": "text/html" } });
}
