'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useMonthCalendarCells } from '@/features/calendar/use-month-calendar-cells';
import { formatUtcDate } from '@/lib/day-counter/format-utc-date';
import { cn } from '@/lib/utils';

const WEEKDAY_SHORT = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

type RailDayProps = {
  day: number;
  complete: boolean;
  isToday: boolean;
  onSelectComplete?: () => void;
};

function RailDay({ day, complete, isToday, onSelectComplete }: RailDayProps) {
  const className = cn(
    'flex min-h-8 min-w-0 items-center justify-center rounded-md text-caption tabular-nums',
    isToday && 'bg-primary font-medium text-on-primary shadow-sm',
    !isToday && complete && 'font-medium text-foreground',
    !isToday && !complete && 'text-tertiary',
  );

  if (complete && onSelectComplete) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectComplete();
        }}
        className={cn(
          className,
          'w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1',
        )}
        aria-label={`Day ${day}, completed. Open archived day.`}
      >
        {day}
      </button>
    );
  }

  return (
    <span className={className} aria-label={`Day ${day}${isToday ? ', today' : ''}`}>
      {day}
    </span>
  );
}

/** Editorial month grid for the statistics rail (UTC month, app tokens). */
export function StatRailCalendar() {
  const router = useRouter();
  const { monthLabel, slots, isReady } = useMonthCalendarCells();
  const todayUtc = formatUtcDate(new Date());

  const { monthName, todayWeekdayIndex } = useMemo(() => {
    const anchor = new Date();
    const monthName = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(anchor);
    const todayWeekdayIndex = (anchor.getUTCDay() + 6) % 7;
    return { monthName, todayWeekdayIndex };
  }, []);

  const openCalendar = useCallback(() => {
    router.push('/calendar', { scroll: false });
  }, [router]);

  const openArchivedDay = useCallback(
    (utcDate: string) => {
      router.push(`/calendar?day=${encodeURIComponent(utcDate)}`, { scroll: false });
    },
    [router],
  );

  return (
    <section
      aria-label={`Calendar for ${monthLabel}. Open full calendar.`}
      className="min-w-0 cursor-pointer outline-none"
      role="button"
      tabIndex={0}
      onClick={openCalendar}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCalendar();
        }
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-headline-3 text-foreground">{monthName}</h2>
        <div className="flex items-center gap-5 text-tertiary" aria-hidden="true">
          <ChevronLeft className="size-5" strokeWidth={1.5} />
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </div>
      </div>
      <p className="sr-only">{monthLabel}</p>

      <div className="mt-5 grid grid-cols-7 gap-y-1 text-center" role="presentation">
        {WEEKDAY_SHORT.map((label) => (
          <span key={label} className="pb-2 text-micro-label text-secondary">
            {label}
          </span>
        ))}
      </div>

      {!isReady ? (
        <div
          className="grid min-h-36 grid-cols-7 gap-y-2 bg-cream-dim"
          aria-busy="true"
          aria-label="Loading calendar"
        />
      ) : (
        <ul
          role="list"
          aria-label={`Month calendar for ${monthLabel}`}
          className="grid grid-cols-7 gap-y-1"
        >
          {slots.map((slot, idx) => {
            if (slot.kind === 'pad') {
              return <li key={`pad-${idx}`} aria-hidden className="min-h-8" />;
            }
            const day = Number(slot.utcDate.split('-')[2]);
            return (
              <li key={slot.utcDate} className="min-w-0">
                <RailDay
                  day={day}
                  complete={slot.complete}
                  isToday={slot.utcDate === todayUtc}
                  onSelectComplete={
                    slot.complete ? () => openArchivedDay(slot.utcDate) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8">
        <h2 className="text-headline-3 text-foreground">This week</h2>
        <div className="mt-4 grid grid-cols-7 text-center">
          {WEEK_DAYS.map((label, index) => (
            <div key={`${label}-${index}`} className="space-y-2">
              <span className="block text-ui-sm text-foreground">{label}</span>
              <span
                className={cn(
                  'mx-auto block size-4 rounded-full border border-divider',
                  index === todayWeekdayIndex && 'border-primary bg-primary',
                )}
                aria-hidden="true"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
