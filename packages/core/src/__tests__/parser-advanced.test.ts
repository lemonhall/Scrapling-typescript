import { describe, expect, test } from "vitest";

import { AttributesHandler, Selector, TextHandler } from "../index.js";

const advancedHtml = `
<html>
  <body>
    <div id="main"
         class="container active"
         data-config='{"theme":"dark","version":2.5}'
         data-items='[1,2,3,4,5]'
         data-invalid-json='{"broken: json}'
         title="Main Container"
         style="color: red; background: blue;"
         data-empty=""
         data-number="42"
         data-bool="true"
         data-url="https://example.com/page?param=value"
         custom-attr="custom-value"
         data-nested='{"user":{"name":"John","age":30}}'
         data-encoded="&lt;div&gt;HTML&lt;/div&gt;"
         data-null="null">
      <section class="child-section">
        <article class="child-card">
          <h3>Card Title</h3>
        </article>
      </section>
    </div>
    <input type="text" required disabled value="demo" />
  </body>
</html>`;

describe("parser advanced parity slice", () => {
  test("AttributesHandler exposes keys, values, items and jsonString", () => {
    const page = new Selector(advancedHtml);
    const attrs = page.css("#main")[0].attrib;

    expect(attrs.keys()).toContain("id");
    expect(attrs.values()).toContain("container active");
    expect(attrs.items()).toContainEqual(["title", "Main Container"]);

    const encoded = new TextDecoder().decode(attrs.jsonString);
    expect(JSON.parse(encoded)).toMatchObject({
      id: "main",
      class: "container active",
    });
  });

  test("AttributesHandler returns TextHandler for indexed access and supports exact/partial search", () => {
    const page = new Selector(advancedHtml);
    const attrs = page.css("#main")[0].attrib;

    expect(attrs["data-config"]?.json<{ theme: string }>().theme).toBe("dark");
    expect(attrs["data-items"]?.json<number[]>()).toEqual([1, 2, 3, 4, 5]);
    expect(attrs["data-null"]?.json<null>()).toBeNull();

    const exact = attrs.searchValues("main", { partial: false });
    const partial = attrs.searchValues("container", { partial: true });

    expect(exact).toContainEqual({ id: "main" });
    expect(partial.some((entry) => Object.keys(entry)[0] === "class")).toBe(true);
  });

  test("AttributesHandler preserves boolean and empty attributes and stays read-only", () => {
    const page = new Selector(advancedHtml);
    const mainAttrs = page.css("#main")[0].attrib;
    const inputAttrs = page.css("input")[0].attrib;

    expect(String(mainAttrs["data-empty"])).toBe("");
    expect(String(inputAttrs["required"])).toBe("");
    expect(String(inputAttrs["disabled"])).toBe("");
    expect(() => {
      // @ts-expect-error runtime readonly assertion
      mainAttrs.id = "changed";
    }).toThrow();
  });

  test("TextHandler exposes re and reFirst helpers", () => {
    const price = new TextHandler("$10.99");

    expect(price.reFirst(/[\.\d]+/)).toBe("10.99");
    expect(price.re(/(\d+)/)).toEqual(["10", "99"]);
  });

  test("Selector generation getters return stable strings", () => {
    const page = new Selector(advancedHtml);
    const card = page.css(".child-card")[0];

    expect(card.generateCssSelector).toBe(".child-card");
    expect(card.generateFullCssSelector).toContain("body");
    expect(card.generateXPathSelector).toContain("child-card");
    expect(card.generateFullXPathSelector).toContain("html");
  });
});
