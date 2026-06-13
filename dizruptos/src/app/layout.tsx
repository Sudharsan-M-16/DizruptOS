import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Sora, Newsreader } from "next/font/google";
import { FxProvider } from "@/components/fx/fx-provider";
import { Providers } from "@/components/providers";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
});

// Newsreader — the Nexus display serif, reserved for the login gateway.
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "DIZRUPT — Resource Intelligence Platform",
  description:
    "The operating system for your organization: capacity, execution, memory, and strategy in one command center.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme resolution: runs before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem("dizrupt-session")||"{}");var t=(s.state&&s.state.theme)||"dark";if(t==="system"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})();`,
          }}
        />
      </head>
      <body
        className={`${plex.variable} ${plexMono.variable} ${sora.variable} ${newsreader.variable} font-sans`}
      >
        <FxProvider />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
