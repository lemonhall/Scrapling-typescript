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
