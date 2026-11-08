"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F7F6F1", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div role="alert" style={{ maxWidth: 480, background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", border: "1px solid #DCE5E1" }}>
          <h1 style={{ fontSize: 20, color: "#122C38", margin: 0 }}>MORIVA couldn't load</h1>
          <p style={{ color: "#53666D", fontSize: 14 }}>
            Your saved information has not been changed. If you need urgent help, call 999 (Abu Dhabi) or your local
            emergency number.
          </p>
          <button onClick={reset} style={{ minHeight: 44, padding: "8px 16px", borderRadius: 8, border: "none", background: "#197F7B", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
