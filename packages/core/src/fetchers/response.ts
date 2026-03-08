import { Selector, type SelectorOptions } from "../parser/selector.js";

export interface ResponseCookie {
  name: string;
  value: string;
}

export interface ResponseHistoryEntry {
  url: string;
  status: number;
  reason: string;
  headers: Record<string, string>;
}

export interface ResponseInit extends SelectorOptions {
  url: string;
  content: string | Uint8Array | ArrayBuffer;
  status: number;
  reason: string;
  headers?: Record<string, string>;
  requestHeaders?: Record<string, string>;
  encoding?: string;
  method?: string;
  cookies?: ResponseCookie[];
  history?: ResponseHistoryEntry[];
  meta?: Record<string, unknown>;
}

function toBytes(content: ResponseInit["content"]): Uint8Array {
  if (typeof content === "string") {
    return new TextEncoder().encode(content);
  }

  if (content instanceof Uint8Array) {
    return new Uint8Array(content);
  }

  return new Uint8Array(content);
}

export class Response extends Selector {
  readonly status: number;
  readonly reason: string;
  readonly headers: Record<string, string>;
  readonly requestHeaders: Record<string, string>;
  readonly encoding: string;
  readonly method: string;
  readonly cookies: ResponseCookie[];
  readonly history: ResponseHistoryEntry[];
  readonly meta: Record<string, unknown>;
  readonly rawBody: Uint8Array;
  readonly ok: boolean;

  constructor(init: ResponseInit) {
    const rawBody = toBytes(init.content);
    const encoding = init.encoding ?? "utf-8";
    const html = new TextDecoder(encoding).decode(rawBody);
    const selectorUrl = init.url;

    super(html, {
      adaptive: init.adaptive,
      adaptiveStorage: init.adaptiveStorage,
      keepComments: init.keepComments,
      keepCdata: init.keepCdata,
      url: selectorUrl,
    });

    this.status = init.status;
    this.reason = init.reason;
    this.headers = { ...(init.headers ?? {}) };
    this.requestHeaders = { ...(init.requestHeaders ?? {}) };
    this.encoding = encoding;
    this.method = init.method ?? "GET";
    this.cookies = [...(init.cookies ?? [])];
    this.history = [...(init.history ?? [])];
    this.meta = { ...(init.meta ?? {}) };
    this.rawBody = rawBody;
    this.ok = init.status >= 200 && init.status < 300;
  }

  json<T>(): T {
    return JSON.parse(new TextDecoder(this.encoding).decode(this.rawBody)) as T;
  }
}
