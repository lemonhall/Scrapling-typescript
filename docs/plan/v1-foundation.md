# v1 Foundation Plan

## Goal

建立可持续推进的 TypeScript workspace，并交付首个真正可用的 `Selector` + CSS 解析基线，为后续 fetchers/spiders 提供统一底座。

## PRD Trace

- `REQ-0001-001`
- `REQ-0001-002`
- `REQ-0001-003`
- `REQ-0001-014`

## Scope

- 建立 `pnpm workspace`
- 建立 `core/node/webext` 三层包边界
- 提供 `Selector` 的 HTML 构建与 CSS 查询基线
- 提供 Node 与 Chrome 插件运行时 descriptor

## Out of Scope

- XPath
- adaptive relocation
- fetchers/spiders/CLI/MCP 行为实现

## Acceptance

- `pnpm test` 退出码为 `0`
- `pnpm build` 退出码为 `0`
- `pnpm typecheck` 退出码为 `0`
- `packages/core/src/__tests__/selector-baseline.test.ts` 至少断言 3 个不同 CSS 查询、标签名、class、属性与全文文本
- `packages/node/src/__tests__/exports.test.ts` 与 `packages/webext/src/__tests__/exports.test.ts` 明确验证可用能力和禁止能力，防止“假兼容”

## Files

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `packages/core/**`
- `packages/node/**`
- `packages/webext/**`
- `docs/prd/**`
- `docs/plan/**`

## Steps

1. 写失败测试（红）：workspace 基线测试与 parser baseline 测试
2. 运行到红：验证空仓库无法通过 `pnpm test`
3. 实现（绿）：补齐包结构、`Selector` 与 runtime descriptor
4. 运行到绿：`pnpm test` / `pnpm build` / `pnpm typecheck`
5. 必要重构：整理导出与文档追溯
6. E2E：本阶段不适用，保留到 fetcher/spider 里程碑

## Risks

- 解析器基础库在 Node/浏览器打包兼容性上可能存在差异
- 过早把 runtime-specific 行为塞进 `core` 会污染后续设计

