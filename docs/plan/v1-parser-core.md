# v1 Parser Core Plan

## Goal

把 `Selector` 从“能做 CSS 查询”推进到可对标源项目 parser 主体测试域。

## Current Slice

- 2026-03-08 当前这一刀先交付：文本查找、正则查找、父子兄弟祖先导航、`TextHandler`、`AttributesHandler`
- XPath 保留到 parser-core 下一刀继续推进

## PRD Trace

- `REQ-0001-004`

## Scope

- XPath
- 文本/正则查找
- 父子兄弟导航
- `TextHandler` / `AttributesHandler`

## Out of Scope

- adaptive relocation
- fetchers

## Acceptance

- 运行 `packages/core` parser 合同测试，退出码为 `0`
- 关键 fixture 上，XPath、文本、导航、属性与文本 handler 断言全部通过
- 反作弊条款：不得以“只支持 CSS”或“只返回字符串数组”充当 parser parity

### 当前切片完成证据

- `pnpm --filter @scrapling-ts/core test` 通过
- `packages/core/src/__tests__/selector-parser-core.test.ts` 中 `5/5` 通过

## Files

- `packages/core/src/parser/**`
- `packages/core/src/__tests__/parser-*.test.ts`

## Steps

1. 红：按源项目 parser 测试域写 TS 合同测试
2. 红验证：单测因缺失 XPath/handler 失败
3. 绿：补齐 parser 能力
4. 绿验证：`pnpm --filter @scrapling-ts/core test`
5. 重构：清理 API 与内部抽象
6. E2E：以 fixture 回归为准

## Risks

- XPath 库在浏览器与 Node 的行为差异
- handler 语义很容易只实现“差不多”而不是对标 Scrapling
