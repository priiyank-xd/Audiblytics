'use client';

import { CollectionRow } from '@/components/audiblytics/CollectionRow';
import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import { useCollection } from '@/features/collection/use-collection';
import { useRemoveWord } from '@/features/collection/use-remove-word';

export default function CollectionPage() {
  const entries = useCollection();
  const { isRemovingId, errorById, removeWord } = useRemoveWord();

  return (
    <FeatureRouteShell>
      {entries === undefined ? (
        <p className="text-body text-secondary">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="font-serif text-body text-secondary italic">No words saved yet.</p>
      ) : (
        <section className="space-y-6">
          <header className="space-y-1">
            <h1 className="text-headline-2 text-primary">Collection</h1>
            <p className="text-caption text-secondary">
              {entries.length} {entries.length === 1 ? 'word' : 'words'} collected
            </p>
          </header>
          <div className="space-y-6">
            {entries.map((e) => (
              <CollectionRow
                key={e.id}
                entry={e}
                isRemoving={isRemovingId === e.id}
                removeError={errorById[e.id]}
                onRemove={() => void removeWord(e.id)}
              />
            ))}
          </div>
        </section>
      )}
    </FeatureRouteShell>
  );
}
