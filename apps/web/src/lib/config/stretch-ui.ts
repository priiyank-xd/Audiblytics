/** When true, show mockup stretch placeholders (live feedback, AI reflection) without backend work. */
export function isStretchUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUDIBLYTICS_STRETCH_UI === 'true';
}
