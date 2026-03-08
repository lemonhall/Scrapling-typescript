import { createServer } from "node:http";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { AsyncFetcher, AsyncFetcherClient, Fetcher, FetcherClient } from "../index.js";

describe("webext static fetcher baseline", () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl = "";

  beforeAll(async () => {
    server = createServer(async (request, response) => {
      const bodyChunks: Uint8Array[] = [];

      for await (const chunk of request) {
        bodyChunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }

      const body = Buffer.concat(bodyChunks).toString("utf8");
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const cookie = request.headers.cookie ?? "";
      const defaultHeader = request.headers["x-default"] ?? "";

      if (url.pathname === "/html") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end("<html><body><h1>WebExt Fetcher</h1></body></html>");
        return;
      }

      if (url.pathname === "/set-cookie") {
        response.writeHead(200, {
          "content-type": "application/json",
          "set-cookie": "session=webext-cookie; Path=/",
        });
        response.end(JSON.stringify({ ok: true }));
        return;
      }

      if (url.pathname === "/redirect") {
        response.writeHead(302, { location: "/html" });
        response.end();
        return;
      }

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        method: request.method,
        query: Object.fromEntries(url.searchParams.entries()),
        body,
        cookie,
        defaultHeader,
      }));
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", () => resolve());
    });

    const address = server.address();
    if (address == null || typeof address === "string") {
      throw new Error("Failed to bind test server");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error != null) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  test("Fetcher.get works through the webext package export", async () => {
    const response = await Fetcher.get(`${baseUrl}/html`, { timeout: null });

    expect(response.status).toBe(200);
    expect(String(response.css("h1").first?.text)).toBe("WebExt Fetcher");
  });

  test("AsyncFetcher.post preserves query and body", async () => {
    const response = await AsyncFetcher.post(`${baseUrl}/echo`, {
      params: { runtime: "webext" },
      data: { key: "value" },
    });

    expect(response.status).toBe(200);
    expect(response.json<{ method: string; query: Record<string, string>; body: string; cookie: string; defaultHeader: string }>()).toEqual({
      method: "POST",
      query: { runtime: "webext" },
      body: "key=value",
      cookie: "",
      defaultHeader: "",
    });
  });

  test("Fetcher records redirect history when following redirects", async () => {
    const response = await Fetcher.get(`${baseUrl}/redirect`, { follow_redirects: true, timeout: null });

    expect(response.status).toBe(200);
    expect(response.url).toBe(`${baseUrl}/html`);
    expect(response.history).toHaveLength(1);
    expect(response.history[0]).toMatchObject({
      status: 302,
      url: `${baseUrl}/redirect`,
    });
    expect(String(response.css("h1").first?.text)).toBe("WebExt Fetcher");
  });

  test("FetcherClient persists cookies and default headers across requests", async () => {
    const client = new FetcherClient({
      headers: { "x-default": "webext-client" },
      timeout: null,
    });

    await client.get(`${baseUrl}/set-cookie`);
    const echoed = await client.get(`${baseUrl}/echo-cookie`);

    expect(echoed.status).toBe(200);
    expect(echoed.json<{ cookie: string; defaultHeader: string }>()).toMatchObject({
      cookie: "session=webext-cookie",
      defaultHeader: "webext-client",
    });
  });

  test("AsyncFetcherClient is constructible and reuses the same session defaults", async () => {
    const client = new AsyncFetcherClient({
      headers: { "x-default": "webext-async-client" },
      timeout: null,
    });

    await client.get(`${baseUrl}/set-cookie`);
    const echoed = await client.get(`${baseUrl}/echo-cookie`);

    expect(echoed.json<{ cookie: string; defaultHeader: string }>()).toMatchObject({
      cookie: "session=webext-cookie",
      defaultHeader: "webext-async-client",
    });
  });
});
