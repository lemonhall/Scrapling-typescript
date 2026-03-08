# v1 Spiders + CLI + AI Plan

## Goal

交付完整 crawl framework 外围：spiders、CLI、shell、extract、MCP，以及最终合同测试矩阵闭环。

## PRD Trace

- `REQ-0001-010`
- `REQ-0001-011`
- `REQ-0001-012`
- `REQ-0001-013`

## Scope

- spiders 核心对象与调度
- Node CLI
- MCP/AI 提取
- 合同测试矩阵补齐

## Out of Scope

- 新增源项目没有的“炫技功能”

## Acceptance

- spider 测试通过
- CLI 行为测试通过
- MCP 合同测试通过
- `docs/plan/v1-index.md` 中所有需求均有测试/命令/证据链

## Files

- `packages/core/src/spiders/**`
- `packages/node/src/cli/**`
- `packages/node/src/mcp/**`
- `packages/**/src/__tests__/spider-*.test.ts`
- `packages/**/src/__tests__/cli-*.test.ts`
- `packages/**/src/__tests__/mcp-*.test.ts`

## Steps

1. 红：先写 spider/CLI/MCP 合同测试
2. 红验证：按预期失败
3. 绿：分域补齐实现
4. 绿验证：单测与端到端命令全绿
5. 重构：消除跨层耦合
6. E2E：CLI 命令链路与 MCP 服务链路跑通

## Risks

- CLI 与 MCP 都容易变成“薄壳”，必须严格绑定行为测试
- Spider 对调度顺序、状态恢复、错误传播的要求较高

