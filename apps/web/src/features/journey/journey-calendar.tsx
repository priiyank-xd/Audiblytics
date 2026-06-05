'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback } from 'react';

import { CalendarDayCell } from '@/components/audiblytics/CalendarDayCell';
import type { MonthCalendarSlot } from '@/features/calendar/use-month-calendar-cells';

export type JourneyCalendarProps = {
  anchorMonth: Date;
  onAnchorMonthChange: (next: Date) => void;
  monthLabel: string;
  weekdayLabels: readonly string[];
  slots: MonthCalendarSlot[];
  isReady: boolean;
  selectedUtcDate: string | null;
  onSelectUtcDate: (utcDate: string) => void;
};

function shiftUtcMonth(anchor: Date, deltaMonths: number): Date {
  return new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + deltaMonths, 1));
}

export function JourneyCalendar({
  anchorMonth,
  onAnchorMonthChange,
  monthLabel,
  weekdayLabels,
  slots,
  isReady,
  selectedUtcDate,
  onSelectUtcDate,
}: JourneyCalendarProps) {
  const goPrev = useCallback(() => {
    onAnchorMonthChange(shiftUtcMonth(anchorMonth, -1));
  }, [anchorMonth, onAnchorMonthChange]);

  const goNext = useCallback(() => {
    onAnchorMonthChange(shiftUtcMonth(anchorMonth, 1));
  }, [anchorMonth, onAnchorMonthChange]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-headline-3 text-foreground">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={goPrev}
            className="inline-flex rounded-sm p-2 text-secondary hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <ChevronLeft className="size-4" strokeWidth={1.7} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={goNext}
            className="inline-flex rounded-sm p-2 text-secondary hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <ChevronRight className="size-4" strokeWidth={1.7} />
          </button>
        </div>
      </div>

      {!isReady ? (
        <div
          className="grid grid-cols-7 gap-2"
          aria-busy="true"
          aria-label="Loading calendar"
        >
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="h-10 rounded-sm bg-cream-dim" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 text-center text-caption text-secondary">
            {weekdayLabels.map((label) => (
              <span key={label} className="py-1">
                {label}
              </span>
            ))}
          </div>
          <ul
            role="list"
            aria-label={`Calendar for ${monthLabel}`}
            className="grid grid-cols-7 gap-1"
          >
            {slots.map((slot, index) => {
              if (slot.kind === 'pad') {
                return <li key={`pad-${index}`} aria-hidden className="min-h-10" />;
              }

              return (
                <li key={slot.utcDate} className="min-w-0">
                  <CalendarDayCell
                    utcDate={slot.utcDate}
                    complete={slot.complete}
                    usedOfflinePack={slot.usedOfflinePack}
                    labelStyle="day-only"
                    isSelected={selectedUtcDate === slot.utcDate}
                    onSelectComplete={
                      slot.complete ? () => onSelectUtcDate(slot.utcDate) : undefined
                    }
                  />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
