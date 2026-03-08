# v1 Index

## 愿景

- 主愿景：`docs/prd/VISION.md`
- 主 PRD：`docs/prd/PRD-0001-scrapling-parity.md`

## 里程碑

| 里程碑 | 范围 | DoD | 验证命令 | 状态 |
|---|---|---|---|---|
| M0 Foundation | workspace、runtime descriptor、`Selector` + CSS 基线 | `pnpm build/typecheck/test` 全绿；Node/WebExt 导出测试通过；解析器基线测试通过 | `pnpm test` / `pnpm build` / `pnpm typecheck` | doing |
| M1 Parser Core | XPath、文本查找、导航、handler | 对应 parser 合同测试通过 | `pnpm --filter @scrapling-ts/core test` | todo |
| M2 Adaptive + Fetchers | adaptive、静态/动态/stealth、代理轮换 | fetchers/adaptive 测试与 E2E 通过 | `pnpm --filter ... test` | todo |
| M3 Spiders | scheduler/engine/session/checkpoint | spiders 测试通过 | `pnpm --filter ... test` | todo |
| M4 CLI + MCP | CLI、shell、extract、MCP | CLI/AI 测试通过 | `pnpm --filter ... test` | todo |

## 计划索引

- `docs/plan/v1-foundation.md`
- `docs/plan/v1-parser-core.md`
- `docs/plan/v1-adaptive-fetchers.md`
- `docs/plan/v1-spiders-cli-ai.md`

## 追溯矩阵

| Req ID | v1 Plan | 测试/命令 | 证据 | 状态 |
|---|---|---|---|---|
| REQ-0001-001 | `v1-foundation` | `pnpm test && pnpm build && pnpm typecheck` | 待本轮验证回填 | doing |
| REQ-0001-002 | `v1-foundation` | `packages/core/src/__tests__/selector-baseline.test.ts` | 待本轮验证回填 | doing |
| REQ-0001-003 | `v1-foundation` | `packages/core/src/__tests__/selector-baseline.test.ts` | 待本轮验证回填 | doing |
| REQ-0001-004 | `v1-parser-core` | `packages/core/src/__tests__/parser-advanced*.test.ts` | — | todo |
| REQ-0001-005 | `v1-adaptive-fetchers` | `packages/core/src/__tests__/adaptive-relocation.test.ts` | — | todo |
| REQ-0001-006 | `v1-adaptive-fetchers` | `packages/node/src/__tests__/fetcher-static*.test.ts` | — | todo |
| REQ-0001-007 | `v1-adaptive-fetchers` | `packages/node/src/__tests__/dynamic-fetcher*.test.ts` + WebExt E2E | — | todo |
| REQ-0001-008 | `v1-adaptive-fetchers` | `packages/node/src/__tests__/stealth-fetcher*.test.ts` + adapter tests | — | todo |
| REQ-0001-009 | `v1-adaptive-fetchers` | `packages/node/src/__tests__/proxy-rotation*.test.ts` | — | todo |
| REQ-0001-010 | `v1-spiders-cli-ai` | `packages/node/src/__tests__/spiders*.test.ts` | — | todo |
| REQ-0001-011 | `v1-spiders-cli-ai` | `packages/node/src/__tests__/cli*.test.ts` | — | todo |
| REQ-0001-012 | `v1-spiders-cli-ai` | `packages/node/src/__tests__/mcp*.test.ts` | — | todo |
| REQ-0001-013 | `v1-spiders-cli-ai` | `docs/plan/v1-index.md` trace 全链路 | — | todo |
| REQ-0001-014 | `v1-foundation` + all | `packages/node/src/__tests__/exports.test.ts` + `packages/webext/src/__tests__/exports.test.ts` | 待本轮验证回填 | doing |

## ECN 索引

- 本轮暂无 ECN。

## 差异列表

- 当前仅完成 foundation 与 parser baseline，尚未进入 XPath、adaptive、fetchers、spiders、CLI、MCP 的实装
- Chrome 插件侧动态/stealth 抓取的具体桥接方案已在 PRD 锁定方向，但尚未编码落地

