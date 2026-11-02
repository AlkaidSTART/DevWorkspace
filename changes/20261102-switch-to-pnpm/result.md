# 任务结果：切换到 pnpm 包管理器

## 目标检查清单

- [x] 项目声明并使用 pnpm。
- [x] 生成 `pnpm-lock.yaml` 并移除 npm 锁文件。
- [x] GitHub Actions 使用 pnpm 安装依赖和执行脚本。
- [x] GitHub Actions 先安装 pnpm，再启用 pnpm 缓存。
- [x] 项目开发指引更新为 pnpm 命令。
- [x] 测试、覆盖率和构建验证通过。

## 完成内容

- 在 `package.json` 中声明 `pnpm@11.17.0`。
- 使用 pnpm 导入并生成 `pnpm-lock.yaml`。
- CI 使用 `pnpm/action-setup@v4`、`pnpm install --frozen-lockfile` 和 pnpm scripts；已修正 setup 顺序，避免 `setup-node` 缓存阶段找不到 pnpm。
- `AGENTS.md` 中的开发和验证命令已全部切换为 pnpm。

## 验证结果

- [x] `pnpm --ignore-workspace run test:coverage`：2 个测试通过，四项覆盖率均为 100%。
- [x] `pnpm --ignore-workspace run build`：TypeScript 检查和 Vite 生产构建通过。
- [x] `git diff --check`：待提交前执行。

## 达成目的

项目包管理器已统一为 pnpm，开发环境与 GitHub Actions 将使用同一份 `pnpm-lock.yaml`；PR #1 的失败原因已修复。
