# 任务计划：修正 Codecov 仓库标识

## 任务目标

修正 GitHub Actions 中 Codecov 的仓库 slug，使其与实际仓库 `AlkaidSTART/DevWorkspace` 一致，重新触发 PR #1 的覆盖率状态上报。

## 需要修改的文件

- 修改 `.github/workflows/test.yml`：将 Codecov slug 从旧仓库名改为实际仓库名。
- 新增本目录的 `plan.md` 和 `result.md`：记录本次修复。

## 实施方案

1. 确认 GitHub 仓库的 canonical full name。
2. 修改 Codecov Action 的 `slug`。
3. 提交并推送到当前开发分支 `dev`。
4. 检查新的 Actions 运行和 Codecov check 状态。

## 边界

- 不修改 `CODECOV_TOKEN` Secret。
- 不删除 `codecov/project` 或 `codecov/patch` 合并门禁。
- 如果状态仍未回传，需要在 Codecov 中安装/授权 GitHub App。
