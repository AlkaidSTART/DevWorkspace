# DevWorkspace 项目开发指引

## MVP 任务流程

- 每次收到新的用户需求后，将其视为一个独立的小型 MVP 任务。
- 在开始修改代码或项目文件之前，必须在根目录 `changes/` 下创建本次任务的记录目录，目录名使用 `YYYYMMDD-简短任务名` 格式。
- 每个任务目录必须包含以下两个文件：
  - `plan.md`：记录任务目标、需要新增或修改的文件、实施方案、边界和验证方式。
  - `result.md`：使用 checklist 记录任务目标、已完成内容、验证结果和最终达到的目的。
- 实施过程中及时更新 `result.md`；任务结束前确认 checklist 与实际变更一致。
- 不要把不同用户需求混在同一个 `changes/` 任务目录中。

## 项目概况

- 前端使用 React、TypeScript 和 Vite。
- 桌面端使用 Tauri，Rust 代码位于 `src-tauri/`。
- 优先复用现有组件、样式和项目结构，避免无关重构。

## 构建与验证

- 使用 pnpm 作为唯一包管理器；依赖安装使用 `pnpm install --frozen-lockfile`。
- 启动开发环境：`pnpm run dev`
- 执行类型检查和生产构建：`pnpm run build`
- 运行测试：`pnpm test -- --run`
- 生成覆盖率报告：`pnpm run test:coverage`
- 覆盖率要求为 lines、functions、branches、statements 均不低于 98%。
- 修改 Rust/Tauri 相关代码时，按改动范围补充对应的 Tauri 检查。

## 修改要求

- 先阅读相关文件和现有实现，再进行精确修改。
- 保持 TypeScript 类型安全；不要用无理由的 `any` 或静默错误处理绕过问题。
- 与本次需求直接相关的文档应同步更新。
- 完成后运行最小但足以覆盖改动的验证命令，并在 `changes/<任务>/result.md` 中记录结果。
- GitHub Actions 使用 Codecov 检查覆盖率；`CODECOV_TOKEN` 只能配置为 GitHub Actions Secret，不得写入代码、文档或日志。
- 合并到 `main` 前必须通过测试、Codecov 及仓库分支保护规则；非 `main` 分支的拉取请求可启用 GitHub 自动合并，但不得绕过 required checks。