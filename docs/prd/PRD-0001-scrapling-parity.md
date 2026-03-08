# PRD-0001: Scrapling TypeScript 全能力对标

## Vision

见 `docs/prd/VISION.md`。

## 背景与问题

源项目 `E:\development\Scrapling` 已经形成完整能力栈：

- 解析器：`Selector`、CSS/XPath、文本匹配、导航、属性处理、自适应重定位
- 抓取器：`Fetcher`、`AsyncFetcher`、`DynamicFetcher`、`StealthyFetcher`、会话、代理轮换、响应标准化
- 爬虫框架：`Request`、`Scheduler`、`CrawlerEngine`、`SessionManager`、`Checkpoint`
- 工具面：CLI、交互式 Shell、MCP/AI 提取
- 测试面：`parser / fetchers / spiders / cli / ai / core`

当前 `Scrapling-typescript` 为空目录，必须先把愿景、计划、追溯矩阵和首个可运行骨架建立起来，再按里程碑持续收敛到与源项目无差异的能力面。

## 源项目对标事实

- 源项目公开入口：`Selector`、`Fetcher`、`AsyncFetcher`、`DynamicFetcher`、`StealthyFetcher`
- 源项目爬虫公开入口：`Spider`、`Request`、`CrawlerEngine`、`CrawlResult`、`SessionManager`、`Scheduler`
- 源项目 CLI 命令：`install`、`mcp`、`shell`、`extract`、`get`、`post`、`put`、`delete`、`fetch`、`stealthy_fetch`
- 源项目测试域数量：`parser=4`、`fetchers=18`、`spiders=7`、`cli=2`、`ai=1`、`core=2`
- 源项目运行依赖边界：静态解析依赖 HTML/XPath/CSS，动态抓取依赖浏览器自动化与反检测，AI/MCP 为独立能力域

## 设计原则

- **协议优于实现**：先固定 TS 公共契约，再补各运行时实现
- **分层即道**：`core` 不知道 Node/Chrome 细节；Node 与插件只做适配
- **不打折扣**：浏览器插件受限不等于删功能，而是通过插件侧适配器、标签页桥接或后台能力补齐公共 API
- **证据优先**：每个需求都绑定验证命令或自动化测试

## 运行时策略

### Node

- 承担 CLI、本地文件系统、子进程、Playwright/Patchright、批量抓取和长时会话

### Chrome 插件

- 承担页面内解析、标签页级动态抓取、扩展权限驱动的网络和存储、与内容脚本/后台脚本协作

### 公共要求

- 同一公共 API 在两个运行时必须可导入
- 运行时差异必须由适配层显式声明，不允许静默缺失功能

## 需求

### REQ-0001-001 工作区与包边界必须为跨运行时对标服务

- 动机：没有稳定包边界，后续 parser/fetchers/spiders 会耦死在单一运行时
- 范围：建立 `packages/core`、`packages/node`、`packages/webext`，统一 `pnpm workspace`、构建、测试、类型检查入口
- 非目标：本阶段不实现完整 fetchers/spiders 行为
- 验收口径：`pnpm build`、`pnpm typecheck`、`pnpm test` 退出码为 `0`；三类包均存在；适配层只能通过 workspace 包名依赖 `core`
- 阶段：`v1-foundation`

### REQ-0001-002 必须提供与源项目同名心智入口 `Selector`

- 动机：解析器是整个库的最低公共层，先立住入口才能承接后续 fetcher/spider 响应对象
- 范围：支持从 HTML 字符串创建 `Selector`
- 非目标：本阶段不要求完成 adaptive relocation
- 验收口径：`Selector` 可从 HTML 构建根对象，并可对同一文档多次查询返回稳定结果；相关测试通过
- 阶段：`v1-foundation`

### REQ-0001-003 必须提供 CSS 查询基线能力

- 动机：源项目 parser 测试中，CSS 查询是最常用入口
- 范围：支持文档级与元素级 `css()` 查询、标签读取、class 判断、HTML/文本读取
- 非目标：本阶段不覆盖 XPath、相似元素搜索
- 验收口径：基线 fixture 上，至少能正确完成 3 个不同 CSS 查询、属性提取、文本提取；测试通过
- 阶段：`v1-foundation`

### REQ-0001-004 必须补齐 XPath、文本查找、导航与 handler 语义

- 动机：仅有 CSS 不能称为 Scrapling parser 对标
- 范围：XPath、文本/正则查找、父子兄弟导航、`TextHandler`、`AttributesHandler`
- 非目标：本阶段不实现 fetcher
- 验收口径：镜像 `tests/parser/test_general.py` 与 `test_attributes_handler.py` 的对应断言通过
- 阶段：`v1-parser-core`

### REQ-0001-005 必须实现自适应元素重定位

- 动机：这是 Scrapling 与普通解析器的关键差异之一
- 范围：选择器持久化、同站点页面结构变化后的重定位与命中
- 非目标：不做与站点无关的全局模型学习
- 验收口径：重定位合同测试在结构变化 fixture 上通过；错误结构不得误命中无关节点
- 阶段：`v1-adaptive-fetchers`

### REQ-0001-006 必须提供静态 HTTP fetchers 与会话能力

- 动机：源项目从单次请求到持久会话都依赖统一 fetcher 族
- 范围：`Fetcher`、Promise 风格的 `AsyncFetcher`、cookie/header/params/json/body、会话复用
- 非目标：本阶段不实现浏览器自动化
- 验收口径：静态请求、会话复用、响应规范化测试通过
- 阶段：`v1-adaptive-fetchers`

### REQ-0001-007 必须提供动态页面抓取器 `DynamicFetcher`

- 动机：现代网页抓取无法只靠 HTTP
- 范围：Node 侧浏览器自动化；Chrome 插件侧标签页/脚本桥接；统一响应对象
- 非目标：不允许把插件运行时静默降级成“仅支持静态抓取”
- 验收口径：同一公共 API 能在 Node 与插件适配层导入；动态页面 fixture 或测试站点通过自动化 E2E
- 阶段：`v1-adaptive-fetchers`

### REQ-0001-008 必须提供 `StealthyFetcher` 与反检测适配层

- 动机：源项目把反 bot 绕过作为公共卖点之一
- 范围：Node 侧 Playwright/Patchright/指纹方案；插件侧以扩展环境可行方式补齐接口
- 非目标：不承诺所有第三方反 bot 站点一次性全过
- 验收口径：反检测配置、运行时选择和响应路径有自动化测试；配置缺失时错误信息明确可诊断
- 阶段：`v1-adaptive-fetchers`

### REQ-0001-009 必须提供代理轮换与响应标准化

- 动机：代理轮换是源项目 fetcher 与 spider 的横切能力
- 范围：代理池、轮换策略、失败重试、统一响应包装
- 非目标：不实现外部代理供应商 SDK 聚合层
- 验收口径：代理轮换、失败回退、响应字段标准化测试通过
- 阶段：`v1-adaptive-fetchers`

### REQ-0001-010 必须提供 Spider 框架核心对象

- 动机：源项目不仅是抓取器，也是完整 crawl framework
- 范围：`Request`、`Scheduler`、`CrawlerEngine`、`SessionManager`、`Checkpoint`、`CrawlResult`
- 非目标：不做分布式集群调度器
- 验收口径：镜像 `tests/spiders/*.py` 的 TS 合同测试通过；断点恢复与调度顺序可验证
- 阶段：`v1-spiders-cli-ai`

### REQ-0001-011 必须提供 Node CLI 与交互式 shell

- 动机：CLI 是源项目对外入口之一，也是调试与落地的重要形式
- 范围：`get/post/put/delete/fetch/stealthy_fetch/extract/shell/install`
- 非目标：不在 Chrome 插件里强行复刻 Node CLI 进程模型
- 验收口径：CLI 快照测试与行为测试通过；帮助文本与错误信息明确
- 阶段：`v1-spiders-cli-ai`

### REQ-0001-012 必须提供 MCP/AI 提取能力

- 动机：源项目已公开 `mcp` 与 AI 提取接口，TS 侧必须有对应路线
- 范围：MCP 服务入口、页面转 AI 友好内容、结构化提取响应模型
- 非目标：不绑定单一模型供应商
- 验收口径：MCP 合同测试通过；结构化响应模型具备类型与运行时校验
- 阶段：`v1-spiders-cli-ai`

### REQ-0001-013 必须建立源项目镜像合同测试矩阵

- 动机：没有镜像测试矩阵，就无法谈“像素级对标”
- 范围：按 `parser/fetchers/spiders/cli/ai/core` 六大域建立 TS 对应测试映射
- 非目标：不要求文件名一比一照抄，但要求能力断言可追溯
- 验收口径：`docs/plan/v1-index.md` 中每条需求都能映射到测试文件与验证命令；断链为不通过
- 阶段：`v1-spiders-cli-ai`

### REQ-0001-014 必须同时兼容 Node 与 Chrome 插件运行时

- 动机：这是用户明确指定的首要约束
- 范围：公共包可被两侧导入；适配层显式声明可用能力与限制；未来 fetcher/spider 设计必须服从此约束
- 非目标：不为了“一个包跑全部环境”而牺牲清晰分层
- 验收口径：`packages/node` 与 `packages/webext` 均有导出测试；任何运行时限制都写入 descriptor，而不是藏在文档之外
- 阶段：`v1-foundation` 起持续执行

## 里程碑定义

- `v1-foundation`：文档矩阵、workspace、运行时 descriptor、`Selector` + CSS 基线
- `v1-parser-core`：XPath、文本查找、导航、handler
- `v1-adaptive-fetchers`：adaptive、静态/动态/stealth fetchers、代理轮换
- `v1-spiders-cli-ai`：spiders、CLI、MCP、合同测试矩阵闭环

## 反作弊条款

- 不允许以“类型定义齐了”“包能 import 了”宣称对标完成
- 不允许用 Node-only 实现伪装成 Chrome 插件兼容
- 不允许只写 smoke test，不写具体行为断言

