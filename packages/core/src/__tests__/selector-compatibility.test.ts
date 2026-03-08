import { describe, expect, test } from "vitest";

import { Selector, TextHandler } from "../index.js";

const html = `
<html>
  <body>
    <section id="products" schema='{"jsonable":"data"}'>
      <article class="product" data-id="1">
        <span class="price">$10.99</span>
      </article>
    </section>
    <script id="page-data" type="application/json">{"lastUpdated":"2024-09-22T10:30:00Z","totalProducts":3}</script>
  </body>
</html>`;

describe("selector compatibility slice", () => {
  test("css() returns collection with first getter", () => {
    const page = new Selector(html);
    const products = page.css("#products");

    expect(products.first?.attributes.id).toBe("products");
  });

  test("css(::text) returns text wrappers whose get() returns TextHandler", () => {
    const page = new Selector(html);
    const textNode = page.css("#page-data::text")[0];
    const content = textNode.get();

    expect(content).toBeInstanceOf(TextHandler);
    expect(content.json<{ totalProducts: number }>().totalProducts).toBe(3);
  });

  test("Selector exposes get(), reFirst() and re_first() aliases", () => {
    const page = new Selector(html);
    const price = page.css('[data-id="1"] .price').first;

    expect(price?.get()).toBeInstanceOf(TextHandler);
    expect(price?.reFirst(/[\.\d]+/)).toBe("10.99");
    expect(price?.re_first(/[\.\d]+/)).toBe("10.99");
  });
});
