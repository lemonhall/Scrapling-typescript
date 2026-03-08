export type { RuntimeCapability, RuntimeDescriptor, RuntimeTarget } from "./runtime/capabilities.js";
export { defineRuntimeDescriptor, hasCapability } from "./runtime/capabilities.js";

export { AttributesHandler, TextHandler, TextHandlers } from "./parser/handlers.js";
export type {
  AdaptiveSnapshot,
  AdaptiveStorage,
  WebStorageAdaptiveOptions,
  WebStorageLike,
} from "./parser/adaptive-storage.js";
export { createMemoryAdaptiveStorage, createWebStorageAdaptiveStorage } from "./parser/adaptive-storage.js";
export type { SelectorOptions } from "./parser/selector.js";
export { Selector } from "./parser/selector.js";

export type { FetcherConfigurationInput, FetcherDisplayConfig } from "./fetchers/base.js";
export { BaseFetcher } from "./fetchers/base.js";
export type { FetchRequestOptions } from "./fetchers/static.js";
export { AsyncFetcher, AsyncFetcherClient, Fetcher, FetcherClient } from "./fetchers/static.js";
export type { ResponseCookie, ResponseHistoryEntry, ResponseInit } from "./fetchers/response.js";
export { Response } from "./fetchers/response.js";
