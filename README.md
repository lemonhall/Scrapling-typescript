# Scrapling TypeScript

`Scrapling TypeScript` 的目标不是做一个“长得像 Scrapling 的 TypeScript 库”，而是把 `E:\development\Scrapling` 的公开能力体系按 TypeScript 语义完整迁移到两个运行时：

- `Node`
- `Chrome 插件`

项目当前采用 `pnpm workspace` 组织，并严格遵循塔山开发循环：**愿景 → PRD → 计划 → TDD → 验证 → 回填追溯 → commit + push**。

## 当前进度

- `M0 Foundation`：已完成
- `M1 Parser Core`：进行中
- `M2 Adaptive + Fetchers`：进行中
- `M3 Spiders`：待开始
- `M4 CLI + MCP`：待开始

当前已经交付的核心切片：

- 文档矩阵与 `pnpm workspace` 三层包结构
- `Selector` parser baseline 与大部分 parser core 语义
- adaptive relocation baseline 与 storage abstraction
- 静态 `Fetcher` / `AsyncFetcher`
- `FetcherClient` / `AsyncFetcherClient` session + cookie jar
- redirect history、Basic Auth、重试与 `response.meta`

## 当前能力

### Parser / Adaptive

- `Selector` 支持 HTML 构建、CSS 查询、XPath baseline、文本与正则查找、导航语义、`find/find_all`、`::text`、`::attr(name)`。
- `Selector.css(query, options)` 支持 `adaptive`、`autoSave/auto_save`、`identifier`。
- adaptive 快照支持三种存储：
  - `createMemoryAdaptiveStorage`
  - `createWebStorageAdaptiveStorage`
  - `createFileAdaptiveStorage`
- 组合选择器会拆分快照保存，并有最小命中阈值避免误命中。

### Static Fetchers

- `BaseFetcher`
- `Response`（继承 `Selector`）
- `Fetcher` / `AsyncFetcher`
- `FetcherClient` / `AsyncFetcherClient`

当前静态抓取能力覆盖：

- `get/post/put/delete`
- `params`
- `data`
- `json`
- `headers`
- `cookies`
- `timeout`
- `follow_redirects`
- `stealthy_headers`
- `auth`
- `retries`
- `retryDelay` / `retry_delay`
- `meta`
- redirect history
- session 默认配置复用与 cookie jar 持久化

## 仓库结构

- `packages/core`：跨运行时公共契约、parser、fetchers、共享能力描述
- `packages/node`：Node 适配层
- `packages/webext`：Chrome 插件适配层
- `docs/prd`：愿景与 PRD
- `docs/plan`：版本化计划、追溯矩阵与里程碑

## 快速开始

安装依赖：

```powershell
pnpm install
```

运行验证：

```powershell
pnpm test
pnpm build
pnpm typecheck
```

## 使用示例

### Node：静态抓取 + Basic Auth + 重试 + Meta

```ts
import { Fetcher } from "@scrapling-ts/node";

const response = await Fetcher.get("https://example.com/private", {
  auth: ["user", "pass"],
  retries: 2,
  retry_delay: 0,
  meta: { requestId: "node-demo" },
});

console.log(response.status);
console.log(response.meta.requestId);
console.log(response.history);
```

### Node：文件型 adaptive storage

```ts
import { Selector, createFileAdaptiveStorage } from "@scrapling-ts/node";

const selector = new Selector("<div><p id='title'>Hello</p></div>", {
  url: "https://example.com/page",
  adaptiveStorage: createFileAdaptiveStorage("./.cache/adaptive.json"),
});

selector.css("#title", {
  autoSave: true,
  identifier: "page-title",
});
```

### Chrome 插件：Web Storage adaptive storage

```ts
import { Selector, createWebStorageAdaptiveStorage, Fetcher } from "@scrapling-ts/webext";

const selector = new Selector(document.documentElement.outerHTML, {
  url: location.href,
  adaptiveStorage: createWebStorageAdaptiveStorage(localStorage),
});

const title = selector.css("h1", {
  adaptive: true,
  identifier: "page-title",
}).first;

const response = await Fetcher.get("https://example.com/api", {
  meta: { source: "extension" },
});
```

## 关键文档

- 愿景：`docs/prd/VISION.md`
- 主 PRD：`docs/prd/PRD-0001-scrapling-parity.md`
- v1 索引：`docs/plan/v1-index.md`
- foundation 计划：`docs/plan/v1-foundation.md`
- parser-core 计划：`docs/plan/v1-parser-core.md`
- adaptive/fetchers 计划：`docs/plan/v1-adaptive-fetchers.md`

## 设计原则

- 公共 API 先于运行时实现
- `core` 不直接知道 Node / Chrome 插件细节
- 运行时限制必须显式声明，不允许静默降级
- 不用“差不多可用”冒充源项目对标完成

## 下一步

- 补 `DynamicFetcher` 的 Node / Chrome 插件桥接
- 补 `StealthyFetcher` 的反检测适配层
- 补代理轮换、失败回退与更完整的 E2E 验证
