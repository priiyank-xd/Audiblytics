/** Union local + server UTC day-of-use dates (BVR18 migration). */
export function mergeDaysOfUse(local: readonly string[], server: readonly string[]): string[] {
  return [...new Set([...local, ...server])];
}

export function distinctDaysFromMerged(local: readonly string[], server: readonly string[]): number {
  return mergeDaysOfUse(local, server).length;
}
