export interface AdaptiveSnapshot {
  tag: string | null;
  text: string;
  allText: string;
  attributes: Record<string, string>;
}

export interface AdaptiveStorage {
  get(key: string): AdaptiveSnapshot | undefined;
  set(key: string, snapshot: AdaptiveSnapshot): void;
}

export interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface WebStorageAdaptiveOptions {
  namespace?: string;
}

function cloneAdaptiveSnapshot(snapshot: AdaptiveSnapshot): AdaptiveSnapshot {
  return {
    tag: snapshot.tag,
    text: snapshot.text,
    allText: snapshot.allText,
    attributes: { ...snapshot.attributes },
  };
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function isAdaptiveSnapshot(value: unknown): value is AdaptiveSnapshot {
  if (typeof value !== "object" || value == null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<AdaptiveSnapshot>;
  return (
    (candidate.tag == null || typeof candidate.tag === "string")
    && typeof candidate.text === "string"
    && typeof candidate.allText === "string"
    && isStringRecord(candidate.attributes)
  );
}

export function createMemoryAdaptiveStorage(
  entries: Iterable<readonly [string, AdaptiveSnapshot]> = [],
): AdaptiveStorage {
  const store = new Map<string, AdaptiveSnapshot>();

  for (const [key, snapshot] of entries) {
    store.set(key, cloneAdaptiveSnapshot(snapshot));
  }

  return {
    get(key: string): AdaptiveSnapshot | undefined {
      const snapshot = store.get(key);
      return snapshot == null ? undefined : cloneAdaptiveSnapshot(snapshot);
    },
    set(key: string, snapshot: AdaptiveSnapshot): void {
      store.set(key, cloneAdaptiveSnapshot(snapshot));
    },
  };
}

export function createWebStorageAdaptiveStorage(
  storage: WebStorageLike,
  options: WebStorageAdaptiveOptions = {},
): AdaptiveStorage {
  const namespace = options.namespace ?? "scrapling-ts:adaptive";
  const createScopedKey = (key: string): string => `${namespace}:${key}`;

  return {
    get(key: string): AdaptiveSnapshot | undefined {
      const raw = storage.getItem(createScopedKey(key));

      if (raw == null || raw.length === 0) {
        return undefined;
      }

      try {
        const parsed = JSON.parse(raw) as unknown;
        return isAdaptiveSnapshot(parsed) ? cloneAdaptiveSnapshot(parsed) : undefined;
      } catch {
        return undefined;
      }
    },
    set(key: string, snapshot: AdaptiveSnapshot): void {
      storage.setItem(createScopedKey(key), JSON.stringify(cloneAdaptiveSnapshot(snapshot)));
    },
  };
}

export const defaultAdaptiveStorage = createMemoryAdaptiveStorage();
