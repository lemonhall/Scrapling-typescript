import { describe, expect, test } from "vitest";

import { Selector } from "../index.js";

const html = `
<html>
  <body>
    <section id="products">
      <div class="lead">Intro</div>
      <div class="product-list">
        <article class="product" data-id="1"><span class="price">$10.99</span></article>
        <article class="product" data-id="2"><span class="price">$20.99</span></article>
      </div>
      <aside>Sidebar</aside>
      <table><tr><td>Cell 1</td></tr></table>
    </section>
  </body>
</html>`;

describe("selector utility parity slice", () => {
  test("selector exposes path, siblings, prettify, body and urljoin helpers", () => {
    const page = new Selector(html, { url: "https://example.com/catalog/page" });
    const list = page.css(".product-list").first as Selector;

    expect(list.path).toContain("/html");
    expect(list.prettify()).toContain("product-list");
    expect(list.siblings).toHaveLength(3);
    expect(page.body).toContain("<section id=\"products\"");
    expect(page.urljoin("../other")).toBe("https://example.com/other");
    expect(page.urljoin("/absolute")).toBe("https://example.com/absolute");
    expect(page.urljoin("relative")).toBe("https://example.com/catalog/relative");
  });

  test("get_all_text supports separator, strip, ignore_tags and valid_values options", () => {
    const page = new Selector(html);

    expect(page.get_all_text({ separator: " | ", strip: true })).toContain(" | ");
    expect(page.get_all_text({ ignore_tags: ["table"] })).not.toContain("Cell 1");
    expect(page.get_all_text({ valid_values: false })).not.toBe("");
  });
});
