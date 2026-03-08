import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { Selector } from "@scrapling-ts/core";

import { createFileAdaptiveStorage } from "../index.js";

describe("node adaptive storage", () => {
  test("file-backed storage persists adaptive snapshots across selector instances", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "scrapling-ts-node-storage-"));
    const filePath = join(tempDir, "adaptive.json");

    try {
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

      const sourcePage = new Selector(originalHtml, {
        url: "https://example.com/storage-node",
        adaptive: true,
        adaptiveStorage: createFileAdaptiveStorage(filePath),
      });

      expect(sourcePage.css("#p1", { autoSave: true })).toHaveLength(1);

      const relocatedPage = new Selector(changedHtml, {
        url: "https://example.com/storage-node",
        adaptive: true,
        adaptiveStorage: createFileAdaptiveStorage(filePath),
      });

      const relocated = relocatedPage.css("#p1", { adaptive: true });

      expect(relocated).toHaveLength(1);
      expect(relocated.first?.attributes["data-id"]).toBe("p1");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
