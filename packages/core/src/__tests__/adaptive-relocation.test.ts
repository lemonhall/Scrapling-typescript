import { describe, expect, test } from "vitest";

import { Selector } from "../index.js";

describe("adaptive relocation slice", () => {
  test("adaptive relocation re-finds saved elements after structure changes", () => {
    const originalHtml = `
      <div class="container">
        <section class="products">
          <article class="product" id="p1">
            <h3>Product 1</h3>
            <p class="description">Description 1</p>
          </article>
          <article class="product" id="p2">
            <h3>Product 2</h3>
            <p class="description">Description 2</p>
          </article>
        </section>
      </div>
    `;

    const changedHtml = `
      <div class="new-container">
        <div class="product-wrapper">
          <section class="products">
            <article class="product new-class" data-id="p1">
              <div class="product-info">
                <h3>Product 1</h3>
                <p class="new-description">Description 1</p>
              </div>
            </article>
            <article class="product new-class" data-id="p2">
              <div class="product-info">
                <h3>Product 2</h3>
                <p class="new-description">Description 2</p>
              </div>
            </article>
          </section>
        </div>
      </div>
    `;

    const oldPage = new Selector(originalHtml, { url: "https://example.com/positive", adaptive: true });
    const newPage = new Selector(changedHtml, { url: "https://example.com/positive", adaptive: true });

    expect(oldPage.css("#p1, #p2", { autoSave: true })).toHaveLength(2);

    const relocated = newPage.css("#p1", { adaptive: true });

    expect(relocated).toHaveLength(1);
    expect(relocated.first?.attributes["data-id"]).toBe("p1");
    expect(relocated.first?.hasClass("new-class")).toBe(true);
    expect(String(relocated.first?.css(".new-description").first?.text)).toBe("Description 1");
  });

  test("adaptive relocation supports explicit identifiers", () => {
    const originalHtml = `
      <section class="catalog">
        <article class="product featured" id="hero-product">
          <h3>Featured Product</h3>
          <p class="description">Launch edition</p>
        </article>
      </section>
    `;

    const changedHtml = `
      <main class="catalog-shell">
        <div class="hero-card promoted" data-key="hero-product">
          <header>
            <h3>Featured Product</h3>
          </header>
          <p class="summary">Launch edition</p>
        </div>
      </main>
    `;

    const oldPage = new Selector(originalHtml, { url: "https://example.com/identifier", adaptive: true });
    const newPage = new Selector(changedHtml, { url: "https://example.com/identifier", adaptive: true });

    expect(oldPage.css("article.featured", { autoSave: true, identifier: "hero-entry" })).toHaveLength(1);

    const relocated = newPage.css("article.featured", { adaptive: true, identifier: "hero-entry" });

    expect(relocated).toHaveLength(1);
    expect(relocated.first?.attributes["data-key"]).toBe("hero-product");
    expect(String(relocated.first?.css(".summary").first?.text)).toBe("Launch edition");
  });

  test("adaptive relocation avoids unrelated fallback matches", () => {
    const originalHtml = `
      <section class="products">
        <article class="product" id="p1">
          <h3>Product 1</h3>
          <p>Description 1</p>
        </article>
      </section>
    `;

    const unrelatedHtml = `
      <section class="products-v2">
        <article class="product-card">
          <h3>Different Product</h3>
          <p>Different Description</p>
        </article>
        <article class="product-card">
          <h3>Another Product</h3>
          <p>Another Description</p>
        </article>
      </section>
    `;

    const oldPage = new Selector(originalHtml, { url: "https://example.com/negative", adaptive: true });
    const newPage = new Selector(unrelatedHtml, { url: "https://example.com/negative", adaptive: true });

    expect(oldPage.css("#p1", { autoSave: true })).toHaveLength(1);

    const relocated = newPage.css("#p1", { adaptive: true });

    expect(relocated).toHaveLength(0);
  });
});
