# 任务结果：在 Actions Summary 展示覆盖率

## 目标检查清单

- [x] 增加 JSON Summary 覆盖率报告。
- [x] 在 GitHub Actions Summary 中展示四项覆盖率。
- [x] 保留 Codecov 上传步骤和覆盖率门禁。
- [x] 完成本地覆盖率与构建验证。

## 完成内容

- `vitest.config.ts` 增加 `json-summary` reporter。
- `test.yml` 增加 Node.js Summary 步骤，读取 `coverage/coverage-summary.json`。
- Codecov 上传步骤未改变。

## 验证结果

- [x] `pnpm --ignore-workspace run test:coverage`：2 个测试通过，四项覆盖率均为 100%。
- [x] `coverage/coverage-summary.json`：成功生成，包含 statements、branches、functions、lines。
- [x] `pnpm --ignore-workspace run build`：通过。
- [x] `git diff --check`：通过。

## 达成目的

GitHub Actions 运行完成后，测试工作流 Summary 会直接显示四项覆盖率、covered 数量和 total 数量，同时 Codecov 继续负责外部报告和 patch 门禁。
