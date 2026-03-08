import { createServer } from "node:http";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { AsyncFetcher, Fetcher } from "../index.js";

describe("node static fetcher baseline", () => {
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

      if (url.pathname === "/html") {
        response.writeHead(200, { "content-type": "text/html" });
        response.end("<html><body><h1>Node Fetcher</h1></body></html>");
        return;
      }

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        method: request.method,
        query: Object.fromEntries(url.searchParams.entries()),
        body,
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

  test("Fetcher.get returns a selector-capable response", async () => {
    const response = await Fetcher.get(`${baseUrl}/html`, { stealthy_headers: true, timeout: null });

    expect(response.status).toBe(200);
    expect(String(response.css("h1").first?.text)).toBe("Node Fetcher");
  });

  test("AsyncFetcher.post sends form data and query params", async () => {
    const response = await AsyncFetcher.post(`${baseUrl}/echo`, {
      params: { page: 1 },
      data: { key: "value" },
      follow_redirects: true,
    });

    expect(response.status).toBe(200);
    expect(response.json<{ method: string; query: Record<string, string>; body: string }>()).toEqual({
      method: "POST",
      query: { page: "1" },
      body: "key=value",
    });
  });
});
