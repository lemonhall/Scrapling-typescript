import { BaseFetcher, type FetcherConfigurationInput } from "./base.js";
import { Response, type ResponseCookie, type ResponseHistoryEntry } from "./response.js";

type QueryValue = string | number | boolean;
type CookieInput = Record<string, QueryValue> | ResponseCookie[] | string;

export interface FetchRequestOptions extends FetcherConfigurationInput {
  method?: string;
  headers?: HeadersInit;
  params?: Record<string, QueryValue>;
  cookies?: CookieInput;
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

function mergeHeaders(defaultHeaders: HeadersInit | undefined, requestHeaders: HeadersInit | undefined): Headers {
  const headers = new Headers(defaultHeaders ?? {});
  const overrides = new Headers(requestHeaders ?? {});

  for (const [key, value] of overrides.entries()) {
    headers.set(key, value);
  }

  return headers;
}

function mergeRequestOptions(defaults: FetchRequestOptions, request: FetchRequestOptions): FetchRequestOptions {
  return {
    ...defaults,
    ...request,
    headers: mergeHeaders(defaults.headers, request.headers),
    params: { ...(defaults.params ?? {}), ...(request.params ?? {}) },
  };
}

function normalizeCookies(cookies: CookieInput | undefined): ResponseCookie[] {
  if (cookies == null) {
    return [];
  }

  if (typeof cookies === "string") {
    return cookies
      .split(";")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => part.split("="))
      .filter((parts) => parts.length >= 2)
      .map(([name, ...rest]) => ({ name, value: rest.join("=") }));
  }

  if (Array.isArray(cookies)) {
    return cookies.map((cookie) => ({ name: cookie.name, value: cookie.value }));
  }

  return Object.entries(cookies).map(([name, value]) => ({ name, value: String(value) }));
}

function setCookieHeader(headers: Headers, cookieJar: Map<string, string> | undefined, cookies: CookieInput | undefined): void {
  if (headers.has("cookie")) {
    return;
  }

  const values = new Map<string, string>(cookieJar?.entries() ?? []);
  for (const cookie of normalizeCookies(cookies)) {
    values.set(cookie.name, cookie.value);
  }

  if (values.size === 0) {
    return;
  }

  headers.set("cookie", Array.from(values.entries()).map(([name, value]) => `${name}=${value}`).join("; "));
}

function persistCookies(cookieJar: Map<string, string> | undefined, cookies: ResponseCookie[]): void {
  if (cookieJar == null) {
    return;
  }

  for (const cookie of cookies) {
    cookieJar.set(cookie.name, cookie.value);
  }
}

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

function resolveRedirectUrl(location: string, currentUrl: string): string {
  return new URL(location, currentUrl).toString();
}

async function executeFetch(
  fetcherType: typeof BaseFetcher,
  url: string,
  options: FetchRequestOptions,
  cookieJar?: Map<string, string>,
): Promise<Response> {
  const requestUrl = appendParams(url, options.params);
  const method = (options.method ?? "GET").toUpperCase();
  const baseHeaders = options.headers instanceof Headers ? new Headers(options.headers) : new Headers(options.headers ?? {});

  if (shouldUseStealthHeaders(options)) {
    applyStealthHeaders(baseHeaders);
  }

  const body = buildRequestBody(options, baseHeaders);
  const timeout = createTimeoutSignal(options.timeout);
  const history: ResponseHistoryEntry[] = [];
  const followRedirects = shouldFollowRedirects(options);

  let currentUrl = requestUrl;
  let finalResponse: globalThis.Response | null = null;
  let finalRequestHeaders: Headers | null = null;
  let finalCookies: ResponseCookie[] = [];

  try {
    for (let redirectCount = 0; redirectCount < 20; redirectCount += 1) {
      const requestHeaders = new Headers(baseHeaders);
      setCookieHeader(requestHeaders, cookieJar, options.cookies);

      const nativeResponse = await fetch(currentUrl, {
        method,
        headers: requestHeaders,
        body,
        redirect: "manual",
        signal: timeout.signal,
      });

      const responseHeaders = headersToRecord(nativeResponse.headers);
      const responseCookies = extractCookies(nativeResponse.headers);
      persistCookies(cookieJar, responseCookies);

      if (followRedirects && isRedirectStatus(nativeResponse.status)) {
        const location = nativeResponse.headers.get("location");
        history.push({
          url: currentUrl,
          status: nativeResponse.status,
          reason: nativeResponse.statusText,
          headers: responseHeaders,
        });

        if (location == null) {
          finalResponse = nativeResponse;
          finalRequestHeaders = requestHeaders;
          finalCookies = responseCookies;
          break;
        }

        currentUrl = resolveRedirectUrl(location, currentUrl);
        continue;
      }

      finalResponse = nativeResponse;
      finalRequestHeaders = requestHeaders;
      finalCookies = responseCookies;
      break;
    }

    if (finalResponse == null || finalRequestHeaders == null) {
      throw new Error("Failed to resolve final fetch response");
    }

    const content = new Uint8Array(await finalResponse.arrayBuffer());
    const selectorOptions = fetcherType.generateSelectorOptions(options);
    const responseUrl = selectorOptions.url || finalResponse.url || currentUrl;

    return new Response({
      url: responseUrl,
      content,
      status: finalResponse.status,
      reason: finalResponse.statusText,
      headers: headersToRecord(finalResponse.headers),
      requestHeaders: headersToRecord(finalRequestHeaders),
      method,
      cookies: finalCookies,
      history,
      adaptive: selectorOptions.adaptive,
      adaptiveStorage: selectorOptions.adaptiveStorage,
      keepComments: selectorOptions.keepComments,
      keepCdata: selectorOptions.keepCdata,
    });
  } finally {
    timeout.cleanup();
  }
}

export class Fetcher extends BaseFetcher {
  static async fetch(url: string, options: FetchRequestOptions = {}): Promise<Response> {
    return executeFetch(this, url, options);
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

export class FetcherClient extends BaseFetcher {
  readonly #defaults: FetchRequestOptions;
  readonly #cookieJar = new Map<string, string>();

  constructor(defaults: FetchRequestOptions = {}) {
    super();
    this.#defaults = {
      ...defaults,
      headers: mergeHeaders(undefined, defaults.headers),
      params: { ...(defaults.params ?? {}) },
    };
  }

  get cookies(): ResponseCookie[] {
    return Array.from(this.#cookieJar.entries()).map(([name, value]) => ({ name, value }));
  }

  clearCookies(): void {
    this.#cookieJar.clear();
  }

  async fetch(url: string, options: FetchRequestOptions = {}): Promise<Response> {
    const merged = mergeRequestOptions(this.#defaults, options);
    return executeFetch(this.constructor as typeof BaseFetcher, url, merged, this.#cookieJar);
  }

  get(url: string, options: Omit<FetchRequestOptions, "body" | "data" | "json"> = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "GET" });
  }

  post(url: string, options: FetchRequestOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "POST" });
  }

  put(url: string, options: FetchRequestOptions = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "PUT" });
  }

  delete(url: string, options: Omit<FetchRequestOptions, "body" | "data" | "json"> = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: "DELETE" });
  }
}

export class AsyncFetcherClient extends FetcherClient {}
