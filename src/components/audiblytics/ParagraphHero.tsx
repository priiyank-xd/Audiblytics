'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { HardWordsList } from '@/components/audiblytics/HardWordsList';
import {
  filterValidHardWords,
  type ParagraphResult,
} from '@/lib/llm/schemas/paragraph.schema';
import { speak } from '@/lib/audio/tts';
import { cn } from '@/lib/utils';

export type ParagraphHeroProps = {
  result: ParagraphResult;
  themeLabel: string;
  paragraphId: string;
  className?: string;
  recycledWordKeys?: ReadonlySet<string>;
  /** Recorder and related controls rendered in the right column on large screens. */
  recordPanel?: ReactNode;
};

export function ParagraphHero({
  result,
  themeLabel,
  paragraphId,
  className,
  recycledWordKeys,
  recordPanel,
}: ParagraphHeroProps) {
  const hardWords = filterValidHardWords(result.hardWords);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  const toggleWordTts = (rowId: string, word: string) => {
    if (typeof window === 'undefined') return;
    if (activeWordId === rowId) {
      window.speechSynthesis.cancel();
      setActiveWordId(null);
      return;
    }
    window.speechSynthesis.cancel();
    setActiveWordId(rowId);
    speak(word, undefined, {
      onEnd: () => {
        setActiveWordId((current) => (current === rowId ? null : current));
      },
    });
  };

  return (
    <article
      className={cn('w-full pt-2 pb-6', className)}
      aria-label={`Today's paragraph, theme: ${themeLabel}`}
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,22rem)] lg:items-start lg:gap-x-8 xl:gap-x-10">
        <div className="min-w-0">
          <p className="text-paragraph-hero text-primary">{result.paragraph}</p>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          {recordPanel}
          <HardWordsList
            entries={hardWords}
            activeWordId={activeWordId}
            onToggleWord={toggleWordTts}
            sourceParagraphId={paragraphId}
            recycledWordKeys={recycledWordKeys}
            variant="rail"
          />
        </aside>
      </div>
    </article>
  );
}
