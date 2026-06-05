import type { PracticePrefs } from '@/lib/schemas/practice-prefs.schema';
import type { Settings } from '@/lib/schemas/settings.schema';

/** Overlay last-used practice choices onto settings when remember is enabled. */
export function applyLastUsedPractice(
  settings: Settings,
  prefs: PracticePrefs,
): Settings {
  if (!prefs.rememberLastUsed || prefs.lastUsed === null) {
    return settings;
  }

  return {
    ...settings,
    theme: prefs.lastUsed.theme,
    persona: prefs.lastUsed.persona,
    length: prefs.lastUsed.length,
  };
}

export function shouldApplyLastUsedOverlay(
  settings: Settings,
  prefs: PracticePrefs,
): boolean {
  if (!prefs.rememberLastUsed || prefs.lastUsed === null) {
    return false;
  }

  return (
    settings.theme !== prefs.lastUsed.theme ||
    settings.persona !== prefs.lastUsed.persona ||
    settings.length !== prefs.lastUsed.length
  );
}

export function snapshotLastUsedFromSettings(settings: Settings) {
  return {
    theme: settings.theme,
    persona: settings.persona,
    length: settings.length,
  };
}
