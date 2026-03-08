# Scrapling TypeScript Vision

## 愿景

让 TypeScript 社区在 **Node** 与 **Chrome 插件** 两个主战场中，获得与 `Scrapling` Python 源项目同等层级的抓取能力、相同的心智模型、尽可能接近的一致 API，以及同样严格的测试与追溯链。

“一模一样的能力”在本项目中的含义不是口号，而是以下可验收结果：

- 开发者可以围绕 `Selector`、`Fetcher`、`DynamicFetcher`、`StealthyFetcher`、`Spider`、`Request`、`CrawlerEngine`、CLI、MCP 等概念建立与源项目一致的使用方式。
- Node 运行时与 Chrome 插件运行时共享同一套公共契约；运行时差异通过适配层补齐，而不是缩减公共能力面。
- 解析、抓取、会话、代理轮换、断点恢复、CLI 与 AI/MCP 能力均要落到自动化测试，而不是靠“看起来差不多”。
- 文档、计划、测试、代码之间存在可追溯链：每条需求都能落到计划、验证命令和证据。

## 目标用户

- 需要在 Node 中做大规模抓取、动态页面采集和爬虫调度的 TypeScript 开发者
- 需要在 Chrome 插件内直接发起采集、解析和页面内提取的扩展开发者
- 需要用统一 API 在 Node 与浏览器侧共享抓取逻辑的 SDK 使用者

## 成功标准

- 源项目公开能力域全部在 TypeScript 侧有明确对应实现或适配计划，且没有“永久缺席”的模块。
- 对应 `tests/parser`、`tests/fetchers`、`tests/spiders`、`tests/cli`、`tests/ai` 的能力域，在 TS 仓库中都有镜像合同测试矩阵。
- 任意对外宣称完成的里程碑，都能用 `pnpm test`、`pnpm build`、`pnpm typecheck` 与域内 E2E 命令给出证据。

