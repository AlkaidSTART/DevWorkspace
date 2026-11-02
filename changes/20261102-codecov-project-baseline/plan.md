# 任务计划：解除首次 Codecov project 基线阻塞

## 任务目标

解决 PR #1 中 `codecov/project` 因 `main` 尚无覆盖率基线而持续 pending 的问题，同时保留覆盖率门禁。

## 需要新增或修改的文件

- 新增 `codecov.yml`：声明 project 和 patch 覆盖率目标为 98%。
- 修改 GitHub 仓库规则集：首次基线建立前暂不要求 `codecov/project`，继续要求 `codecov/patch` 和测试。
- 修改本目录的 `result.md`：记录处理结果和后续恢复 project 门禁的步骤。

## 实施方案

1. 增加 Codecov 98% project/patch 配置。
2. 将当前规则集中的 `codecov/project` 暂时移除，避免首次接入死锁。
3. 保留 `codecov/patch` 和 `test` required checks。
4. 合并 PR #1 后，main 分支产生基线报告，再将 `codecov/project` 加回 required checks。

## 边界

- 不修改或读取 `CODECOV_TOKEN`。
- 不降低本地 Vitest 的四项 98% 阈值。
- 这是首次基线建立的临时过渡，不是永久取消 project 覆盖率门禁。
