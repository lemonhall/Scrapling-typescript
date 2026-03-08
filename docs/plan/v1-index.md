# v1 Index

## Goal

用版本化计划把 Scrapling 的 Python 能力体系持续迁移到 TypeScript，并保持“PRD → 计划 → 测试 → 代码 → 验证”可追溯。

## Milestones

| Milestone | Plan | Scope | Status |
| --- | --- | --- | --- |
| M0 Foundation | `docs/plan/v1-foundation.md` | workspace、三层包边界、parser baseline、runtime descriptor | 已完成 |
| M1 Parser Core | `docs/plan/v1-parser-core.md` | XPath、文本/正则查找、导航、handlers、兼容语义 | 进行中 |
| M2 Adaptive + Fetchers | `docs/plan/v1-adaptive-fetchers.md` | adaptive relocation、静态 fetchers、动态 fetchers、stealth、代理轮换 | 进行中 |
| M3 Spiders + CLI + AI | `docs/plan/v1-spiders-cli-ai.md` | spiders、CLI、MCP/AI 能力 | 待开始 |

## Requirement Trace Matrix

| Requirement | Summary | Plan | Status |
| --- | --- | --- | --- |
| `REQ-0001-001` | TypeScript workspace 与包边界 | `v1-foundation` | 已完成 |
| `REQ-0001-002` | Node / Chrome 插件运行时描述 | `v1-foundation` | 已完成 |
| `REQ-0001-003` | Selector + CSS baseline | `v1-foundation` | 已完成 |
| `REQ-0001-004` | parser parity 核心语义 | `v1-parser-core` | 进行中 |
| `REQ-0001-005` | adaptive relocation | `v1-adaptive-fetchers` | 当前切片已完成核心合同 |
| `REQ-0001-006` | 静态 fetchers 与 session | `v1-adaptive-fetchers` | 当前切片已完成核心合同 |
| `REQ-0001-007` | `DynamicFetcher` | `v1-adaptive-fetchers` | 待实现 |
| `REQ-0001-008` | `StealthyFetcher` | `v1-adaptive-fetchers` | 待实现 |
| `REQ-0001-009` | 代理轮换与响应标准化 | `v1-adaptive-fetchers` | 部分完成，代理轮换待补 |
| `REQ-0001-010` | Spider 核心对象 | `v1-spiders-cli-ai` | 待开始 |
| `REQ-0001-011` | Node CLI / shell | `v1-spiders-cli-ai` | 待开始 |
| `REQ-0001-012` | MCP / AI 提取能力 | `v1-spiders-cli-ai` | 待开始 |
| `REQ-0001-013` | 镜像合同测试矩阵 | 跨全部计划 | 进行中 |
| `REQ-0001-014` | 文档与追溯机制 | `v1-foundation` | 已完成基础矩阵 |

## 已完成切片

- `v1: feat: adaptive relocation baseline`
- `v1: feat: adaptive storage abstraction`
- `v1: feat: static fetcher baseline`
- `v1: feat: fetcher session baseline`
- `v1: feat: response redirect history`
- `v1: feat: fetcher retry auth meta`

## 当前能力快照

- parser core 已覆盖：XPath baseline、文本/正则查找、`TextHandler` / `AttributesHandler`、导航语义、`find/find_all`、`::text`、`::attr(name)`、`findSimilar()`、基础兼容别名。
- adaptive 已覆盖：快照保存、显式 `identifier`、组合选择器拆分、自定义 storage、误命中保护。
- static fetchers 已覆盖：`Fetcher` / `AsyncFetcher` / `FetcherClient` / `AsyncFetcherClient`、cookie jar、默认配置复用、redirect history、Basic Auth、重试与 `meta` 透传。
- runtime 适配已覆盖：Node 与 Chrome 插件均可导入同一套 core API，并在各自包侧暴露对应适配能力。

## 当前验证基线

- `pnpm test`
- `pnpm build`
- `pnpm typecheck`
- `pnpm --filter @scrapling-ts/node test -- fetcher-static.test.ts`
- `pnpm --filter @scrapling-ts/webext test -- fetcher-static.test.ts`

## Next Slice

- `DynamicFetcher` 的 Node / Chrome 插件桥接方案落地。
- 统一动态响应对象与静态 `Response` 语义。
- 为 `StealthyFetcher` 与代理轮换预留清晰的跨运行时抽象。
