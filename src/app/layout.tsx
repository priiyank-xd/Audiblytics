// HARD-SCOPE-BOUNDARY: API keys in localStorage; see architecture.md § Authentication & Security
import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Day14Gate } from "@/app/_internal/Day14Gate";
import { AppSidebar } from "@/components/audiblytics/AppSidebar";
import { HonestyFooter } from "@/components/audiblytics/HonestyFooter";
import { RetentionPruneOnMount } from "@/components/audiblytics/RetentionPruneOnMount";
import { AppShell } from "@/components/audiblytics/AppShell";
import { TopNav } from "@/components/audiblytics/TopNav";
import { StatStreakSurfaceProvider } from "@/features/calendar/stat-streak-surface-context";
import "./globals.css";

/* Latin-only woff2 from Google Fonts gstatic (`src/fonts/*.woff2`). Matches
   `ux-design-specification.md` (self-host, ≤250KB); `next/font/local` keeps zero runtime
   third-party font requests (AR21 / NFR16). */
const fontSerif = localFont({
  src: "../fonts/eb-garamond-latin-400.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-serif",
});

const fontSans = localFont({
  src: "../fonts/inter-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
});

const fontMono = localFont({
  src: "../fonts/jetbrains-mono-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Audiblytics",
  description: "Personal voice-journal and paragraph companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-surface text-foreground">
        <Day14Gate>
          <div className="flex min-h-screen min-w-0">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopNav />
              <StatStreakSurfaceProvider>
                <main className="min-w-0 flex-1 px-5 pb-12 pt-8 md:px-8 lg:px-14 lg:pb-16">
                  <AppShell>
                    <RetentionPruneOnMount />
                    {children}
                  </AppShell>
                </main>
              </StatStreakSurfaceProvider>
              <HonestyFooter />
            </div>
          </div>
        </Day14Gate>
      </body>
    </html>
  );
}
