# Scrapling TypeScript

`Scrapling TypeScript` 的目标不是做一个“长得像 Scrapling 的 TypeScript 库”，而是把 `E:\development\Scrapling` 的公开能力体系，按 TypeScript 语义完整搬到两个运行时：

- `Node`
- `Chrome 插件`

项目当前采用 `pnpm workspace` 组织，并严格遵循塔山开发循环：**愿景 → PRD → 计划 → TDD → 验证 → 回填追溯 → commit + push**。

## 仓库结构

- `packages/core`：跨运行时公共契约、解析器入口、共享能力描述
- `packages/node`：Node 适配层
- `packages/webext`：Chrome 插件适配层
- `docs/prd`：愿景与 PRD
- `docs/plan`：版本化计划、追溯矩阵与里程碑

## 当前进度

已完成的首个 slice：

- 建立 `docs/prd` 与 `docs/plan` 文档矩阵
- 建立 `pnpm workspace` + `core/node/webext` 三层骨架
- 建立运行时能力描述：显式区分 Node 与 Chrome 插件能力边界
- 落下第一个 parser baseline：`Selector` 支持 HTML 构建、CSS 查询、属性读取、文本读取与 HTML 输出

正在推进的第二个 slice：

- `Selector` 的文本查找与正则查找
- 父子兄弟祖先导航
- `TextHandler` 与 `AttributesHandler` 基线
- XPath 仍在下一刀中

## 关键文档

- 愿景：`docs/prd/VISION.md`
- 主 PRD：`docs/prd/PRD-0001-scrapling-parity.md`
- v1 索引：`docs/plan/v1-index.md`
- foundation 计划：`docs/plan/v1-foundation.md`
- parser-core 计划：`docs/plan/v1-parser-core.md`

## 开发

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

## 设计原则

- 公共 API 先于运行时实现
- `core` 不直接知道 Node/Chrome 插件细节
- 运行时限制必须显式声明，不允许静默降级
- 不用“差不多可用”冒充源项目对标完成

## 当前里程碑状态

- `M0 Foundation`：已完成
- `M1 Parser Core`：进行中
- `M2 Adaptive + Fetchers`：待开始
- `M3 Spiders`：待开始
- `M4 CLI + MCP`：待开始
