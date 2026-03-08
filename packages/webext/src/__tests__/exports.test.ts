import { describe, expect, test } from "vitest";

import { hasCapability } from "@scrapling-ts/core";

import { chromeExtensionRuntime } from "../index.js";

describe("chrome extension runtime exports", () => {
  test("REQ-0001-014 Chrome 插件 runtime 显式声明扩展专属能力", () => {
    expect(hasCapability(chromeExtensionRuntime, "chrome-tabs")).toBe(true);
    expect(hasCapability(chromeExtensionRuntime, "chrome-storage")).toBe(true);
    expect(hasCapability(chromeExtensionRuntime, "content-script-dom")).toBe(true);
  });

  test("REQ-0001-014 Chrome 插件 runtime 不伪装成 Node 环境", () => {
    expect(hasCapability(chromeExtensionRuntime, "node-fs")).toBe(false);
    expect(hasCapability(chromeExtensionRuntime, "node-child-process")).toBe(false);
    expect(hasCapability(chromeExtensionRuntime, "playwright-launch")).toBe(false);
  });
});
