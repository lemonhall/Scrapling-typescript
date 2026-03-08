import { describe, expect, test } from "vitest";

import { AttributesHandler, Selector, TextHandler } from "../index.js";

const html = `
<html>
  <body>
    <main>
      <section id="products" schema='{"jsonable": "data"}'>
        <h2>Products</h2>
        <div class="product-list">
          <article class="product" data-id="1">
            <h3>Product 1</h3>
            <p class="description">This is product 1</p>
            <div class="stock">In stock: 5</div>
          </article>
          <article class="product" data-id="2">
            <h3>Product 2</h3>
            <p class="description">This is product 2</p>
            <div class="stock">In stock: 3</div>
          </article>
          <article class="product" data-id="3">
            <h3>Product 3</h3>
            <p class="description">This is product 3</p>
            <div class="stock">Out of stock</div>
          </article>
        </div>
      </section>
      <section id="reviews">
        <h2>Customer Reviews</h2>
        <div class="review-list">
          <div class="review" data-rating="5">
            <p class="review-text">Great product!</p>
            <span class="reviewer">John Doe</span>
          </div>
          <div class="review" data-rating="4">
            <p class="review-text">Good value for money.</p>
            <span class="reviewer">Jane Smith</span>
          </div>
        </div>
      </section>
    </main>
    <script id="page-data" type="application/json">{"lastUpdated":"2024-09-22T10:30:00Z","totalProducts":3}</script>
  </body>
</html>`;

describe("Selector parser-core slice", () => {
  test("REQ-0001-004 支持按文本精确与部分匹配查找元素", () => {
    const page = new Selector(html);

    const exact = page.findByText("Great product!");
    const partial = page.findByText("In stock:", { partial: true, firstMatch: false });

    expect(Array.isArray(exact)).toBe(false);
    expect(String(exact?.text)).toBe("Great product!");
    expect(Array.isArray(partial)).toBe(true);
    expect(partial).toHaveLength(2);
  });

  test("REQ-0001-004 支持按正则查找元素", () => {
    const page = new Selector(html);

    const firstStock = page.findByRegex(/In stock: \d+/, { firstMatch: true });
    const allStocks = page.findByRegex(/In stock: \d+/, { firstMatch: false });

    expect(Array.isArray(firstStock)).toBe(false);
    expect(String(firstStock?.text)).toBe("In stock: 5");
    expect(Array.isArray(allStocks)).toBe(true);
    expect(allStocks).toHaveLength(2);
  });

  test("REQ-0001-004 支持基础 XPath 标签路径与谓词过滤", () => {
    const page = new Selector(html);

    const reviews = page.xpath('//section[@id="reviews"]//div[contains(@class, "review") and @data-rating >= 4]');

    expect(reviews).toHaveLength(2);
    expect(reviews[0]?.attributes["data-rating"]).toBe("5");
  });

  test("REQ-0001-004 支持 CSS :contains() 与 :not(:contains()) 过滤", () => {
    const page = new Selector(html);

    const inStock = page.css('main #products .product-list article.product:not(:contains("Out of stock"))');
    const outOfStock = page.css('main #products .product-list article.product:contains("Out of stock")');

    expect(inStock).toHaveLength(2);
    expect(outOfStock).toHaveLength(1);
    expect(outOfStock.first?.attributes["data-id"]).toBe("3");
  });

  test("REQ-0001-004 支持带函数的 XPath 查询", () => {
    const page = new Selector(html);

    const highPricedProducts = page.xpath(
      '//article[contains(@class, "product")][number(translate(substring-after(.//div[@class="stock"], "In stock: "), ",", "")) > 3]',
    );

    expect(highPricedProducts).toHaveLength(1);
    expect(highPricedProducts[0]?.attributes["data-id"]).toBe("1");
  });

  test("REQ-0001-004 支持父子兄弟与祖先导航", () => {
    const page = new Selector(html);
    const products = page.css("#products .product");
    const firstProduct = products[0];
    const secondProduct = products[1];

    expect(firstProduct.parent?.hasClass("product-list")).toBe(true);
    expect(firstProduct.children).toHaveLength(3);
    expect(firstProduct.next?.attributes["data-id"]).toBe("2");
    expect(secondProduct.previous?.attributes["data-id"]).toBe("1");
    expect(firstProduct.ancestors.map((node) => node.tag)).toContain("section");
  });

  test("REQ-0001-004 TextHandler 提供 json 与 regex 辅助", () => {
    const payload = new TextHandler('{"name":"scrapling-ts","count":3}');

    expect(payload.json<{ name: string; count: number }>()).toEqual({
      name: "scrapling-ts",
      count: 3,
    });
    expect(payload.regex(/count":(\d+)/)?.[1]).toBe("3");
    expect(payload.contains("scrapling-ts")).toBe(true);
  });

  test("REQ-0001-004 AttributesHandler 提供 JSON 解析与值搜索", () => {
    const page = new Selector(html);
    const section = page.css("#products")[0];
    const attrs = new AttributesHandler(section.attributes);

    expect(attrs.get("id")).toBe("products");
    expect(attrs.json<{ jsonable: string }>("schema")).toEqual({ jsonable: "data" });
    expect(attrs.searchValues("data", { partial: true })).toContainEqual({
      schema: '{"jsonable": "data"}',
    });
  });
});
