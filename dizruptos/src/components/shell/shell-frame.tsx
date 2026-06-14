"use client";

// Pathname-aware shell chrome. Three modes:
//  • "/"            → the macOS-style desktop owns the full viewport (no chrome).
//  • "?embed=1"     → the route is being shown INSIDE a DizruptOS window (iframe).
//                      Drop the sidebar/topbar so the page reads as a native app;
//                      keep the content + overlays.
//  • everything else→ the standard Sidebar + Topbar product shell.
// Overlays (palette, drawers, guardrail) stay mounted everywhere.

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";

function ShellFrameInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const isDesktop = pathname === "/";

  // A route is "embedded" (chromeless) when ?embed=1 OR when it's running inside
  // the desktop's iframe. The iframe check makes embed *sticky*: once a page
  // opens as a DizruptOS window, every link you click inside it stays chromeless
  // instead of reloading the old sidebar dashboard.
  const embedParam = params.get("embed") === "1";
  const [isEmbed, setIsEmbed] = useState(embedParam);
  useEffect(() => {
    if (embedParam || (typeof window !== "undefined" && window.self !== window.top)) setIsEmbed(true);
  }, [embedParam]);

  if (isDesktop) {
    // The dashboard owns the full viewport — no global chrome.
    return <div className="relative z-10 h-screen overflow-hidden">{children}</div>;
  }

  if (isEmbed) {
    // Embedded as a desktop window — chromeless, scrolls inside the window.
    return (
      <div className="relative z-10 min-h-screen bg-ink">
        <main className="mx-auto max-w-[1520px] px-5 py-6 lg:px-7">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar />
      <div className="pl-[256px]">
        <Topbar />
        <main className="mx-auto max-w-[1520px] px-6 py-7 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}

export function ShellFrame({ children }: { children: React.ReactNode }) {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="relative z-10 min-h-screen bg-ink" />}>
      <ShellFrameInner>{children}</ShellFrameInner>
    </Suspense>
  );
}
