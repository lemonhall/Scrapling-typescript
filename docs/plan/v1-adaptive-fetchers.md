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
4. 已完成：静态 `Fetcher` / `AsyncFetcher` baseline（`get/post/put/delete`、`BaseFetcher` 配置面、统一 `Response`）
5. å·²å®æï¼`FetcherClient` / `AsyncFetcherClient` ä¼è¯å¤ç¨ãé»è®¤å¤´åå¹¶ä¸ cookies æä¹
6. ä¸ä¸åï¼è¡¥ retries / auth / request meta ç­æ´å®æ´ååºè§èå
6. ä¸ä¸åï¼è¡¥æ´å®æ´ååºè§èåï¼history / redirects / retries / authï¼
7. åç»­ï¼å¨æ/stealth fetchers ä¸ä»£çè½®æ¢
8. éç¨ç¢æ¶å£ï¼Node/WebExt éé
å±æµè¯ + å¿
è¦ E2E å
¨ç»¿
## Current Slice Evidence

- ç®æ éæ±ï¼`REQ-0001-005` + `REQ-0001-006`
- ä»£ç ï¼`packages/core/src/parser/selector.ts` + `packages/core/src/fetchers/*.ts`
- æµè¯ï¼`packages/core/src/__tests__/adaptive-relocation.test.ts` + `packages/core/src/__tests__/adaptive-storage.test.ts` + `packages/core/src/__tests__/fetcher-base.test.ts` + `packages/node/src/__tests__/fetcher-static.test.ts` + `packages/webext/src/__tests__/fetcher-static.test.ts`
- 当前实现：
  - `css(query, options)` 支持 `adaptive`、`autoSave`、`auto_save`、`identifier`
  - `SelectorOptions` 支持注入 `adaptiveStorage` / `adaptive_storage`
  - 默认快照按 `url + identifier` 存入进程内存 store
  - 组合选择器如 `#p1, #p2` 会拆成单 selector 分别保存
  - 重定位评分当前依据 `tag`、直接文本、聚合文本、属性值重合，并设置最小命中阈值避免误命中
  - `packages/core` 导出 `createMemoryAdaptiveStorage` 与 `createWebStorageAdaptiveStorage`
  - Node ä¸ WebExt åé½å¯ç´æ¥å¤ç¨ç¸åéæ fetcher ä¸ session ååï¼å·²åå« redirect history è®°å½
  - å°æªå®ç° retries / auth / request meta ç­æ´å®æ´å½ä¸å
  - éæ fetcher å½åæ¯æ `get/post/put/delete`ã`params`ã`data`ã`json`ã`headers`ã`cookies`ã`timeout`ã`follow_redirects`ã`stealthy_headers`
  - `FetcherClient` / `AsyncFetcherClient` å½åæ¯æé»è®¤è¯·æ±é
ç½®å¤ç¨ãcookie jar æä¹
åä¸æ¸
ç
  - Node ä¸ WebExt å
é½å¯ç´æ¥å¤ç¨ç¸åéæ fetcher ä¸ session åå
  - å°æªå®ç°æ´å®æ´ç response history / redirects / retries / auth å½ä¸å
  - å°æªå®ç°å¨æ/stealth fetchers ä¸ä»£çè½®æ¢

## Risks

- Chrome 插件权限与浏览器自动化接口边界复杂
- 反 bot 方案需要清晰分层，避免把第三方工具绑死到 core
