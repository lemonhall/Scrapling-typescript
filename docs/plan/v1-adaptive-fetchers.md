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

- adaptive relocation 最小合同通过：支持 `autoSave/auto_save`、`adaptive`、显式 `identifier` 与组合选择器快照拆分
- 当结构变化但语义仍保持时能重定位命中；当页面只剩无关节点时不得误命中
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

1. 已完成：adaptive relocation baseline（内存快照、组合选择器拆分、最小重定位评分）
2. 已完成：adaptive 合同测试覆盖正例、显式 `identifier`、误命中负例
3. 已完成：抽象 `adaptiveStorage` 注入接口，并接入 Node 文件后端 / Web Storage 后端
4. 下一刀：补静态 `Fetcher` / `AsyncFetcher` 红绿测试与响应对象基线
5. 后续：动态/stealth fetchers 与代理轮换
6. 里程碑收口：Node/WebExt 适配层测试 + 必要 E2E 全绿

## Current Slice Evidence

- 目标需求：`REQ-0001-005`
- 代码：`packages/core/src/parser/selector.ts`
- 测试：`packages/core/src/__tests__/adaptive-relocation.test.ts`
- 当前实现：
  - `css(query, options)` 支持 `adaptive`、`autoSave`、`auto_save`、`identifier`
  - `SelectorOptions` 支持注入 `adaptiveStorage` / `adaptive_storage`
  - 默认快照按 `url + identifier` 存入进程内存 store
  - 组合选择器如 `#p1, #p2` 会拆成单 selector 分别保存
  - 重定位评分当前依据 `tag`、直接文本、聚合文本、属性值重合，并设置最小命中阈值避免误命中
  - `packages/core` 导出 `createMemoryAdaptiveStorage` 与 `createWebStorageAdaptiveStorage`
  - `packages/node` 导出 `createFileAdaptiveStorage`，可跨 selector 实例持久化快照
- 当前非目标：
  - 尚未实现 fetcher 族与代理轮换

## Risks

- Chrome 插件权限与浏览器自动化接口边界复杂
- 反 bot 方案需要清晰分层，避免把第三方工具绑死到 core
