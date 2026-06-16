"use client";

import { useState, useRef } from "react";

export default function UploadPage() {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ product_name?: string; protein?: string; message?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setStatus("uploading");
    setResult(null);
    const form = new FormData();
    form.append("photo", file);
    try {
      const res = await fetch("/api/upload-product", { method: "POST", body: form });
      const json = await res.json();
      if (res.ok) {
        setStatus("done");
        setResult(json);
      } else {
        setStatus("error");
        setResult({ message: json.error || "Upload failed" });
      }
    } catch {
      setStatus("error");
      setResult({ message: "Network error — try again" });
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0F172A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "#1E293B",
          borderRadius: "16px",
          padding: "40px 32px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          border: "1px solid #334155",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📸</div>
        <h1 style={{ color: "#14B8A6", fontSize: "24px", fontWeight: 700, margin: "0 0 8px" }}>
          Product Photo Upload
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 32px" }}>
          Take a photo of any supermarket product. Jarvis reads the label and generates a social post automatically.
        </p>

        {status === "idle" && (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              style={{
                background: "#14B8A6",
                color: "#0F172A",
                border: "none",
                borderRadius: "12px",
                padding: "18px 32px",
                fontSize: "18px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
                marginBottom: "12px",
              }}
            >
              Upload Product Photo
            </button>
            <p style={{ color: "#64748B", fontSize: "12px" }}>
              JPG, PNG or HEIC · max 10MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
          </>
        )}

        {status === "uploading" && (
          <div style={{ color: "#14B8A6", fontSize: "16px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            Reading label with Gemini Vision...
            <br />
            <span style={{ color: "#64748B", fontSize: "13px" }}>
              Generating social post...
            </span>
          </div>
        )}

        {status === "done" && result && (
          <div>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
            <p style={{ color: "#10B981", fontWeight: 700, margin: "0 0 8px" }}>
              {result.product_name || "Product processed!"}
            </p>
            {result.protein && (
              <p style={{ color: "#94A3B8", fontSize: "14px", margin: "0 0 16px" }}>
                Protein: {result.protein}g per 100g
              </p>
            )}
            <p style={{ color: "#64748B", fontSize: "13px", margin: "0 0 24px" }}>
              Social post ready in Content Studio for approval.
              <br />
              WhatsApp notification sent.
            </p>
            <button
              onClick={() => { setStatus("idle"); setResult(null); }}
              style={{
                background: "transparent",
                color: "#14B8A6",
                border: "1px solid #14B8A6",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Upload Another
            </button>
          </div>
        )}

        {status === "error" && (
          <div>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>❌</div>
            <p style={{ color: "#F87171", margin: "0 0 16px" }}>
              {result?.message || "Something went wrong"}
            </p>
            <button
              onClick={() => { setStatus("idle"); setResult(null); }}
              style={{
                background: "#14B8A6",
                color: "#0F172A",
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <p style={{ color: "#334155", fontSize: "11px", marginTop: "24px" }}>
        Irish Peptides & Nutrition — Bookmark this page on your phone
      </p>
    </main>
  );
}
