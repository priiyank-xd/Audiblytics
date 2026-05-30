/** True when the web app reads/writes via FastAPI instead of localStorage/Dexie (BV9). */
export function isApiStorageBackend(): boolean {
  return process.env.NEXT_PUBLIC_STORAGE_BACKEND === 'api';
}
