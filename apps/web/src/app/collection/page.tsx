'use client';

import { Filter, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CollectionListRow } from '@/components/audiblytics/CollectionListRow';
import { CollectionWordDetailPanel } from '@/components/audiblytics/CollectionWordDetailPanel';
import { FeatureRouteShell } from '@/components/audiblytics/FeatureRouteShell';
import { useCollectionSourceMeta } from '@/features/collection/use-collection-source-meta';
import { useCollection } from '@/features/collection/use-collection';
import { useRemoveWord } from '@/features/collection/use-remove-word';
import { cancelSpeech, SLOW_SPEECH_RATE, speak } from '@/lib/audio/tts';
import {
  type CollectionTab,
  countByTab,
  filterCollectionBySearch,
  filterCollectionByTab,
} from '@/lib/collection/collection-filters';
import { resolveCollectionSourceLabel } from '@/lib/collection/resolve-collection-source';
import { cn } from '@/lib/utils';

const TABS: { id: CollectionTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'practicing', label: 'Practicing' },
  { id: 'mastered', label: 'Mastered' },
];

export default function CollectionPage() {
  const entries = useCollection();
  const sourceMeta = useCollectionSourceMeta(entries);
  const { isRemovingId, errorById, removeWord } = useRemoveWord();

  const [activeTab, setActiveTab] = useState<CollectionTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speakingSlowId, setSpeakingSlowId] = useState<string | null>(null);

  const tabCounts = useMemo(() => countByTab(entries ?? []), [entries]);

  const visibleEntries = useMemo(() => {
    if (!entries) return [];
    const byTab = filterCollectionByTab(entries, activeTab);
    return filterCollectionBySearch(byTab, searchQuery);
  }, [entries, activeTab, searchQuery]);

  const selectedEntry = useMemo(
    () => visibleEntries.find((e) => e.id === selectedId) ?? null,
    [visibleEntries, selectedId],
  );

  const filterKey = `${activeTab}\0${searchQuery}`;

  useEffect(() => {
    if (visibleEntries.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current && visibleEntries.some((e) => e.id === current)) {
        return current;
      }
      return visibleEntries[0]!.id;
    });
  }, [filterKey, visibleEntries]);

  useEffect(() => {
    if (selectedId && !entries?.some((e) => e.id === selectedId)) {
      setSelectedId(null);
      cancelSpeech();
      setSpeakingId(null);
      setSpeakingSlowId(null);
    }
  }, [entries, selectedId]);

  const handleSpeak = useCallback((entryId: string, word: string, slow: boolean) => {
    if (slow) {
      if (speakingSlowId === entryId) {
        cancelSpeech();
        setSpeakingSlowId(null);
        return;
      }
      setSpeakingId(null);
      setSpeakingSlowId(entryId);
      speak(word, undefined, {
        rate: SLOW_SPEECH_RATE,
        onEnd: () => setSpeakingSlowId(null),
      });
      return;
    }

    if (speakingId === entryId) {
      cancelSpeech();
      setSpeakingId(null);
      return;
    }
    setSpeakingSlowId(null);
    setSpeakingId(entryId);
    speak(word, undefined, {
      onEnd: () => setSpeakingId(null),
    });
  }, [speakingId, speakingSlowId]);

  const handleRemove = useCallback(
    async (id: string) => {
      const result = await removeWord(id);
      if (result.ok && selectedId === id) {
        setSelectedId(null);
      }
    },
    [removeWord, selectedId],
  );

  const resolveSource = useCallback(
    (entry: NonNullable<typeof selectedEntry>) => {
      const paragraphId = entry.sourceParagraphId;
      const context = paragraphId ? sourceMeta[paragraphId] : undefined;
      return resolveCollectionSourceLabel(entry, context);
    },
    [sourceMeta],
  );

  return (
    <FeatureRouteShell>
      {entries === undefined ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-8 max-w-[16rem] rounded-sm bg-cream-dim" />
          <div className="h-5 max-w-[24rem] rounded-sm bg-cream-dim" />
          <div className="h-32 rounded-lg bg-cream-dim" />
          <div className="h-32 rounded-lg bg-cream-dim" />
          <p className="text-caption text-primary">Loading…</p>
        </div>
      ) : entries.length === 0 ? (
        <header className="space-y-1">
          <h1 className="text-headline-2 text-primary">Collection</h1>
          <p className="text-caption text-secondary">
            Your saved words. Practice them in your own time.
          </p>
          <p className="pt-6 font-serif text-body text-secondary italic">No words saved yet.</p>
        </header>
      ) : (
        <div className="space-y-8">
          <header className="space-y-4 border-divider border-b pb-4">
            <div className="space-y-1">
              <h1 className="text-headline-2 text-primary">Collection</h1>
              <p className="text-caption text-secondary">
                Your saved words. Practice them in your own time.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block min-w-0 flex-1 sm:max-w-md">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tertiary"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search words…"
                  className="w-full rounded-lg border border-divider bg-surface-card py-2 pr-3 pl-9 text-ui-sm text-foreground placeholder:text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                  aria-label="Search collection"
                />
              </label>
              <div className="flex items-center gap-2 text-caption text-secondary">
                <Filter className="size-4 text-tertiary" strokeWidth={1.5} aria-hidden />
                <span>Recently added</span>
              </div>
            </div>

            <div
              className="flex flex-wrap gap-1 border-divider border-b"
              role="tablist"
              aria-label="Collection filters"
            >
              {TABS.map((tab) => {
                const count = tabCounts[tab.id];
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      'border-transparent border-b-2 px-3 py-2 text-ui-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
                      isActive
                        ? 'border-primary font-semibold text-primary'
                        : 'text-secondary hover:text-foreground',
                    )}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>
          </header>

          {visibleEntries.length === 0 ? (
            <p className="font-serif text-body text-secondary italic">No words in this tab.</p>
          ) : (
            <div className="grid min-w-0 grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <section className="min-w-0 space-y-2" aria-label="Saved words">
                <div className="hidden gap-3 px-3 text-micro-label text-tertiary sm:grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,6rem)_auto]">
                  <span>Word</span>
                  <span>Meaning</span>
                  <span>Last practiced</span>
                  <span className="sr-only">Actions</span>
                </div>
                <div className="space-y-1">
                  {visibleEntries.map((entry) => (
                    <CollectionListRow
                      key={entry.id}
                      entry={entry}
                      isSelected={entry.id === selectedId}
                      isSpeaking={speakingId === entry.id}
                      isRemoving={isRemovingId === entry.id}
                      onSelect={() => setSelectedId(entry.id)}
                      onSpeak={() => handleSpeak(entry.id, entry.word, false)}
                      onRemove={() => void handleRemove(entry.id)}
                      removeError={errorById[entry.id]}
                    />
                  ))}
                </div>
              </section>

              <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
                {selectedEntry ? (
                  <CollectionWordDetailPanel
                    entry={selectedEntry}
                    sourceLabel={resolveSource(selectedEntry)}
                    isSpeaking={speakingId === selectedEntry.id}
                    isSpeakingSlow={speakingSlowId === selectedEntry.id}
                    onSpeak={() => handleSpeak(selectedEntry.id, selectedEntry.word, false)}
                    onSpeakSlow={() => handleSpeak(selectedEntry.id, selectedEntry.word, true)}
                    onClose={() => setSelectedId(null)}
                    onRemove={() => void handleRemove(selectedEntry.id)}
                    isRemoving={isRemovingId === selectedEntry.id}
                    removeError={errorById[selectedEntry.id]}
                  />
                ) : (
                  <p className="text-caption text-secondary">Select a word to see details.</p>
                )}
              </aside>
            </div>
          )}
        </div>
      )}
    </FeatureRouteShell>
  );
}
