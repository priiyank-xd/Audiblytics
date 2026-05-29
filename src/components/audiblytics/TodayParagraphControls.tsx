'use client';

import { Loader2, Pause, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  personaSchema,
  settingsSchema,
  themeSchema,
  type Persona,
  type Settings,
  type Theme,
} from '@/lib/schemas/settings.schema';
import { cn } from '@/lib/utils';

const LENGTH_OPTIONS = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200] as const;

const THEME_LABEL: Record<Theme, string> = {
  horror: 'Horror',
  comedy: 'Comedy',
  adventure: 'Adventure',
  'mythic-quest': 'Mythic quest',
  survival: 'Survival',
  travelogue: 'Travelogue',
  mystery: 'Mystery',
  'sci-fi': 'Sci-Fi',
  'slice-of-life': 'Slice of life',
};

const PERSONA_LABEL: Record<Persona, string> = {
  'gre-aspirant': 'GRE aspirant',
  'business-english': 'Business English',
  storyteller: 'Storyteller',
  'campfire-narrator': 'Campfire narrator',
  'news-reader': 'News reader',
  'debate-coach': 'Debate coach',
  'casual-conversationalist': 'Casual conversationalist',
};

const metadataSelectTriggerClass =
  'h-11 rounded-lg border-divider bg-surface px-3 text-ui-sm text-primary shadow-none hover:bg-surface-elevated focus:ring-0 focus-visible:ring-2 focus-visible:ring-focus';

export type TodayParagraphControlsProps = {
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  mode: 'initial' | 'next';
  isGenerating: boolean;
  disabled?: boolean;
  onGenerate: () => void;
  showListen?: boolean;
  isListening?: boolean;
  onToggleListen?: () => void;
  className?: string;
};

export function TodayParagraphControls({
  settings,
  onSettingsChange,
  mode,
  isGenerating,
  disabled = false,
  onGenerate,
  showListen = false,
  isListening = false,
  onToggleListen,
  className,
}: TodayParagraphControlsProps) {
  const patchSettings = (patch: Partial<Settings>) => {
    const parsed = settingsSchema.safeParse({ ...settings, ...patch });
    if (parsed.success) {
      onSettingsChange(parsed.data);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-4', className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          size="lg"
          className="min-w-40"
          disabled={disabled || isGenerating}
          onClick={onGenerate}
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Generating…
            </>
          ) : mode === 'next' ? (
            'Another paragraph'
          ) : (
            'Generate'
          )}
        </Button>

        {showListen && onToggleListen ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-w-32 gap-2"
            aria-label={isListening ? 'Stop paragraph playback' : 'Listen to paragraph'}
            disabled={isGenerating}
            onClick={onToggleListen}
          >
            {isListening ? (
              <Pause className="size-4" strokeWidth={1.5} aria-hidden />
            ) : (
              <Play className="size-4" strokeWidth={1.5} aria-hidden />
            )}
            {isListening ? 'Stop' : 'Listen'}
          </Button>
        ) : null}
      </div>

      <div
        className="ml-auto flex flex-wrap items-center justify-end gap-2"
        aria-label="Paragraph preferences"
      >
        <Select
          value={settings.theme}
          onValueChange={(v) => {
            if (v === null) return;
            patchSettings({ theme: v as Theme });
          }}
        >
          <SelectTrigger className={metadataSelectTriggerClass} aria-label="Theme">
            <SelectValue>{THEME_LABEL[settings.theme]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {themeSchema.options.map((t) => (
              <SelectItem key={t} value={t}>
                {THEME_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={settings.persona}
          onValueChange={(v) => {
            if (v === null) return;
            patchSettings({ persona: v as Persona });
          }}
        >
          <SelectTrigger className={metadataSelectTriggerClass} aria-label="Persona">
            <SelectValue>{PERSONA_LABEL[settings.persona]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {personaSchema.options.map((p) => (
              <SelectItem key={p} value={p}>
                {PERSONA_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={String(settings.length)}
          onValueChange={(v) => {
            if (v === null) return;
            patchSettings({ length: Number(v) });
          }}
        >
          <SelectTrigger className={metadataSelectTriggerClass} aria-label="Paragraph length">
            <SelectValue>{settings.length} words</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LENGTH_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} words
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
