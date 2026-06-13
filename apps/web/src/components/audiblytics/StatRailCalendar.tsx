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
  homeCard?: boolean;
  onSelectComplete?: () => void;
};

function RailDay({
  day,
  complete,
  isToday,
  showTodayDot,
  compact,
  homeCard,
  onSelectComplete,
}: RailDayProps) {
  if (homeCard) {
    const todayInner = (
      <span className="flex size-8 flex-col items-center justify-center gap-0.5 rounded-md bg-primary text-on-primary">
        {showTodayDot ? (
          <span className="size-0.5 rounded-full bg-on-primary" aria-hidden="true" />
        ) : null}
        <span className="font-serif text-caption leading-none">{day}</span>
      </span>
    );

    const dayInner = (
      <span
        className={cn(
          'flex size-home-calendar-cell items-center justify-center font-serif text-caption tabular-nums',
          isToday && 'text-foreground',
          !isToday && complete && 'font-medium text-foreground',
          !isToday && !complete && 'text-tertiary',
        )}
      >
        {isToday ? todayInner : day}
      </span>
    );

    if (complete && onSelectComplete) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectComplete();
          }}
          className="flex w-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1"
          aria-label={`Day ${day}, completed. Open archived day.`}
        >
          {dayInner}
        </button>
      );
    }

    return (
      <span className="flex items-center justify-center" aria-label={`Day ${day}${isToday ? ', today' : ''}`}>
        {dayInner}
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
  /** Home rail: fixed card dimensions per UX-V2 mockup. */
  homeCard?: boolean;
};

/** Editorial month grid for the statistics rail (UTC month, app tokens). */
export function StatRailCalendar({
  className,
  showWeekSummary = true,
  showTodayDot = false,
  compact = false,
  homeCard = false,
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
        homeCard &&
          'flex h-home-calendar min-h-0 w-full flex-col overflow-hidden rounded-home-card border border-divider bg-surface-card p-home-rail-card',
        !homeCard && 'rounded-lg',
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
      <div className="flex items-center justify-between gap-2">
        <h2
          className={cn(
            'text-foreground',
            homeCard ? 'font-serif text-headline-3' : compact ? 'text-ui-sm' : 'text-headline-3',
          )}
        >
          {monthName}
        </h2>
        <div className="flex items-center gap-3 text-tertiary" aria-hidden="true">
          <ChevronLeft className="size-4" strokeWidth={1.75} />
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="sr-only">{monthLabel}</p>

      <div
        className={cn(
          'grid grid-cols-7 text-center',
          homeCard ? 'mt-6 gap-home-calendar-cell' : compact ? 'mt-2 gap-y-0' : 'mt-5 gap-y-1',
        )}
        role="presentation"
      >
        {WEEKDAY_SHORT.map((label) => (
          <span
            key={label}
            className={cn(
              'text-micro-label text-tertiary',
              compact && !homeCard ? 'pb-1' : homeCard ? 'pb-0' : 'pb-2',
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
            homeCard && 'mt-2 min-h-0 flex-1 gap-home-calendar-cell',
            !homeCard && (compact ? 'min-h-28 gap-y-0' : 'min-h-36 gap-y-2'),
          )}
          aria-busy="true"
          aria-label="Loading calendar"
        />
      ) : (
        <ul
          role="list"
          aria-label={`Month calendar for ${monthLabel}`}
          className={cn(
            'grid grid-cols-7',
            homeCard && 'mt-2 min-h-0 flex-1 content-start gap-home-calendar-cell',
            !homeCard && (compact ? 'gap-y-0' : 'gap-y-1'),
          )}
        >
          {slots.map((slot, idx) => {
            if (slot.kind === 'pad') {
              return (
                <li
                  key={`pad-${idx}`}
                  aria-hidden
                  className={homeCard ? 'size-home-calendar-cell' : compact ? 'min-h-7' : 'min-h-8'}
                />
              );
            }
            const day = Number(slot.utcDate.split('-')[2]);
            return (
              <li key={slot.utcDate} className="flex min-w-0 items-center justify-center">
                <RailDay
                  day={day}
                  complete={slot.complete}
                  isToday={slot.utcDate === todayUtc}
                  showTodayDot={showTodayDot}
                  compact={compact}
                  homeCard={homeCard}
                  onSelectComplete={
                    slot.complete ? () => openArchivedDay(slot.utcDate) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {showWeekSummary ? (
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
