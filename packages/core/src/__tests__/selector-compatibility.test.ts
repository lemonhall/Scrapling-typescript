import { describe, expect, test } from "vitest";

import { Selector, TextHandler, TextHandlers } from "../index.js";

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

  test("source-style snake_case selector aliases remain usable", () => {
    const page = new Selector(html);
    const product = page.css(".product").first;

    expect(product?.has_class("product")).toBe(true);
    expect(page.find_by_text("$10.99")?.tag).toBe("span");
    expect(page.find_by_regex("\\$10\\.99")?.tag).toBe("span");
    expect(product?.generate_css_selector).toBe(".product");
    expect(product?.generate_full_css_selector).toContain("body");
    expect(product?.generate_xpath_selector).toContain("product");
    expect(product?.generate_full_xpath_selector).toContain("html");
  });

  test("AttributesHandler snake_case aliases expose search_values and json_string", () => {
    const page = new Selector(html);
    const attrs = page.css("#products").first?.attrib;

    expect(attrs?.search_values("data", { partial: true })).toContainEqual({ schema: '{"jsonable":"data"}' });

    const encoded = new TextDecoder().decode(attrs?.json_string);
    expect(JSON.parse(encoded)).toMatchObject({ schema: '{"jsonable":"data"}' });
  });

  test("selector collections expose get() and getall() serialization helpers", () => {
    const page = new Selector(html);
    const texts = page.css("#page-data::text");

    expect(texts.get()).toBeInstanceOf(TextHandler);
    expect(texts.getall()).toBeInstanceOf(TextHandlers);
    expect(texts.getall()[0]).toContain("totalProducts");
  });
});
