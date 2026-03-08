import { describe, expect, test } from "vitest";

import { hasCapability } from "@scrapling-ts/core";

import { nodeRuntime } from "../index.js";

describe("node runtime exports", () => {
  test("REQ-0001-014 Node runtime 显式声明 Node 专属能力", () => {
    expect(hasCapability(nodeRuntime, "node-fs")).toBe(true);
    expect(hasCapability(nodeRuntime, "node-child-process")).toBe(true);
    expect(hasCapability(nodeRuntime, "playwright-launch")).toBe(true);
  });

  test("REQ-0001-014 Node runtime 不伪装成 Chrome 插件环境", () => {
    expect(hasCapability(nodeRuntime, "chrome-tabs")).toBe(false);
    expect(hasCapability(nodeRuntime, "chrome-storage")).toBe(false);
  });
});

