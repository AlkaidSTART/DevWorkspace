# DevWorkspace 技术选型文档

> **项目名称：** DevWorkspace（暂定）  
> **文档类型：** 技术选型 / 技术架构决策记录（Technology Selection）  
> **版本：** v0.1  
> **对应产品文档：** DevWorkspace PRD v0.2  
> **产品形态：** Local-first AI 开发工作台  
> **核心技术组合：** Tauri 2 + React + TypeScript + Monaco Editor + Rust + SQLite + Git CLI + Agent Runtime

---

## 1. 文档目标

本文档明确 DevWorkspace 的技术栈、模块边界、关键技术决策和 MVP 实施约束，作为后续 TDD、工程初始化和 AI Coding 开发的依据。

本项目不是从零实现完整 IDE，而是围绕以下核心闭环构建桌面开发工作台：

**打开项目 → 编辑代码 → 管理 Git → 自动 Snapshot → 使用 Agent 修改 → 审查 Diff → 恢复或 Commit。**

技术选型优先级：

1. 本地可靠性与数据安全。
2. 与现有开发工具和 Git 工作流兼容。
3. 模块边界清晰，便于独立测试和替换。
4. MVP 实现成本可控。
5. 为后续 LSP、插件、远程同步和多 Agent 留出扩展点。

## 2. 总体技术选型

| 层级 | 推荐技术 | 用途 | MVP 决策 |
|---|---|---|---|
| 桌面容器 | Tauri 2 | 窗口、系统集成、打包、权限控制 | 采用 |
| 前端框架 | React + TypeScript | 工作台 UI | 采用 |
| 构建工具 | Vite | 前端开发与构建 | 采用 |
| 编辑器 | Monaco Editor | 代码编辑、Diff | 采用 |
| 样式 | Tailwind CSS | UI 样式与布局 | 推荐 |
| 前端状态 | Zustand | 工作区、面板、任务等 UI 状态 | 推荐 |
| 服务端核心 | Rust | 文件监听、快照、Git 适配、任务编排 | 采用 |
| 桌面通信 | Tauri Commands + Events | 前后端请求与事件推送 | 采用 |
| 文件监听 | `notify` | 捕获文件系统变化 | 采用 |
| 内容哈希 | BLAKE3 | 内容寻址与去重 | 采用 |
| 元数据存储 | SQLite | 项目、快照、任务、事件元数据 | 采用 |
| 文件内容存储 | 本地 Blob Store | 保存快照文件内容 | 采用 |
| Git 集成 | 系统 Git CLI | Git 命令执行与兼容性 | 采用 |
| Agent | 自建轻量 Agent Runtime | 模型调用、工具循环、权限审批 | 采用 |
| 终端 | PTY + 系统 Shell | 集成终端 | MVP 基础能力 |
| 测试 | Vitest + Rust tests | 前端与 Rust 单元测试 | 采用 |
| E2E | Playwright | 桌面 UI 关键流程验证 | 后续接入 |

### 2.1 技术栈原则

- UI 与核心引擎分离，快照和 Git 核心能力不能依赖 React 组件生命周期。
- Rust 核心模块通过稳定的命令和事件接口暴露能力，不允许前端直接操作 SQLite 或 Blob Store。
- Git 操作优先调用系统 Git，避免重新实现 Git 协议与凭据体系。
- Snapshot 与 Git 数据完全分离，Snapshot 不写入 `.git/objects`。
- Agent 通过受控工具接口操作项目，不能绕过权限系统。
- 关键数据操作必须可测试、可恢复、可审计。

---

## 3. 桌面端与前端技术

### 3.1 Tauri 2

**决策：采用 Tauri 2 作为桌面应用容器。**

选择原因：

- 使用系统 WebView 承载 React UI，桌面应用体积和资源占用通常比 Electron 更轻。
- Rust 与 Snapshot Core 使用同一技术栈，减少跨语言边界。
- 支持文件系统、进程、窗口、系统托盘等桌面能力。
- 适合 Local-first 应用，不需要自建常驻云端服务。

需要注意：

- Tauri 插件和权限配置需要明确维护，不能给前端无边界的文件系统访问权限。
- Monaco Editor 在不同平台 WebView 中需要做兼容性验证。
- macOS、Windows、Linux 的终端、文件权限、文件监听行为需要分别测试。
- 桌面端升级、签名、公证和自动更新是发布工程的一部分，不应留到最后处理。

### 3.2 React + TypeScript + Vite

**决策：采用 React + TypeScript + Vite。**

建议目录按功能域拆分，而不是将所有组件放在单一目录：

```text
src/
  app/
    App.tsx
    routes/
    providers/
  features/
    workspace/
    editor/
    git/
    timeline/
    snapshot/
    agent/
    terminal/
    settings/
  components/
    layout/
    ui/
  services/
    tauri/
  stores/
  hooks/
  types/
```

约束：

- 开启 TypeScript strict 模式。
- 禁止无理由使用 `any`；跨边界数据使用显式 DTO 和运行时校验。
- UI 状态和后端业务状态分开管理。
- 前端不得把 SQLite 表结构当作公共 API；通过 DTO 访问。
- 复杂业务逻辑放在 Rust Core 或独立前端 domain service 中，不堆进 React 组件。

### 3.3 状态管理：Zustand

推荐 Zustand 管理前端交互状态，例如：

- 当前项目与当前工作区。
- 打开的编辑器标签页。
- 左右侧栏、底部面板状态。
- 当前选中的 Git 文件与 Diff。
- Agent 当前任务状态和消息流。
- 时间线筛选条件。

不建议把所有文件内容、快照 manifest、Git 状态全量复制到全局 Store。大数据和权威状态应由 Rust Core 管理，前端按需读取并缓存。

### 3.4 Monaco Editor

**决策：采用 Monaco Editor。**

主要用途：

- 源码编辑与保存。
- 多标签页。
- 语法高亮、行号、基础查找。
- 只读 Diff Editor。
- 后续接入 LSP 诊断、补全和跳转能力。

实施注意：

1. Monaco Worker 配置需要适配 Vite 与 Tauri 打包环境。
2. 编辑器模型 URI 必须与项目相对路径建立稳定映射。
3. 文件重命名、关闭标签页和项目切换时，正确释放不再使用的模型。
4. 二进制文件、超大文件和不支持的编码必须有明确提示，不能全部当作普通文本打开。
5. MVP 不实现完整 VS Code 扩展 API，也不承诺所有语言都有智能补全。

**候选替代：** CodeMirror 6。其体积和可定制性较好，但本产品对代码编辑和 Diff 工作流依赖较深，Monaco 的编辑器能力更贴近预期，因此 MVP 采用 Monaco。

---

## 4. Rust Core 架构

### 4.1 职责

Rust Core 是产品的本地业务核心，负责：

- 项目生命周期与路径管理。
- 文件监听和目录一致性校验。
- Snapshot 创建、查询、Diff 和恢复。
- Blob 内容存储与清理。
- Git CLI 调用和结果解析。
- Agent 工具执行、权限检查和任务状态管理。
- SQLite 事务和本地数据目录管理。
- 向 UI 推送进度、变更和任务事件。

### 4.2 推荐模块

```text
src-tauri/
  src/
    main.rs
    lib.rs
    commands/
      project.rs
      editor.rs
      git.rs
      snapshot.rs
      timeline.rs
      agent.rs
      terminal.rs
    core/
      project/
      filesystem/
      snapshot/
      blob_store/
      diff/
      git/
      agent/
      permissions/
      storage/
      events/
    db/
      migrations/
      repository/
    error/
    models/
```

建议以业务模块组织 Rust crate 或 module。MVP 初期可以先使用单 Rust crate，避免过早拆分多个 crate；当模块边界稳定后再拆分。

### 4.3 前后端通信

使用 Tauri Commands 处理请求/响应，使用 Events 推送持续事件。

适合 Command 的操作：

- `project_open`
- `project_list`
- `git_status`
- `git_stage`
- `git_commit`
- `snapshot_create`
- `snapshot_list`
- `snapshot_diff`
- `snapshot_restore_preview`
- `snapshot_restore`
- `agent_start`
- `agent_cancel`

适合 Event 的事件：

- `filesystem.changed`
- `snapshot.progress`
- `snapshot.created`
- `git.status_changed`
- `agent.message`
- `agent.tool_started`
- `agent.permission_required`
- `agent.tool_finished`
- `agent.task_updated`

接口约束：

- Command 输入和输出使用明确的序列化 DTO。
- 统一错误结构，区分参数错误、文件系统错误、Git 错误、权限拒绝和内部错误。
- 长时间任务返回 task ID，通过 Event 推送进度；不要阻塞 UI 请求。
- Event 应携带 project ID、task ID 或 snapshot ID，避免多项目事件串线。
- 前端监听器在组件卸载或项目切换时必须清理。

---

## 5. Git 技术选型

### 5.1 决策：系统 Git CLI 优先

Git 的核心操作通过用户机器安装的 Git CLI 执行，由 Rust Git Adapter 统一封装。

选择 Git CLI 的原因：

- 复用用户已有的 Git 配置。
- 更容易兼容 SSH Agent、Credential Helper、签名提交和 Git hooks。
- 与用户在终端中的 Git 行为保持一致。
- 不需要在 MVP 阶段自行实现远程协议和复杂凭据流程。

`git2/libgit2` 可作为后续特定能力的补充，但不作为 MVP 全部 Git 操作的唯一后端。

### 5.2 Git Adapter 职责

```text
GitAdapter
  ├── discover_repository()
  ├── get_status()
  ├── get_diff()
  ├── stage(paths)
  ├── unstage(paths)
  ├── commit(message)
  ├── list_branches()
  ├── create_branch(name)
  ├── checkout_branch(name)
  ├── fetch()
  ├── pull()
  └── push()
```

MVP 第一阶段优先实现：

- 仓库识别。
- 当前分支和文件状态。
- 工作区 Diff 与暂存区 Diff。
- Stage / Unstage。
- Commit。
- 本地分支列表、创建和切换。

Pull / Push 可在本地闭环稳定后接入。

### 5.3 命令执行安全

- 使用进程参数数组传递参数，避免把用户输入拼接成 Shell 字符串。
- Git 命令在项目根目录执行。
- 对可能修改工作区的命令进行状态检查。
- 分支切换前检查未提交变更，并向用户展示风险。
- 捕获退出码、stdout、stderr 和耗时。
- 对路径、提交信息和远程地址进行边界校验。
- 不直接读写 `.git` 内部文件来伪造 Git 操作。

### 5.4 Git 状态解析

优先使用 Git 提供的机器可读输出，例如 porcelain 格式，而不是解析面向人的普通终端文本。对路径中的空格、换行、非 ASCII 字符和重命名状态进行测试。

---

## 6. Snapshot 技术选型

### 6.1 文件监听：notify + reconcile

采用 Rust `notify` 监听文件系统事件，并定期扫描目录做 reconcile。

原因：

- 文件系统事件可能合并、丢失或乱序。
- 编辑器常用临时文件写入后原子替换的方式保存。
- 大型项目中依赖目录和构建目录会产生大量噪声事件。

处理流程：

```text
Filesystem Event
      |
      v
Normalize Path
      |
      v
Ignore Rules
      |
      v
Debounce / Coalesce
      |
      v
Wait Until File Stable
      |
      v
Read + Hash (BLAKE3)
      |
      v
Compare With Latest Manifest
      |
      v
Create Snapshot If Needed
```

必须覆盖：

- 新增、修改、删除、重命名。
- 临时文件和原子替换。
- 大文件与二进制文件。
- 符号链接和权限位。
- 应用休眠、重启和监听器重建。
- 监听失败后的全量或增量目录校验。

### 6.2 内容哈希：BLAKE3

**决策：采用 BLAKE3。**

用途：

- 计算文件内容哈希。
- 以内容哈希作为 Blob 标识。
- 快速判断文件内容是否变化。
- 实现跨快照内容去重。

逻辑示例：

```text
hash = BLAKE3(file_bytes)
blob_path = blob_root / hash_prefix / hash
```

注意：

- 哈希只负责内容身份，不代表文件路径身份。
- 文件权限、可执行位、符号链接目标等元信息需独立记录。
- 对超大文件采用流式读取，避免一次性加载到内存。
- Blob 写入后应验证文件长度和哈希。

### 6.3 Snapshot 存储：SQLite + Blob Store

**决策：SQLite 存元数据，文件系统存 Blob 内容。**

不建议把所有文件内容直接塞进 SQLite BLOB，也不建议把 Snapshot 数据写进 Git 对象库。

建议数据目录：

```text
<AppData>/DevWorkspace/
  data/
    workspace.sqlite
    blobs/
      ab/
        abcd...   # 按哈希寻址
    logs/
    temp/
```

建议项目数据与项目目录分离，避免删除项目时误删历史记录。

### 6.4 快照模型

一个 Snapshot 由元数据和完整文件清单构成：

```text
Snapshot
  id
  project_id
  kind              # automatic / manual / agent_before / agent_after / restore_guard
  created_at
  reason
  git_head
  manifest_version

SnapshotFile
  snapshot_id
  relative_path
  blob_hash
  size
  file_mode
  file_kind
```

关键原则：

- 每个快照的 manifest 描述完整文件状态。
- Blob 按内容哈希复用。
- 删除文件通过后续快照 manifest 中缺失路径表达。
- 任意快照可以独立恢复，不依赖逐个重放前序快照。
- 清理 Blob 前必须检查是否仍被任何保留快照引用。

### 6.5 快照触发策略

MVP 建议提供：

- 文件变化防抖：短时间内连续写入先合并。
- 自动快照最小间隔：避免每次键入都生成完整 Snapshot 记录。
- 手动快照：用户主动创建并可命名。
- Agent 前后快照：不受普通自动快照间隔限制。
- 恢复保护快照：执行恢复前强制创建。

具体时间窗口应通过真实项目测试确定，不在技术选型阶段写死。

### 6.6 恢复策略

恢复不能简单地直接覆盖目录。

推荐流程：

1. 读取目标 Snapshot manifest。
2. 扫描当前工作区并生成差异计划。
3. 向 UI 返回新增、覆盖、删除文件列表。
4. 用户确认。
5. 创建当前状态保护快照。
6. 在临时目录准备恢复内容。
7. 对目标文件执行安全写入和原子替换。
8. 删除目标快照中不存在的多余文件（仅限受管理范围）。
9. 校验文件数量、路径和内容哈希。
10. 写入恢复事件。

恢复操作不得隐式执行 Git reset、checkout 或改写 Commit 历史。

---

## 7. Agent 技术选型

### 7.1 决策：自建轻量 Agent Runtime

MVP 建议先实现一个可控的单 Agent Runtime，而不是一开始接入庞大、多 Agent 的编排框架。

Runtime 负责：

- 模型供应商适配。
- 消息与上下文管理。
- Tool Calling 循环。
- 工具参数校验。
- 权限审批。
- 任务取消与超时。
- 工具调用日志。
- 任务开始/结束 Snapshot 关联。

模型调用可以通过统一 Provider Adapter 抽象，避免业务逻辑绑定某一个模型厂商。

### 7.2 Agent 架构

```text
Agent UI
   |
   v
Agent Orchestrator
   |
   +---- Model Provider Adapter
   |
   +---- Context Builder
   |
   +---- Tool Registry
   |       |
   |       +---- read_file
   |       +---- write_file
   |       +---- list_files
   |       +---- search_files
   |       +---- run_command
   |
   +---- Permission Manager
   |
   +---- Task Store / Event Stream
   |
   +---- Snapshot Service
```

### 7.3 MVP 工具范围

| Tool | 能力 | 权限要求 |
|---|---|---|
| `list_files` | 查看项目文件树 | 工作区范围内默认允许 |
| `read_file` | 读取文件 | 工作区范围内默认允许，敏感文件按规则限制 |
| `search_files` | 搜索项目文本 | 工作区范围内默认允许 |
| `write_file` | 创建或修改文件 | 允许写入工作区；可配置确认策略 |
| `delete_file` | 删除文件 | 默认需要确认 |
| `run_command` | 执行项目命令 | MVP 默认需要用户审批 |

### 7.4 Agent 安全边界

- 所有文件路径先规范化，再检查是否位于项目根目录允许范围内。
- 防止 `../` 路径穿越和符号链接逃逸。
- 命令执行不允许把模型输出直接拼接进 Shell。
- 高风险命令（递归删除、磁盘格式化、权限修改等）必须拒绝或强制确认。
- 默认不向模型发送 `.env`、私钥、凭据文件和用户配置排除的内容。
- API Key 使用系统安全存储能力，不写入普通日志和项目文件。
- 工具调用记录参数摘要和执行结果，敏感内容脱敏。
- Agent 任务开始和结束时由系统创建 Snapshot，不依赖模型主动请求。
- Agent 不能自动执行 Git Commit、Push 或分支删除，除非未来产品明确提供单独授权流程。

### 7.5 Agent SDK 的取舍

MVP 不急于绑定某一个 Agent SDK。先定义内部的：

- `ModelProvider`
- `AgentMessage`
- `ToolDefinition`
- `ToolCall`
- `ToolResult`
- `AgentTask`
- `PermissionRequest`

当需要支持复杂工具协议或特定模型能力时，再评估接入官方 SDK 或成熟 Agent 框架。这样可以避免 SDK 的数据模型、版本变化和运行时假设渗透整个产品。

---

## 8. 集成终端技术

MVP 使用系统 Shell + PTY 提供集成终端。

要求：

- 默认工作目录为当前项目根目录。
- 支持创建、关闭和切换终端实例。
- 终端进程生命周期由 Rust 管理。
- UI 与 PTY 之间使用流式事件传输输入和输出。
- 终端命令与 Agent 的 `run_command` 工具分开管理权限和审计。
- 终端关闭或应用退出时，按策略清理子进程，避免孤儿进程。

Agent 命令执行不应直接复用 UI 终端的交互会话；两者应有独立的执行上下文和权限策略。

---

## 9. 数据库与逻辑表设计

建议使用 SQLite，配合迁移工具管理 Schema。数据库仅保存元数据，文件正文放在 Blob Store。

### 9.1 核心表

| 表 | 主要字段 | 说明 |
|---|---|---|
| `projects` | id, name, root_path, created_at | 项目 |
| `snapshots` | id, project_id, kind, reason, git_head, created_at | 快照 |
| `snapshot_files` | snapshot_id, path, blob_hash, size, mode | 快照文件清单 |
| `blobs` | hash, size, storage_path, created_at | 内容对象索引 |
| `git_events` | id, project_id, commit_sha, branch, message, created_at | Git 时间线节点 |
| `agent_tasks` | id, project_id, status, prompt, started_at, finished_at | Agent 任务 |
| `agent_task_snapshots` | task_id, before_snapshot_id, after_snapshot_id | 任务快照关系 |
| `timeline_events` | id, project_id, event_type, ref_id, occurred_at | 统一时间线 |
| `settings` | key, value, updated_at | 本地配置 |

### 9.2 数据一致性

- SQLite 使用事务维护元数据关系。
- Blob 文件先写入临时路径，校验后原子移动到正式路径。
- 处理“Blob 已写入但数据库事务失败”和“数据库记录存在但 Blob 缺失”两类崩溃场景。
- 启动时执行轻量一致性检查，必要时提供修复任务。
- 数据库迁移必须可重复验证；升级前应备份元数据。

---

## 10. Diff 与时间线设计

### 10.1 Diff 类型

至少区分：

1. 当前工作区 vs Git HEAD。
2. 当前工作区 vs Git 暂存区。
3. Snapshot A vs Snapshot B。
4. Agent 任务前 Snapshot vs 任务后 Snapshot。
5. Snapshot vs 当前工作区。

文本文件使用 Monaco Diff Editor。二进制文件只展示文件状态、大小和哈希变化，不尝试按文本解析。

### 10.2 统一时间线

时间线统一呈现：

- 自动 Snapshot。
- 手动 Snapshot。
- Agent 开始/结束节点。
- Git Commit。
- 恢复事件。

每种节点保留自己的来源信息和关联 ID。时间线只是统一展示层，不把 Git Commit 和 Snapshot 混成同一种数据对象。

---

## 11. 测试策略

### 11.1 Rust Core 单元测试

重点覆盖：

- 路径规范化与忽略规则。
- BLAKE3 内容哈希。
- Blob 去重与引用计数。
- Manifest 生成和比较。
- Snapshot 创建和读取。
- 恢复差异计划。
- Git 状态解析。
- Agent 工具权限判断。

### 11.2 集成测试

使用临时目录创建真实 Git 仓库，验证：

- 未跟踪、修改、删除、重命名状态。
- Stage / Unstage / Commit。
- 分支创建和切换。
- Snapshot 对 Git 操作前后工作区状态的捕获。
- 恢复不会意外修改 `.git` 历史。
- 应用异常中断后数据能够重新校验。

### 11.3 前端测试

- Vitest：状态管理、DTO 解析、组件逻辑。
- React Testing Library：关键交互。
- Playwright：项目打开、编辑保存、Git Commit、Snapshot 恢复、Agent 任务审查等 E2E 流程。

### 11.4 必须做的压力测试

- 数千至数万文件的项目扫描。
- 大量连续文件事件。
- 大文件和二进制文件。
- 高频保存与原子替换。
- Snapshot 数量持续增长。
- 恢复过程中强制退出应用。
- Agent 长任务、工具超时和用户取消。
- 多项目同时打开或快速切换。

---

## 12. 安全、隐私与权限

### 12.1 本地优先

- 项目源码、Snapshot Blob 和 SQLite 默认只存储在本地。
- 不要求账号登录即可使用本地编辑、Git 和 Snapshot 功能。
- 不默认上传项目文件、快照或任务历史。
- 使用云模型时，只向模型发送完成当前任务所需且经过权限控制的上下文。

### 12.2 敏感数据

默认建议排除或提示用户检查：

```text
.env
.env.*
*.pem
*.key
id_rsa
id_ed25519
credentials.*
secrets/
```

排除规则需要支持项目级配置和全局配置。必须提供规则预览，避免用户误以为敏感文件已被保护。

### 12.3 权限分层

建议至少分为：

- 读取工作区。
- 写入工作区。
- 删除文件。
- 执行命令。
- 访问工作区外路径。
- 访问网络。
- 使用 Git 远程操作。

MVP 对工作区外访问和高风险命令默认拒绝或逐次确认。

---

## 13. 性能与资源目标

以下作为 MVP 的工程目标，需通过实际项目基准测试验证，不应视为未经测试的性能承诺：

- 空闲状态不进行高频全目录扫描。
- 文件监听事件应合并处理，避免每次键入都创建快照。
- 大文件哈希采用流式读取。
- Blob 去重不要求把整个文件读入前端内存。
- 时间线采用分页或增量加载。
- Diff 按需计算，避免一次性加载全部历史文件内容。
- 长时间任务提供进度和取消能力。
- 项目索引和快照扫描不得阻塞编辑器交互。

---

## 14. 工程规范与依赖管理

### 14.1 代码质量

- TypeScript 开启 `strict`。
- Rust 使用 `cargo fmt`、`cargo clippy` 和单元测试。
- 重要模块定义清晰的输入、输出和错误类型。
- 避免在 UI 组件中直接编写 Git 命令或文件系统业务逻辑。
- 所有路径操作统一经过路径安全层。
- 关键恢复与存储逻辑必须有故障注入测试。

### 14.2 依赖策略

- 只引入能明确降低实现成本或提高可靠性的依赖。
- 优先选择维护活跃、许可证清晰、跨平台成熟的库。
- 对文件监听、终端、Agent SDK 等关键依赖做 PoC 后再锁定。
- 锁定依赖版本并提交 lockfile。
- 不将未经审查的 Agent 工具插件直接授予文件系统或命令执行权限。

### 14.3 CI

建议 GitHub Actions 至少包含：

- 前端 lint / typecheck / test / build。
- Rust fmt / clippy / test。
- macOS 构建。
- Windows 构建。
- Linux 构建。
- 依赖和许可证检查。

---

## 15. 分阶段实施路线

### Phase 0：技术验证（PoC）

目标：先验证最容易出现技术风险的环节。

PoC 清单：

- Tauri 2 中 Monaco Editor 正常运行和打包。
- Rust `notify` 能正确捕获编辑器保存事件。
- Git CLI 的 porcelain 状态解析覆盖常见文件名。
- BLAKE3 + Blob Store 能完成去重。
- Snapshot manifest 能独立恢复目录。
- Agent 工具调用能经过权限审批并触发前后快照。
- PTY 在目标操作系统可稳定交互。

### Phase 1：工作台骨架

- Tauri + React + TypeScript。
- 项目打开、文件树、Monaco、标签页。
- 基础终端。
- 本地设置与日志。

### Phase 2：Git

- Git Adapter。
- 状态、Diff、Stage / Unstage、Commit。
- 本地分支操作。
- 远程操作后续接入。

### Phase 3：Snapshot Core

- 文件监听与 reconcile。
- 忽略规则。
- BLAKE3 与 Blob Store。
- Manifest、时间线、Diff、恢复保护和校验。

### Phase 4：Agent

- Provider Adapter。
- Agent Runtime。
- Tool Registry 与 Permission Manager。
- 任务前后快照。
- 变更审查和恢复。

### Phase 5：稳定性与发布

- 多平台打包。
- 自动更新与签名。
- 性能优化。
- 故障恢复测试。
- 用户文档与问题反馈机制。

---

## 16. 关键技术决策记录（ADR 摘要）

| 决策 | 结论 | 原因 |
|---|---|---|
| 桌面框架 | Tauri 2 | Rust 集成、资源占用和本地应用定位 |
| 前端框架 | React + TS | 生态成熟，适合复杂工作台 UI |
| 编辑器 | Monaco | 编辑与 Diff 能力符合产品核心需求 |
| Git 实现 | 系统 Git CLI 优先 | 最大化兼容用户已有 Git 环境 |
| Snapshot 存储 | SQLite + Blob Store | 元数据与大文件内容分离，支持内容去重 |
| 内容哈希 | BLAKE3 | 快速内容寻址 |
| 文件监听 | notify + reconcile | 兼顾实时性和最终一致性 |
| Agent | 轻量自建 Runtime | 先掌握权限、快照和任务闭环，避免过早绑定框架 |
| 云端 | MVP 不依赖自建后端 | 本地优先，降低成本和隐私风险 |
| 插件系统 | MVP 不做 | 避免过早引入扩展 API 和安全沙箱复杂度 |

---

## 17. 尚待 PoC 验证的问题

以下事项不应在没有验证前直接视为已解决：

1. Tauri 2 + Monaco 在 macOS、Windows、Linux 的 Worker、字体和大文件表现。
2. `notify` 在不同文件系统和大量文件场景下的事件完整性与资源占用。
3. Windows 上 Git CLI 的路径、编码、凭据和进程管理差异。
4. Rust PTY 方案在三个桌面平台的兼容性。
5. Agent Runtime 对不同模型 Provider 的 Tool Calling 差异。
6. Snapshot 对符号链接、权限位、大小写敏感文件系统和文件锁的处理。
7. 大型项目首次扫描、全量校验和历史恢复的实际耗时。
8. 应用升级时 SQLite Schema 迁移与 Blob Store 兼容策略。

这些问题应通过独立 PoC 和测试数据决定，不要只根据库的 README 或模型建议作最终判断。

---

## 18. 最终建议

DevWorkspace 的技术路线应保持克制：

- **桌面与 UI：** Tauri 2 + React + TypeScript + Monaco。
- **本地核心：** Rust。
- **Git：** 系统 Git CLI 作为兼容性优先的执行层。
- **自动历史：** notify + BLAKE3 + SQLite + 本地 Blob Store。
- **AI：** 轻量 Agent Runtime + Provider Adapter + Tool Permission。
- **终端：** 系统 Shell + PTY。

最重要的工程顺序不是先把所有面板做漂亮，而是先验证三个底层能力：

1. **Snapshot 是否真的可靠：** 能完整捕获、独立恢复、故障后校验。
2. **Git 是否足够兼容：** 能正确处理真实项目中的状态、路径、凭据和分支。
3. **Agent 是否可控：** 文件修改和命令执行有权限边界，任务前后有保护快照。

这三项成立后，再完善工作台 UI 和扩展能力。产品的核心竞争力不是 Monaco 编辑器本身，而是把 **Git、自动快照和 AI Agent** 组合成一个可审查、可恢复的开发闭环。
