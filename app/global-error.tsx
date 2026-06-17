"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body style={{ margin: 0, background: "#0F172A", fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: "480px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠</div>
          <h1 style={{ color: "#E2E8F0", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Dashboard error</h1>
          <p style={{ color: "#64748B", fontSize: "14px", margin: "0 0 4px" }}>
            {error?.message || "Something went wrong loading the dashboard."}
          </p>
          {error?.digest && (
            <p style={{ color: "#334155", fontSize: "12px", margin: "0 0 24px", fontFamily: "monospace" }}>
              ref: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{ background: "#14B8A6", color: "#0A0F1E", fontWeight: 700, fontSize: "14px", padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer" }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = "/"}
              style={{ background: "transparent", color: "#14B8A6", fontWeight: 600, fontSize: "14px", padding: "10px 20px", borderRadius: "8px", border: "1px solid #14B8A640", cursor: "pointer" }}
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
