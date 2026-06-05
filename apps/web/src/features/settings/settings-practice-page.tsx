'use client';

import { BookOpen, Clock, RotateCcw, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsCardRow } from '@/features/settings/settings-card-row';
import {
  LENGTH_OPTIONS,
  PERSONA_LABEL,
  THEME_LABEL,
} from '@/features/settings/settings-constants';
import { useSettingsHub } from '@/features/settings/settings-hub-context';
import { SettingsSaveFooter } from '@/features/settings/settings-save-footer';
import { personaSchema, themeSchema } from '@/lib/schemas/settings.schema';
import type { Persona, Theme } from '@/lib/schemas/settings.schema';

export function SettingsPracticePage() {
  const {
    themeDraft,
    setThemeDraft,
    personaDraft,
    setPersonaDraft,
    lengthDraft,
    setLengthDraft,
    rememberLastUsed,
    setRememberLastUsed,
    savePractice,
    resetPracticeDefaults,
  } = useSettingsHub();

  return (
    <div className="space-y-4">
      <SettingsCardRow
        icon={BookOpen}
        title="Theme"
        description="Story genre for generated paragraphs."
      >
        <Select
          value={themeDraft}
          onValueChange={(v) => {
            if (v === null) return;
            setThemeDraft(v as Theme);
          }}
        >
          <SelectTrigger id="settings-theme" className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {themeSchema.options.map((t) => (
              <SelectItem key={t} value={t}>
                {THEME_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsCardRow>

      <SettingsCardRow
        icon={User}
        title="Persona"
        description="Voice and style of the narrator."
      >
        <Select
          value={personaDraft}
          onValueChange={(v) => {
            if (v === null) return;
            setPersonaDraft(v as Persona);
          }}
        >
          <SelectTrigger id="settings-persona" className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {personaSchema.options.map((p) => (
              <SelectItem key={p} value={p}>
                {PERSONA_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsCardRow>

      <SettingsCardRow
        icon={Clock}
        title="Paragraph length"
        description="Target word count for each paragraph."
      >
        <Select
          value={String(lengthDraft)}
          onValueChange={(v) => {
            if (v === null) return;
            setLengthDraft(Number(v));
          }}
        >
          <SelectTrigger id="settings-length" className="w-full min-w-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LENGTH_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} words
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsCardRow>

      <SettingsCardRow
        icon={RotateCcw}
        title="Remember last used"
        description="Pre-fill Today with your last saved theme, persona, and length."
      >
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={rememberLastUsed}
            onChange={(e) => setRememberLastUsed(e.target.checked)}
            className="size-4 rounded border-divider accent-primary"
          />
          <span className="text-ui-sm text-foreground">Enabled</span>
        </label>
      </SettingsCardRow>

      <div className="flex justify-start">
        <Button type="button" variant="outline" size="sm" onClick={resetPracticeDefaults}>
          Reset to defaults
        </Button>
      </div>

      <SettingsSaveFooter onSave={savePractice} />
    </div>
  );
}
