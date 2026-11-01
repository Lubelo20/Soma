"use client";

// Last-resort page if the site's root layout itself fails. It replaces the whole document, so it carries
// its own <html> and plain styles.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-ZA">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f6f3ec", color: "#1f2a22" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px" }}>
          <h1 style={{ fontWeight: 400, fontSize: 36, margin: "0 0 16px" }}>Something went wrong</h1>
          <p style={{ lineHeight: 1.7, margin: "0 0 24px" }}>
            Infinity Soma Wellness Clinic&rsquo;s website couldn&rsquo;t load. Please try again, or WhatsApp us on +27 63 880 4946.
          </p>
          <button type="button" onClick={() => retry()} style={{ padding: "14px 28px", background: "#147c10", color: "#fff", border: 0, cursor: "pointer" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
