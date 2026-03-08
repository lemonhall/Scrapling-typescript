import { describe, expect, test } from "vitest";

import { Selector } from "../index.js";

const html = `
<html>
  <body>
    <section id="products">
      <article class="product" data-id="1"><h3>Product 1</h3></article>
      <article class="product" data-id="2"><h3>Product 2</h3></article>
      <article class="product" data-id="3"><h3>Product 3</h3></article>
    </section>
    <section id="reviews">
      <div class="review" data-rating="5">Great product!</div>
      <div class="review" data-rating="4">Good value for money.</div>
    </section>
  </body>
</html>`;

describe("similar elements and parser error slice", () => {
  test("findSimilar() returns sibling-like elements with same structural signature", () => {
    const page = new Selector(html);
    const firstProduct = page.css(".product").first as Selector;
    const firstReview = page.css(".review").first as Selector;

    expect(firstProduct.findSimilar()).toHaveLength(2);
    expect(firstReview.findSimilar()).toHaveLength(1);
  });

  test("invalid Selector initialization throws", () => {
    const SelectorCtor = Selector as unknown as new (...args: unknown[]) => Selector;

    expect(() => new SelectorCtor()).toThrow();
    expect(() => new SelectorCtor(123)).toThrow();
  });

  test("bad CSS and XPath selectors throw", () => {
    const page = new Selector(html);

    expect(() => page.css("4 ayo")).toThrow();
    expect(() => page.xpath("4 ayo")).toThrow();
  });
});
