// HARD-SCOPE-BOUNDARY: API keys in localStorage; see architecture.md § Authentication & Security
import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Day14Gate } from "@/app/_internal/Day14Gate";
import { AppSidebar, MobileAppNav } from "@/components/audiblytics/AppSidebar";
import { AppColumn, MainArea } from "@/components/audiblytics/MainArea";
import { HonestyFooter } from "@/components/audiblytics/HonestyFooter";
import { RetentionPruneOnMount } from "@/components/audiblytics/RetentionPruneOnMount";
import { AppShell } from "@/components/audiblytics/AppShell";
import { StatStreakSurfaceProvider } from "@/features/calendar/stat-streak-surface-context";
import { AppProviders } from "@/app/providers";
import { AppGate } from "@/components/audiblytics/AppGate";
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
      className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable} h-dvh antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden bg-surface text-foreground">
        <AppProviders>
          <Day14Gate>
            <div className="flex h-dvh min-h-0 min-w-0 overflow-hidden">
              <AppSidebar />
              <AppColumn>
                <MobileAppNav />
                <StatStreakSurfaceProvider>
                  <MainArea>
                    <AppShell>
                      <RetentionPruneOnMount />
                      <AppGate>{children}</AppGate>
                    </AppShell>
                  </MainArea>
                </StatStreakSurfaceProvider>
                <HonestyFooter />
              </AppColumn>
            </div>
          </Day14Gate>
        </AppProviders>
      </body>
    </html>
  );
}
