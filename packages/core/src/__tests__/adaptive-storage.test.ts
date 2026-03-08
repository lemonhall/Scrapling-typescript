import { describe, expect, test } from "vitest";

import { Selector, createMemoryAdaptiveStorage } from "../index.js";

describe("adaptive storage injection", () => {
  test("injected memory storage isolates adaptive snapshots by backend instance", () => {
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

    const primaryStorage = createMemoryAdaptiveStorage();
    const secondaryStorage = createMemoryAdaptiveStorage();

    const sourcePage = new Selector(originalHtml, {
      url: "https://example.com/storage-core",
      adaptive: true,
      adaptiveStorage: primaryStorage,
    });

    const relocatedWithSharedStorage = new Selector(changedHtml, {
      url: "https://example.com/storage-core",
      adaptive: true,
      adaptiveStorage: primaryStorage,
    });

    const relocatedWithOtherStorage = new Selector(changedHtml, {
      url: "https://example.com/storage-core",
      adaptive: true,
      adaptiveStorage: secondaryStorage,
    });

    expect(sourcePage.css("#p1", { autoSave: true })).toHaveLength(1);
    expect(relocatedWithSharedStorage.css("#p1", { adaptive: true })).toHaveLength(1);
    expect(relocatedWithOtherStorage.css("#p1", { adaptive: true })).toHaveLength(0);
  });
});
