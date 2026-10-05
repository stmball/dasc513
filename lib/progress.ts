"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface SessionProgress {
  /** Evidence ids the group has opened. */
  opened: string[];
  /** Question ids solved, in order. */
  solved: string[];
  /** Whether the final override code has been entered. */
  escaped: boolean;
  /** Epoch ms of the first interaction, for the on-screen timer. */
  startedAt: number | null;
}

export const emptyProgress: SessionProgress = {
  opened: [],
  solved: [],
  escaped: false,
  startedAt: null,
};

const KEY_PREFIX = "dasc513:progress:";

export function storageKey(slug: string): string {
  return `${KEY_PREFIX}${slug}`;
}

export function readProgress(slug: string): SessionProgress {
  if (typeof window === "undefined") return emptyProgress;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as Partial<SessionProgress>;
    return { ...emptyProgress, ...parsed };
  } catch {
    return emptyProgress;
  }
}

/*
 * Progress lives in localStorage so a group can close the tab, and so no
 * server or login is needed for a room full of students. It is exposed to
 * React as an external store: `getSnapshot` has to return a stable reference,
 * hence the cache.
 */
const snapshots = new Map<string, SessionProgress>();
const listeners = new Map<string, Set<() => void>>();

function notify(slug: string) {
  listeners.get(slug)?.forEach((listener) => listener());
}

function subscribe(slug: string, listener: () => void): () => void {
  let forSlug = listeners.get(slug);
  if (!forSlug) {
    forSlug = new Set();
    listeners.set(slug, forSlug);
  }
  forSlug.add(listener);

  // Another tab in the same room changing the same session.
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(slug)) {
      snapshots.delete(slug);
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    forSlug.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(slug: string): SessionProgress {
  let snapshot = snapshots.get(slug);
  if (!snapshot) {
    snapshot = readProgress(slug);
    snapshots.set(slug, snapshot);
  }
  return snapshot;
}

function commit(slug: string, next: SessionProgress) {
  snapshots.set(slug, next);
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(next));
  } catch {
    // Private browsing or a full quota: the session still works in-memory.
  }
  notify(slug);
}

export function useProgress(slug: string) {
  const progress = useSyncExternalStore(
    useCallback((listener: () => void) => subscribe(slug, listener), [slug]),
    useCallback(() => getSnapshot(slug), [slug]),
    () => emptyProgress,
  );

  const update = useCallback(
    (mutate: (current: SessionProgress) => SessionProgress) => {
      const next = mutate(getSnapshot(slug));
      commit(slug, {
        ...next,
        startedAt: next.startedAt ?? Date.now(),
      });
    },
    [slug],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey(slug));
    } catch {
      // ignore
    }
    snapshots.set(slug, emptyProgress);
    notify(slug);
  }, [slug]);

  return { progress, update, reset };
}
