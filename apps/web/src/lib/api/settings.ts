import { apiFetch } from '@/lib/api/client';
import {
  activeProviderSchema,
  type ActiveProvider,
} from '@/lib/schemas/provider-keys.schema';
import {
  settingsSchema,
  type Settings,
} from '@/lib/schemas/settings.schema';

export type ApiSettings = Settings & { activeProvider: ActiveProvider };

export async function fetchApiSettings(): Promise<ApiSettings> {
  const raw = await apiFetch<Record<string, unknown>>('/api/v1/settings');
  const settings = settingsSchema.parse({
    theme: raw.theme,
    persona: raw.persona,
    length: raw.length,
    retention: raw.retention,
    voiceURI: raw.voiceURI ?? null,
  });
  const activeProvider = activeProviderSchema.parse(raw.activeProvider ?? 'gemini');
  return { ...settings, activeProvider };
}

export async function patchApiSettings(
  patch: Partial<ApiSettings>,
): Promise<ApiSettings> {
  const body: Record<string, unknown> = {};
  if (patch.theme !== undefined) body.theme = patch.theme;
  if (patch.persona !== undefined) body.persona = patch.persona;
  if (patch.length !== undefined) body.length = patch.length;
  if (patch.retention !== undefined) body.retention = patch.retention;
  if (patch.voiceURI !== undefined) body.voiceURI = patch.voiceURI;
  if (patch.activeProvider !== undefined) body.activeProvider = patch.activeProvider;

  const raw = await apiFetch<Record<string, unknown>>('/api/v1/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const settings = settingsSchema.parse({
    theme: raw.theme,
    persona: raw.persona,
    length: raw.length,
    retention: raw.retention,
    voiceURI: raw.voiceURI ?? null,
  });
  const activeProvider = activeProviderSchema.parse(raw.activeProvider ?? 'gemini');
  return { ...settings, activeProvider };
}
