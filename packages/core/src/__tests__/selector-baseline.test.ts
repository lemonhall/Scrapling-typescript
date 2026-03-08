import { describe, expect, test } from "vitest";

import { Selector } from "../index.js";

const html = `
<html>
  <body>
    <main>
      <section id="products" schema='{"jsonable": "data"}'>
        <h2>Products</h2>
        <div class="product-list">
          <article class="product featured" data-id="1">
            <h3>Product 1</h3>
            <p class="description">This is product 1</p>
          </article>
          <article class="product" data-id="2">
            <h3>Product 2</h3>
            <p class="description">This is product 2</p>
          </article>
          <article class="product" data-id="3">
            <h3>Product 3</h3>
            <p class="description">This is product 3</p>
          </article>
        </div>
      </section>
    </main>
  </body>
</html>`;

describe("Selector baseline", () => {
  test("REQ-0001-002 从 HTML 构建根 Selector 并可重复查询", () => {
    const page = new Selector(html);

    expect(page.css("main #products .product-list article.product")).toHaveLength(3);
    expect(page.css("#products .product")).toHaveLength(3);
    expect(page.css("article.featured")).toHaveLength(1);
  });

  test("REQ-0001-003 返回元素标签、class 与属性", () => {
    const page = new Selector(html);
    const firstProduct = page.css("#products .product")[0];

    expect(firstProduct?.tag).toBe("article");
    expect(firstProduct?.hasClass("product")).toBe(true);
    expect(firstProduct?.hasClass("featured")).toBe(true);
    expect(firstProduct?.attributes["data-id"]).toBe("1");
  });

  test("REQ-0001-003 支持直接文本、全文文本与 HTML 内容读取", () => {
    const page = new Selector(html);
    const title = page.css("#products h3")[0];
    const productsSection = page.css("#products")[0];

    expect(String(title?.text)).toBe("Product 1");
    expect(productsSection?.attributes.schema).toContain("jsonable");
    expect(productsSection?.getAllText()).toContain("Product 3");
    expect(productsSection?.htmlContent).toContain("product-list");
  });
});
