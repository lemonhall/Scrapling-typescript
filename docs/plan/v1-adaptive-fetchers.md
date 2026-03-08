# v1 Adaptive + Fetchers Plan

## Goal

把 Scrapling 的“会抓、会绕、会复用”能力搬到 TypeScript：adaptive relocation、静态 fetchers、动态 fetchers、stealth 与代理轮换。

## Current Slice

- 2026-03-08 当前已交付：adaptive relocation baseline、adaptive storage abstraction、静态 `Fetcher` / `AsyncFetcher`、`FetcherClient` / `AsyncFetcherClient`、redirect history、`auth` / `retries` / `meta`。
- 当前切片已经把 `REQ-0001-005` 与 `REQ-0001-006` 的核心能力补到可验证状态，并为 `REQ-0001-007` / `REQ-0001-008` / `REQ-0001-009` 预留统一响应与运行时适配底座。

## PRD Trace

- `REQ-0001-005`
- `REQ-0001-006`
- `REQ-0001-007`
- `REQ-0001-008`
- `REQ-0001-009`

## Scope

- adaptive relocation
- `Fetcher` / `AsyncFetcher`
- `FetcherClient` / `AsyncFetcherClient`
- `DynamicFetcher` / `StealthyFetcher`
- proxy rotation

## Out of Scope

- spiders / CLI / MCP

## Acceptance

- adaptive relocation 合同通过：支持 `adaptive`、`autoSave/auto_save`、显式 `identifier` 与组合选择器快照拆分。
- 当页面结构变化但语义仍然稳定时可以重定位命中；当只剩无关节点时不得误命中。
- 静态 fetcher 合同通过：`get/post/put/delete`、`params`、`data`、`json`、`headers`、`cookies`、`timeout`、`follow_redirects`、`stealthy_headers`、`auth`、`retries`、`meta`。
- Node 与 WebExt 适配层复用同一套静态 fetcher 契约，不允许把 Chrome 插件 runtime 静默降级成 Node-only 能力。
- session 默认配置复用、cookie jar 持久化、redirect history 与响应标准化测试通过。
- `pnpm test`、`pnpm build`、`pnpm typecheck` 全部退出码为 `0`。

## 当前切片完成证据

- 定向测试通过：
  - `pnpm --filter @scrapling-ts/node test -- fetcher-static.test.ts`
  - `pnpm --filter @scrapling-ts/webext test -- fetcher-static.test.ts`
- 整仓验证通过：
  - `pnpm test`
  - `pnpm build`
  - `pnpm typecheck`
- 关键覆盖文件：
  - `packages/core/src/fetchers/static.ts`
  - `packages/core/src/fetchers/response.ts`
  - `packages/node/src/__tests__/fetcher-static.test.ts`
  - `packages/webext/src/__tests__/fetcher-static.test.ts`

## 当前已具备能力

- adaptive relocation：
  - `Selector.css(query, options)` 支持 `adaptive`、`autoSave`、`auto_save`、`identifier`
  - 支持组合选择器拆分快照保存
  - 默认使用内存快照存储，并支持注入自定义 `adaptiveStorage`
  - 当前重定位评分基于标签、直接文本、聚合文本与属性重合度，并带最小命中阈值，避免误命中
- adaptive storage：
  - `packages/core` 导出 `createMemoryAdaptiveStorage`
  - `packages/core` 导出 `createWebStorageAdaptiveStorage`
  - `packages/node` 导出 `createFileAdaptiveStorage`
- 静态 fetchers：
  - `BaseFetcher`
  - `Response`（继承 `Selector`）
  - `Fetcher` / `AsyncFetcher`
  - `FetcherClient` / `AsyncFetcherClient`
- 响应标准化：
  - 支持 `status`、`reason`、`headers`、`requestHeaders`、`cookies`、`history`、`meta`、`ok`、`rawBody`
  - redirect 过程中保留 `history`
  - 调用侧传入的 `meta` 会原样保留到 `response.meta`
- 请求增强：
  - `auth` 支持 Basic Auth
  - `retries` + `retryDelay/retry_delay` 支持瞬时失败重试
  - session 客户端支持默认头、默认参数、cookie jar 复用与清理

## Files

- `packages/core/src/parser/**`
- `packages/core/src/fetchers/**`
- `packages/node/src/adaptive-storage.ts`
- `packages/node/src/__tests__/fetcher-static.test.ts`
- `packages/webext/src/__tests__/fetcher-static.test.ts`

## Steps

1. 已完成：adaptive relocation baseline（内存快照、组合选择器拆分、最小重定位评分）
2. 已完成：adaptive 合同测试覆盖正例、显式 `identifier`、误命中负例
3. 已完成：`adaptiveStorage` 注入接口，以及 Node 文件后端 / Web Storage 后端
4. 已完成：静态 `Fetcher` / `AsyncFetcher` baseline（`get/post/put/delete`、`BaseFetcher` 配置面、统一 `Response`）
5. 已完成：`FetcherClient` / `AsyncFetcherClient` 会话复用、默认头合并与 cookies 持久
6. 已完成：`retries` / `auth` / `request meta` 归一化与合同测试
7. 下一刀：`DynamicFetcher` 运行时桥接与统一响应适配
8. 后续：`StealthyFetcher`、代理轮换、失败回退与 E2E 验证

## Risks

- Node 与 WebExt 对 `fetch`、cookie、重定向与认证细节的原生行为存在运行时差异，需要持续用合同测试钉死。
- 动态抓取与 stealth 能力如果过早把 runtime 细节塞进 `core`，会污染跨运行时抽象。
- 代理轮换要避免只做 Node 侧实现而让插件侧“名义支持、实际缺失”。
