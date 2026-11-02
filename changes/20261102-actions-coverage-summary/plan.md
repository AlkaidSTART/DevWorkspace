# 任务计划：在 Actions Summary 展示覆盖率

## 任务目标

让 GitHub Actions 的测试工作流在运行覆盖率后，直接在 `$GITHUB_STEP_SUMMARY` 中显示 statements、branches、functions 和 lines 覆盖率百分比。

## 需要新增或修改的文件

- 修改 `vitest.config.ts`：增加 `json-summary` 覆盖率报告。
- 修改 `.github/workflows/test.yml`：读取 `coverage/coverage-summary.json` 并写入 Actions Summary。
- 新增本目录的 `plan.md` 和 `result.md`：记录本次 MVP 实施与验证结果。

## 实施方案

1. 保留现有 text、json、html、lcov 报告，增加 `json-summary`。
2. 在 Codecov 上传之前增加 Summary 步骤。
3. 使用 Node.js 读取 JSON 报告，避免依赖额外命令行工具。
4. 运行覆盖率和构建，确认报告仍满足 98% 阈值。

## 验证方式

- `pnpm --ignore-workspace run test:coverage`
- 确认 `coverage/coverage-summary.json` 存在并包含四项百分比。
- `pnpm --ignore-workspace run build`
- `git diff --check`
