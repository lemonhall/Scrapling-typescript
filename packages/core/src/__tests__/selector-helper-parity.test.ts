import { describe, expect, test } from "vitest";

import { Selector } from "../index.js";

const html = `
<html>
  <body>
    <section id="products">
      <div class="product-list">
        <article class="product" data-id="1">
          <span class="price">$10.99</span>
        </article>
      </div>
    </section>
  </body>
</html>`;

describe("selector helper parity slice", () => {
  test("findAncestor() and find_ancestor() resolve matching ancestors", () => {
    const page = new Selector(html);
    const price = page.css(".price").first as Selector;

    const product = price.findAncestor((node) => node.hasClass("product"));
    const list = price.find_ancestor((node) => node.hasClass("product-list"));

    expect(product?.attributes["data-id"]).toBe("1");
    expect(list?.hasClass("product-list")).toBe(true);
  });

  test("get_all_text() aliases getAllText()", () => {
    const page = new Selector(html);

    expect(page.get_all_text()).toContain("10.99");
    expect(page.get_all_text()).toBe(page.getAllText());
  });

  test("text returns a TextHandler-like value with regex helpers", () => {
    const page = new Selector(html);
    const price = page.css(".price").first as Selector;

    expect(String(price.text)).toBe("$10.99");
    expect(price.text.re(/(\d+)/)).toEqual(["10", "99"]);
  });
});
