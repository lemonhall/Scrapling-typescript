# Scrapling TypeScript

`Scrapling TypeScript` 的目标不是做一个“像 Scrapling 的另一个库”，而是把 `E:\development\Scrapling` 的能力体系按 TypeScript 语义、Node 运行时与 Chrome 插件运行时完整搬下来。

当前仓库采用 `pnpm workspace` 组织，先把文档追溯链和基础骨架搭硬，再按里程碑逐步对齐源项目：

- `packages/core`：跨运行时的核心类型与解析器入口
- `packages/node`：Node 适配层
- `packages/webext`：Chrome 插件适配层
- `docs/prd`：愿景与 PRD
- `docs/plan`：`v1` 版本化计划与追溯矩阵

当前已完成的首个 slice：

- 建立 `tashan-development-loop` 所需文档矩阵
- 建立可构建、可测试、可类型检查的 workspace 骨架
- 落下首个解析器基线：`Selector` + CSS 查询 + 文本/属性基础访问
- 建立 Node / Chrome 插件运行时能力描述

后续执行入口：

- 愿景：`docs/prd/VISION.md`
- PRD：`docs/prd/PRD-0001-scrapling-parity.md`
- v1 索引：`docs/plan/v1-index.md`

