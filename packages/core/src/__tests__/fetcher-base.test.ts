import { describe, expect, test } from "vitest";

import { BaseFetcher, Response } from "../index.js";

describe("fetcher base contract", () => {
  test("displayConfig returns source-style parser defaults", () => {
    class TestFetcher extends BaseFetcher {}

    expect(TestFetcher.displayConfig()).toMatchObject({
      huge_tree: true,
      adaptive: false,
      keep_comments: false,
      keep_cdata: false,
      adaptive_domain: "",
    });
  });

  test("configure updates parser-facing defaults and rejects unknown keys", () => {
    class TestFetcher extends BaseFetcher {}

    TestFetcher.configure({ adaptive: true, keep_comments: true, adaptive_domain: "https://example.com" });

    expect(TestFetcher.displayConfig()).toMatchObject({
      adaptive: true,
      keep_comments: true,
      adaptive_domain: "https://example.com",
    });

    expect(() => TestFetcher.configure({ unknown_key: true } as never)).toThrow(/Unknown parser argument/i);
    expect(() => TestFetcher.configure({})).toThrow(/must pass a keyword/i);
  });

  test("response carries metadata and keeps selector semantics", () => {
    const response = new Response({
      url: "https://example.com/page",
      content: "<html><body><h1>Hello</h1><p>World</p></body></html>",
      status: 200,
      reason: "OK",
      headers: { "content-type": "text/html" },
      requestHeaders: { accept: "text/html" },
      method: "GET",
    });

    expect(response.status).toBe(200);
    expect(response.reason).toBe("OK");
    expect(response.url).toBe("https://example.com/page");
    expect(response.headers["content-type"]).toBe("text/html");
    expect(String(response.css("h1").first?.text)).toBe("Hello");
    expect(response.body).toContain("<body>");
  });
});
