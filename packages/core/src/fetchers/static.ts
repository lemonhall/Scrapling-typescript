import { BaseFetcher, type FetcherConfigurationInput } from "./base.js";
import { Response, type ResponseCookie } from "./response.js";

type QueryValue = string | number | boolean;

export interface FetchRequestOptions extends FetcherConfigurationInput {
  method?: string;
  headers?: HeadersInit;
  params?: Record<string, QueryValue>;
  json?: unknown;
  data?: Record<string, QueryValue> | URLSearchParams | FormData | string | Uint8Array | ArrayBuffer;
  body?: BodyInit;
  followRedirects?: boolean;
  follow_redirects?: boolean;
  timeout?: number | null;
  stealthyHeaders?: boolean;
  stealthy_headers?: boolean;
}

function headersToRecord(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

function appendParams(url: string, params: FetchRequestOptions["params"]): string {
  if (params == null) {
    return url;
  }

  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, String(value));
  }

  return target.toString();
}

function applyStealthHeaders(headers: Headers): void {
  if (!headers.has("accept")) {
    headers.set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
  }

  if (!headers.has("accept-language")) {
    headers.set("accept-language", "en-US,en;q=0.9");
  }
}

function isPlainRecord(value: unknown): value is Record<string, QueryValue> {
  return typeof value === "object" && value != null && !Array.isArray(value)
    && !(value instanceof URLSearchParams)
    && !(value instanceof FormData)
    && !(value instanceof Uint8Array)
    && !(value instanceof ArrayBuffer);
}

function buildRequestBody(options: FetchRequestOptions, headers: Headers): BodyInit | undefined {
  if (options.json !== undefined) {
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return JSON.stringify(options.json);
  }

  if (options.data !== undefined) {
    if (options.data instanceof URLSearchParams) {
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
      }

      return options.data.toString();
    }

    if (options.data instanceof FormData || typeof options.data === "string") {
      return options.data;
    }

    if (options.data instanceof ArrayBuffer || options.data instanceof Uint8Array) {
      return options.data as BodyInit;
    }

    if (isPlainRecord(options.data)) {
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
      }

      return new URLSearchParams(Object.entries(options.data).map(([key, value]) => [key, String(value)])).toString();
    }
  }

  return options.body;
}

function extractCookies(headers: Headers): ResponseCookie[] {
  const typedHeaders = headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = typedHeaders.getSetCookie?.() ?? [];

  return setCookies
    .map((value) => value.split(";", 1)[0])
    .map((value) => value.split("="))
    .filter((parts) => parts.length >= 2)
    .map(([name, ...rest]) => ({ name, value: rest.join("=") }));
}

function shouldUseStealthHeaders(options: FetchRequestOptions): boolean {
  return options.stealthyHeaders ?? options.stealthy_headers ?? false;
}

function shouldFollowRedirects(options: FetchRequestOptions): boolean {
  return options.followRedirects ?? options.follow_redirects ?? true;
}

function createTimeoutSignal(timeout: number | null | undefined): { signal?: AbortSignal; cleanup: () => void } {
  if (timeout == null) {
    return { signal: undefined, cleanup: () => undefined };
  }

  const controller = new AbortController();
  const handle = setTimeout(() => controller.abort(), timeout);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(handle),
  };
}

export class Fetcher extends BaseFetcher {
  static async fetch(url: string, options: FetchRequestOptions = {}): Promise<Response> {
    const requestUrl = appendParams(url, options.params);
    const method = (options.method ?? "GET").toUpperCase();
    const headers = new Headers(options.headers ?? {});

    if (shouldUseStealthHeaders(options)) {
      applyStealthHeaders(headers);
    }

    const body = buildRequestBody(options, headers);
    const timeout = createTimeoutSignal(options.timeout);

    try {
      const nativeResponse = await fetch(requestUrl, {
        method,
        headers,
        body,
        redirect: shouldFollowRedirects(options) ? "follow" : "manual",
        signal: timeout.signal,
      });

      const content = new Uint8Array(await nativeResponse.arrayBuffer());
      const selectorOptions = this.generateSelectorOptions(options);
      const responseUrl = selectorOptions.url || nativeResponse.url || requestUrl;

      return new Response({
        url: responseUrl,
        content,
        status: nativeResponse.status,
        reason: nativeResponse.statusText,
        headers: headersToRecord(nativeResponse.headers),
        requestHeaders: headersToRecord(headers),
        method,
        cookies: extractCookies(nativeResponse.headers),
        history: [],
        adaptive: selectorOptions.adaptive,
        adaptiveStorage: selectorOptions.adaptiveStorage,
        keepComments: selectorOptions.keepComments,
        keepCdata: selectorOptions.keepCdata,
      });
    } finally {
      timeout.cleanup();
    }
  }

  static get(url: string, options: Omit<FetchRequestOptions, "body" | "data" | "json"> = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "GET" });
  }

  static post(url: string, options: FetchRequestOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "POST" });
  }

  static put(url: string, options: FetchRequestOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "PUT" });
  }

  static delete(url: string, options: Omit<FetchRequestOptions, "body" | "data" | "json"> = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "DELETE" });
  }
}

export class AsyncFetcher extends Fetcher {}
