# v1 Adaptive + Fetchers Plan

## Goal

把 Scrapling 的“会抓、会绕、会复用”能力搬到 TS：adaptive、静态 fetchers、动态 fetchers、stealth 与代理轮换。

## PRD Trace

- `REQ-0001-005`
- `REQ-0001-006`
- `REQ-0001-007`
- `REQ-0001-008`
- `REQ-0001-009`

## Scope

- adaptive relocation
- `Fetcher` / `AsyncFetcher`
- `DynamicFetcher` / `StealthyFetcher`
- proxy rotation

## Out of Scope

- spiders/CLI/MCP

## Acceptance

- 静态 fetcher 合同测试通过
- 动态 fetcher 的 Node 与 WebExt 适配层测试通过
- 代理轮换与响应标准化测试通过
- 反作弊条款：不得把 Chrome 插件 runtime 静默降级成 Node-only 功能

## Files

- `packages/core/src/fetchers/**`
- `packages/node/src/fetchers/**`
- `packages/webext/src/fetchers/**`
- `packages/**/src/__tests__/fetcher-*.test.ts`

## Steps

1. 红：写 adaptive/fetcher/proxy 失败测试
2. 红验证：缺失实现导致测试按预期失败
3. 绿：补齐 fetchers 与 runtime adapter
4. 绿验证：对应测试与必要 E2E 全绿
5. 重构：统一响应对象与错误模型
6. E2E：动态页面抓取流程跑通

## Risks

- Chrome 插件权限与浏览器自动化接口边界复杂
- 反 bot 方案需要清晰分层，避免把第三方工具绑死到 core

