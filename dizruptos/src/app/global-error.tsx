"use client";

// Next.js global error boundary — catches errors that escape the root layout,
// including errors thrown during layout rendering itself. This is the last line
// of defense; it replaces the entire HTML document so it cannot use layout.tsx
// components. Replicate the Nexus brand minimal shell inline.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send to Sentry if available
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong — DIZRUPT</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #0A0A0A;
            color: #e8e8e8;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .card {
            max-width: 440px;
            width: 100%;
            padding: 40px;
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 16px;
            background: rgba(15,15,15,0.85);
          }
          .icon { font-size: 2rem; margin-bottom: 20px; }
          h1 { font-size: 1.4rem; font-weight: 600; margin-bottom: 8px; }
          p { font-size: 0.875rem; color: #888; line-height: 1.6; margin-bottom: 24px; }
          .digest { font-family: monospace; font-size: 0.75rem; color: #555;
                    background: rgba(255,255,255,0.05); border-radius: 6px;
                    padding: 6px 10px; margin-bottom: 24px; word-break: break-all; }
          button {
            background: #F97316; border: none; color: #fff;
            font-size: 0.875rem; font-weight: 600; padding: 10px 24px;
            border-radius: 8px; cursor: pointer; transition: filter 0.15s;
          }
          button:hover { filter: brightness(1.12); }
        `}</style>
      </head>
      <body>
        <div className="card" role="alert" aria-live="assertive">
          <div className="icon">⚠️</div>
          <h1>Something went wrong</h1>
          <p>
            DizruptOS hit an unexpected error. Your session and data are safe.
            Refreshing usually fixes it — if it keeps happening, please contact support.
          </p>
          {error.digest && (
            <div className="digest">Error ID: {error.digest}</div>
          )}
          <button onClick={reset} type="button">Reload</button>
        </div>
      </body>
    </html>
  );
}
