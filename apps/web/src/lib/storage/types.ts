export type { CollectionWord } from '@/lib/schemas/collection.schema'; // collection.schema
export type { VoiceRecording } from '@/lib/schemas/recording.schema'; // recording.schema
export type { CachedParagraph, HardWord } from '@/lib/schemas/paragraph-cache.schema'; // paragraph-cache.schema
export type { Settings, Theme, Persona, RetentionPolicy } from '@/lib/schemas/settings.schema'; // settings.schema
export type { Completions, DayCompletion } from '@/lib/schemas/completions.schema'; // completions.schema

/** Discriminated-union storage error. Renders via `<InlineErrorSurface variant="storage" />` per AR25. */
export type StorageError =
  | { kind: 'quota_exceeded'; message: string }
  | { kind: 'access_denied'; message: string }
  | { kind: 'unknown'; message: string };
