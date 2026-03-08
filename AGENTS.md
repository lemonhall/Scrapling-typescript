# Scrapling TypeScript 仓库约定

本文件作用域：仓库根目录及其所有子目录。

## 沟通

- 默认用中文。
- 默认直接推进，不做碎片化小汇报；遇到阻塞、风险、测试失败时再明确说明。

## Shell 与环境

- 默认命令环境为 PowerShell。
- 连续命令用 `;`，不要写 `&&` / `||`。
- 包管理与脚本入口统一使用 `pnpm`。

## 项目目标

- 本项目必须同时面向 `Node` 与 `Chrome 插件` 两类运行时。
- 不允许为了省事把公共 API 偷偷做成 Node-only；运行时差异必须通过适配层显式声明。
- 目标是对标 `E:\development\Scrapling` 的能力面，而不是只做一个“类似库”。

## 开发纪律

- 遵循 `tashan-development-loop`：先 PRD / plan，再实现，再验证，再回填追溯。
- 新功能和修复默认走 TDD：先写失败测试，再实现，再重跑到绿。
- 声称完成前必须执行真实验证：至少包含相关测试、`pnpm build`、`pnpm typecheck` 中与当前切片相关的命令。
- 如果实现范围或验收口径发生变化，先同步 `docs/plan/`，必要时补 ECN。

## Git 习惯

- 本仓库只有一个开发者，不使用 worktree 流程。
- 每一刀都应保持 `commit + push`，提交信息按版本/切片组织。

## 当前结构偏好

- `packages/core`：跨运行时公共契约、解析器、共享模型
- `packages/node`：Node 适配层
- `packages/webext`：Chrome 插件适配层
- `docs/prd` / `docs/plan`：愿景、PRD、计划、追溯矩阵

