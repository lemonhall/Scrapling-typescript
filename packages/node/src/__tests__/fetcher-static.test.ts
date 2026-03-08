import { createServer } from "node:http";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { AsyncFetcher, AsyncFetcherClient, Fetcher, FetcherClient } from "../index.js";

describe("node static fetcher baseline", () => {
  let server: ReturnType<typeof createServer>;
  let baseUrl = "";
  let retryAttempts = 0;

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
        response.end("<html><body><h1>Node Fetcher</h1></body></html>");
        return;
      }

      if (url.pathname === "/set-cookie") {
        response.writeHead(200, {
          "content-type": "application/json",
          "set-cookie": "session=node-cookie; Path=/",
        });
        response.end(JSON.stringify({ ok: true }));
        return;
      }

      if (url.pathname === "/redirect") {
        response.writeHead(302, { location: "/html" });
        response.end();
        return;
      }

      if (url.pathname === "/basic-auth") {
        if (request.headers.authorization !== "Basic dXNlcjpwYXNz") {
          response.writeHead(401, { "content-type": "application/json" });
          response.end(JSON.stringify({ ok: false }));
          return;
        }

        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ ok: true, authorized: true }));
        return;
      }

      if (url.pathname === "/retry-once") {
        retryAttempts += 1;
        if (retryAttempts === 1) {
          request.socket.destroy();
          return;
        }

        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ ok: true, attempt: retryAttempts }));
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
    expect(String(response.css("h1").first?.text)).toBe("Node Fetcher");
  });

  test("Fetcher retries transient failures and preserves response meta", async () => {
    retryAttempts = 0;

    const response = await Fetcher.get(`${baseUrl}/retry-once`, {
      retries: 2,
      retry_delay: 0,
      timeout: null,
      meta: { requestId: "node-retry" },
    });

    expect(response.status).toBe(200);
    expect(response.meta).toMatchObject({ requestId: "node-retry" });
    expect(response.json<{ attempt: number }>()).toMatchObject({ attempt: 2 });
  });

  test("AsyncFetcher applies basic auth headers and keeps response meta", async () => {
    const response = await AsyncFetcher.get(`${baseUrl}/basic-auth`, {
      auth: ["user", "pass"],
      timeout: null,
      meta: { scope: "auth" },
    });

    expect(response.status).toBe(200);
    expect(response.meta).toMatchObject({ scope: "auth" });
    expect(response.json<{ authorized: boolean }>()).toMatchObject({ authorized: true });
  });

  test("FetcherClient persists cookies and default headers across requests", async () => {
    const client = new FetcherClient({
      headers: { "x-default": "node-client" },
      timeout: null,
    });

    await client.get(`${baseUrl}/set-cookie`);
    const echoed = await client.get(`${baseUrl}/echo-cookie`);

    expect(echoed.status).toBe(200);
    expect(echoed.json<{ cookie: string; defaultHeader: string }>()).toMatchObject({
      cookie: "session=node-cookie",
      defaultHeader: "node-client",
    });
  });

  test("AsyncFetcherClient is constructible and reuses the same session defaults", async () => {
    const client = new AsyncFetcherClient({
      headers: { "x-default": "node-async-client" },
      timeout: null,
    });

    await client.get(`${baseUrl}/set-cookie`);
    const echoed = await client.get(`${baseUrl}/echo-cookie`);

    expect(echoed.json<{ cookie: string; defaultHeader: string }>()).toMatchObject({
      cookie: "session=node-cookie",
      defaultHeader: "node-async-client",
    });
  });
});
