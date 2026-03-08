import { defineRuntimeDescriptor } from "@scrapling-ts/core";

export const nodeRuntime = defineRuntimeDescriptor({
  target: "node",
  capabilities: [
    "html-parsing",
    "css-selectors",
    "http-fetch",
    "node-fs",
    "node-child-process",
    "playwright-launch",
    "proxy-configuration",
  ],
  constraints: [
    "Chrome extension tabs APIs are unavailable in plain Node.",
    "Browser-page level adapters must be injected explicitly for extension-specific flows.",
  ],
});

