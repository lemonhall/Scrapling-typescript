import { describe, expect, test } from "vitest";

import { Selector } from "../index.js";

const html = `
<html>
  <body>
    <div class="nested">
      <span id="special">Special content</span>
      <span>Regular content</span>
    </div>
    <div class="review" data-rating="5">Great</div>
    <div class="review" data-rating="4">Nice</div>
    <table>
      <tr><td>Cell 1</td><td>Cell 2</td></tr>
      <tr><td>Cell 3</td><td>Cell 4</td></tr>
    </table>
  </body>
</html>`;

describe("selector find helper parity slice", () => {
  test("find() supports attribute dictionaries and class_ compatibility", () => {
    const page = new Selector(html);

    expect(String(page.find({ id: "special" })?.text)).toBe("Special content");
    expect(page.find("div", { class_: "review" })?.attributes["data-rating"]).toBe("5");
  });

  test("find_all() supports regex and mixed selector filters", () => {
    const page = new Selector(html);

    const cells = page.find_all(/Cell \d+/);
    const mixed = page.find_all("span", ["div"], { class: "nested" }, (element) => String(element.text) !== "");

    expect(cells).toHaveLength(4);
    expect(Array.isArray(mixed)).toBe(true);
    expect(mixed.every((element) => ["div", "span"].includes(element.tag ?? ""))).toBe(true);
  });
});
