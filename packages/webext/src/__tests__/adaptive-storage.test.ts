import { describe, expect, test } from "vitest";

import { Selector } from "@scrapling-ts/core";

import { createWebStorageAdaptiveStorage } from "../index.js";

class MemoryWebStorage {
  readonly #values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }
}

describe("webext adaptive storage", () => {
  test("web storage adapter rehydrates adaptive snapshots across instances", () => {
    const originalHtml = `
      <section>
        <article id="p1">
          <h3>Product 1</h3>
          <p>Description 1</p>
        </article>
      </section>
    `;

    const changedHtml = `
      <main>
        <article data-id="p1" class="relocated">
          <div>
            <h3>Product 1</h3>
            <p>Description 1</p>
          </div>
        </article>
      </main>
    `;

    const backingStore = new MemoryWebStorage();

    const sourcePage = new Selector(originalHtml, {
      url: "https://example.com/storage-webext",
      adaptive: true,
      adaptiveStorage: createWebStorageAdaptiveStorage(backingStore, { namespace: "scrapling-test" }),
    });

    expect(sourcePage.css("#p1", { autoSave: true })).toHaveLength(1);

    const relocatedPage = new Selector(changedHtml, {
      url: "https://example.com/storage-webext",
      adaptive: true,
      adaptiveStorage: createWebStorageAdaptiveStorage(backingStore, { namespace: "scrapling-test" }),
    });

    const relocated = relocatedPage.css("#p1", { adaptive: true });

    expect(relocated).toHaveLength(1);
    expect(relocated.first?.attributes["data-id"]).toBe("p1");
  });
});
