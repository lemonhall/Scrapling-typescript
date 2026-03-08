import { describe, expect, test } from "vitest";

import { AttributesHandler, Selector, TextHandler, TextHandlers } from "../index.js";

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

  test("TextHandler advanced string methods preserve handler semantics", () => {
    const text = new TextHandler("  Hello World  ");

    expect(text.strip()).toBeInstanceOf(TextHandler);
    expect(text.upper()).toBeInstanceOf(TextHandler);
    expect(text.lower()).toBeInstanceOf(TextHandler);
    expect(text.replace("World", "TypeScript")).toBeInstanceOf(TextHandler);
    expect(String(text.strip())).toBe("Hello World");
    expect(String(text.upper())).toBe("  HELLO WORLD  ");
    expect(String(text.lower())).toBe("  hello world  ");
    expect(String(text.replace("World", "TypeScript"))).toBe("  Hello TypeScript  ");
    expect(String(text.clean())).toBe("Hello World");
    expect(String(new TextHandler("dcba").sort())).toBe("abcd");
  });

  test("TextHandler regex options support case-insensitive and clean matching", () => {
    const prices = new TextHandler("Price: $10.99, Sale: $8.99");
    const greetings = new TextHandler("HELLO hello HeLLo");
    const spaced = new TextHandler(" He  l  lo ");

    expect(prices.re("\\$[\\d.]+")).toEqual(["$10.99", "$8.99"]);
    expect(greetings.re("hello", { caseSensitive: false })).toEqual(["HELLO", "hello", "HeLLo"]);
    expect(spaced.re("He l lo", { cleanMatch: true, caseSensitive: false })).toEqual(["He l lo"]);
  });

  test("TextHandlers slicing and get semantics mirror source project", () => {
    const handlers = new TextHandlers([
      new TextHandler("First"),
      new TextHandler("Second"),
      new TextHandler("Third"),
    ]);

    expect(handlers.slice(0, 2)).toBeInstanceOf(TextHandlers);
    expect(handlers.get()).toBe("First");
    expect(handlers.get("default")).toBe("First");
    expect(new TextHandlers().get("default")).toBe("default");
  });

  test("Selector collections expose last, length, search and filter parity", () => {
    const page = new Selector(`
      <div>
        <p class="highlight">Important</p>
        <p>Regular</p>
        <p class="highlight">Also important</p>
      </div>
    `);

    const paragraphs = page.css("p");
    const highlighted = paragraphs.filter((paragraph) => paragraph.hasClass("highlight"));
    const found = paragraphs.search((paragraph) => String(paragraph.text) === "Regular");

    expect(String(paragraphs.first?.text)).toBe("Important");
    expect(String(paragraphs.last?.text)).toBe("Also important");
    expect(paragraphs.length).toBe(3);
    expect(String(highlighted.first?.text)).toBe("Important");
    expect(highlighted.length).toBe(2);
    expect(String(found?.text)).toBe("Regular");
  });

  test("XPath supports variable bindings", () => {
    const page = new Selector(`
      <html>
        <body>
          <table>
            <tr><td>Cell 1</td><td>Cell 2</td></tr>
          </table>
        </body>
      </html>
    `);

    const cells = page.xpath("//td[text()=$cell_text]", { cell_text: "Cell 1" });

    expect(cells).toHaveLength(1);
    expect(String(cells[0]?.text)).toBe("Cell 1");
  });

  test("keep_comments and keep_cdata control serialized output", () => {
    const markup = `
      <html>
        <body>
          <div>A<!-- Comment --><![CDATA[Some CDATA content]]>B</div>
        </body>
      </html>
    `;

    const kept = new Selector(markup, { keepComments: true, keepCdata: true });
    const stripped = new Selector(markup, { keepComments: false, keepCdata: false });

    expect(kept.body).toContain("Comment");
    expect(kept.body).toContain("CDATA");
    expect(stripped.htmlContent).not.toContain("Comment");
    expect(stripped.htmlContent).not.toContain("CDATA");
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
