import { defineRuntimeDescriptor } from "@scrapling-ts/core";

export const chromeExtensionRuntime = defineRuntimeDescriptor({
  target: "chrome-extension",
  capabilities: [
    "html-parsing",
    "css-selectors",
    "http-fetch",
    "chrome-tabs",
    "chrome-storage",
    "content-script-dom",
    "proxy-configuration",
  ],
  constraints: [
    "No direct child_process access exists in Chrome extensions.",
    "Dynamic and stealth flows must run through extension-controlled tabs or explicit bridges.",
  ],
});

