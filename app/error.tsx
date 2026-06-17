"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[Dashboard error]", error);
  }, [error]);

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ textAlign: "center", maxWidth: "440px" }}>
        <div style={{ fontSize: "36px", marginBottom: "14px" }}>⚠</div>
        <h2 style={{ color: "#E2E8F0", fontSize: "18px", fontWeight: 700, margin: "0 0 8px" }}>
          Page error
        </h2>
        <p style={{ color: "#64748B", fontSize: "13px", margin: "0 0 20px", lineHeight: "1.6" }}>
          {error?.message || "This page hit an error. Try refreshing or go back to home."}
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{ background: "#14B8A6", color: "#0A0F1E", fontWeight: 700, fontSize: "13px", padding: "9px 18px", borderRadius: "7px", border: "none", cursor: "pointer" }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            style={{ background: "transparent", color: "#94A3B8", fontSize: "13px", padding: "9px 18px", borderRadius: "7px", border: "1px solid #334155", cursor: "pointer" }}
          >
            Go home
          </button>
        </div>
        {error?.digest && (
          <p style={{ color: "#1E293B", fontSize: "11px", marginTop: "20px", fontFamily: "monospace" }}>
            {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
