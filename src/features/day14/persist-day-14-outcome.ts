import { writeDay14State } from '@/lib/storage/use-local-storage';

/** FR39: sync persist `{ fired: true, result }` before any outcome UI (Story 7.4). */
export function persistDay14Outcome(result: 'yes' | 'no'): void {
  writeDay14State({ fired: true, result });
}
