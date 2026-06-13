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
  showTodayDot?: boolean;
  compact?: boolean;
  homeFlat?: boolean;
  onSelectComplete?: () => void;
};

function RailDay({
  day,
  complete,
  isToday,
  showTodayDot,
  compact,
  homeFlat,
  onSelectComplete,
}: RailDayProps) {
  if (homeFlat) {
    const dayClassName = cn(
      'flex aspect-square w-full items-center justify-center rounded-lg font-mono text-caption tabular-nums',
      isToday && 'relative bg-primary text-on-primary',
      !isToday && complete && 'font-medium text-foreground',
      !isToday && !complete && 'text-home-ink-muted',
    );

    const dayContent = (
      <>
        {isToday && showTodayDot ? (
          <span
            className="absolute top-1.5 size-0.5 rounded-full bg-on-primary"
            aria-hidden="true"
          />
        ) : null}
        {day}
      </>
    );

    if (complete && onSelectComplete) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectComplete();
          }}
          className={cn(dayClassName, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1')}
          aria-label={`Day ${day}, completed. Open archived day.`}
        >
          {dayContent}
        </button>
      );
    }

    return (
      <span className={dayClassName} aria-label={`Day ${day}${isToday ? ', today' : ''}`}>
        {dayContent}
      </span>
    );
  }

  const dayClassName = cn(
    'flex items-center justify-center rounded-full tabular-nums',
    compact ? 'min-h-7 min-w-7 text-caption' : 'min-h-8 min-w-8 text-caption',
    isToday && 'bg-primary font-medium text-on-primary shadow-sm',
    !isToday && complete && 'font-medium text-foreground',
    !isToday && !complete && 'text-tertiary',
  );

  const dayContent =
    isToday && showTodayDot ? (
      <span className="flex flex-col items-center gap-1">
        <span className={dayClassName}>{day}</span>
        <span className="size-1 rounded-full bg-primary" aria-hidden="true" />
      </span>
    ) : (
      <span className={dayClassName}>{day}</span>
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
          'flex w-full flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1',
          isToday && showTodayDot && 'gap-1',
        )}
        aria-label={`Day ${day}, completed. Open archived day.`}
      >
        {dayContent}
      </button>
    );
  }

  return (
    <span
      className={cn('flex flex-col items-center', isToday && showTodayDot && 'gap-1')}
      aria-label={`Day ${day}${isToday ? ', today' : ''}`}
    >
      {dayContent}
    </span>
  );
}

export type StatRailCalendarProps = {
  className?: string;
  showWeekSummary?: boolean;
  showTodayDot?: boolean;
  compact?: boolean;
  /** Home rail: flat section matching Emergent HTML. */
  homeFlat?: boolean;
};

/** Editorial month grid for the statistics rail (UTC month, app tokens). */
export function StatRailCalendar({
  className,
  showWeekSummary = true,
  showTodayDot = false,
  compact = false,
  homeFlat = false,
}: StatRailCalendarProps) {
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
      className={cn(
        'min-w-0 cursor-pointer outline-none',
        homeFlat && 'px-1.5 py-1',
        !homeFlat && 'rounded-lg',
        className,
      )}
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
      <div className={cn('mb-4 flex items-center justify-between gap-2', !homeFlat && 'gap-2')}>
        <h2
          className={cn(
            'text-foreground',
            homeFlat ? 'font-serif text-headline-3' : compact ? 'text-ui-sm' : 'text-headline-3',
          )}
        >
          {monthName}
        </h2>
        <div
          className={cn('flex items-center text-tertiary', homeFlat ? 'gap-3.5 text-home-ink-muted' : 'gap-3')}
          aria-hidden="true"
        >
          <ChevronLeft className="size-4" strokeWidth={homeFlat ? 1.8 : 1.5} />
          <ChevronRight className="size-4" strokeWidth={homeFlat ? 1.8 : 1.5} />
        </div>
      </div>
      <p className="sr-only">{monthLabel}</p>

      <div
        className={cn('grid grid-cols-7 text-center', !homeFlat && (compact ? 'mt-2 gap-y-0' : 'mt-5 gap-y-1'))}
        role="presentation"
      >
        {WEEKDAY_SHORT.map((label) => (
          <span
            key={label}
            className={cn(
              homeFlat
                ? 'pb-2.5 pt-1.5 text-[0.625rem] font-medium uppercase tracking-[0.05rem] text-home-ink-dow'
                : 'text-micro-label text-tertiary',
              !homeFlat && (compact ? 'pb-1' : 'pb-2'),
            )}
          >
            {label}
          </span>
        ))}
      </div>

      {!isReady ? (
        <div
          className={cn(
            'grid grid-cols-7 bg-cream-dim',
            homeFlat ? 'min-h-28' : compact ? 'min-h-28 gap-y-0' : 'min-h-36 gap-y-2',
          )}
          aria-busy="true"
          aria-label="Loading calendar"
        />
      ) : (
        <ul
          role="list"
          aria-label={`Month calendar for ${monthLabel}`}
          className={cn('grid grid-cols-7', !homeFlat && (compact ? 'gap-y-0' : 'gap-y-1'))}
        >
          {slots.map((slot, idx) => {
            if (slot.kind === 'pad') {
              return <li key={`pad-${idx}`} aria-hidden className="aspect-square" />;
            }
            const day = Number(slot.utcDate.split('-')[2]);
            return (
              <li key={slot.utcDate} className="min-w-0">
                <RailDay
                  day={day}
                  complete={slot.complete}
                  isToday={slot.utcDate === todayUtc}
                  showTodayDot={showTodayDot}
                  compact={compact}
                  homeFlat={homeFlat}
                  onSelectComplete={
                    slot.complete ? () => openArchivedDay(slot.utcDate) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {showWeekSummary && !homeFlat ? (
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
      ) : null}
    </section>
  );
}
