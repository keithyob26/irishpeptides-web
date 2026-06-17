"use client";
export default function ManualStepsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <p style={{ color: "#EF4444", marginBottom: "16px" }}>Manual Steps failed to load.</p>
      <button onClick={reset} style={{ background: "#14B8A6", color: "#0A0F1E", padding: "8px 18px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 700 }}>
        Retry
      </button>
    </div>
  );
}
