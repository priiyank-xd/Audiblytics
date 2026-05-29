'use client';

import { notFound } from "next/navigation";
import { DayRail } from "@/components/audiblytics/DayRail";
import { HonestyFooter } from "@/components/audiblytics/HonestyFooter";
import { OfflineBadge } from "@/components/audiblytics/OfflineBadge";
import { StatRail } from "@/components/audiblytics/StatRail";
import { StatRailCalendar } from "@/components/audiblytics/StatRailCalendar";
import { StatRailCards } from "@/components/audiblytics/StatRailCards";
import { TopNav } from "@/components/audiblytics/TopNav";

export default function DevComponentsPage() {
  if (process.env.NEXT_PUBLIC_DEV_GALLERY !== "true") {
    notFound();
  }

  return (
    <article className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-headline-2">Dev Component Gallery</h1>
        <p className="text-caption text-tertiary">
          Visual QA surface for shell components. Gated by NEXT_PUBLIC_DEV_GALLERY=true.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-headline-3">TopNav</h2>
        <p className="text-caption text-tertiary">
          Home and Settings only; active link gets forest underline + bolder weight.
        </p>
        <div className="rounded-sm border border-divider">
          <TopNav />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-headline-3">OfflineBadge</h2>
        <p className="text-caption text-tertiary">
          8×8px pack glyph with tooltip — used on completed-offline day cells.
        </p>
        <div className="flex items-center gap-4 rounded-sm border border-divider p-4">
          <OfflineBadge />
          <span className="text-caption text-secondary">Hover for tooltip</span>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-headline-3">DayRail</h2>
        <p className="text-caption text-tertiary">
          30 cells, all in the &quot;future&quot; state for this story.
        </p>
        <div className="rounded-sm border border-divider">
          <DayRail />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-headline-3">StatRail</h2>
        <p className="text-caption text-tertiary">
          Production rail: streak, words, recordings, day of 30.
        </p>
        <div className="rounded-sm border border-divider lg:max-w-xs">
          <StatRail>
            <StatRailCalendar />
            <StatRailCards />
          </StatRail>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-headline-3">HonestyFooter</h2>
        <p className="text-caption text-tertiary">
          Mono ink-faint footer. ProviderChip is inlined for now.
        </p>
        <div className="rounded-sm border border-divider">
          <HonestyFooter />
        </div>
      </section>
    </article>
  );
}
