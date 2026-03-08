import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { AdaptiveSnapshot, AdaptiveStorage } from "@scrapling-ts/core";

function cloneAdaptiveSnapshot(snapshot: AdaptiveSnapshot): AdaptiveSnapshot {
  return {
    tag: snapshot.tag,
    text: snapshot.text,
    allText: snapshot.allText,
    attributes: { ...snapshot.attributes },
  };
}

function isSnapshotRecord(value: unknown): value is Record<string, AdaptiveSnapshot> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function readSnapshotFile(filePath: string): Record<string, AdaptiveSnapshot> {
  if (!existsSync(filePath)) {
    return {};
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    if (raw.trim().length === 0) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    return isSnapshotRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeSnapshotFile(filePath: string, snapshots: Record<string, AdaptiveSnapshot>): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(snapshots, null, 2)}\n`, "utf8");
}

export function createFileAdaptiveStorage(filePath: string): AdaptiveStorage {
  return {
    get(key: string): AdaptiveSnapshot | undefined {
      const snapshot = readSnapshotFile(filePath)[key];
      return snapshot == null ? undefined : cloneAdaptiveSnapshot(snapshot);
    },
    set(key: string, snapshot: AdaptiveSnapshot): void {
      const snapshots = readSnapshotFile(filePath);
      snapshots[key] = cloneAdaptiveSnapshot(snapshot);
      writeSnapshotFile(filePath, snapshots);
    },
  };
}
