# Agent Note: bun runtime support for the published dsh CLI

Status: implemented

[English](2026-08-14-bun-runtime-support-for-the-dsh-cli.md) | 中文

## Problem

`bunx @deepseek-ai/dsh web` 是已发布 CLI 在 bun 标准环境下的自然免安装启动方式，但它会失败：在 bun 下启动 web profile 会抛出 `Export named 'stripTypeScriptTypes' not found in module 'node:module'`（code-runtime 入口的静态导入）；修掉之后又出现 `Cannot find module '@deepseek-ai/dsh-client-ui-directory-picker-browse' from '…/loader/src/config/tree.ts'`（裸插件 specifier 从 loader 自身位置解析，而不是从配置目录解析）以及 `--expose-internals is required for HMR service`（仅监听的配置热重载挂载要求 Node 内部模块 loader）。另外，仓库的 TypeScript 源码把 `declare` 当作合法标识符使用；bun 的 TS 解析器会拒绝它，导致源码树在 bun 下运行（tsconfig `paths` 把 import 指向 `src/`）直接解析失败。

## Decision

已发布的 dsh 系列现在可以在 bun 运行时下运行。`bunx --bun @deepseek-ai/dsh web`（bun 运行时——普通 `bunx` 默认用系统 Node 执行 bin，那条路径本来就能用）可以启动 web profile 并对外提供浏览器 UI；`--version` 与应用 `--help` 均可用；已用 bun 运行时对打包安装流程做了端到端验证（见 Testing）。

**没有内部 loader 时的裸插件解析。** Node 的内部 `ModuleLoader` 会把裸 import 限定在 `ctx.baseUrl`（配置／profile 目录，以及修复后的 `profiles/node_modules` 回退）；bun 的 `node:module` polyfill 不导出内部 loader，因此 loader 的回退分支现在先用 `createRequire(baseUrl).resolve(name)` 从 `ctx.baseUrl` 解析裸名称，再导入解析出的文件 URL（[vendored `tree.ts` 修改](../../../../vendor/README.md)，修改 #19）。`node:module`／`node:url` 的导入是惰性的（在回退分支内 `await import()`），因为该入口同时是浏览器 client 入口：顶层 node 内建导入会破坏 web 应用的 vite 构建（它会把 loader 浏览器化，`node:module` 在 `apps/web/vite.config.ts` 中被别名到抛错 stub）；浏览器永远不会执行裸名称分支。app-boot 的封闭运行时覆盖（`HostResolvedRootInclude`，当嵌入方传入 `bareModuleBaseUrl` 时使用）也以同样方式从该宿主基址解析裸名称，而不再委托给 loader 位置的回退。

**没有内部 loader 时的 HMR 仅监听模式。** 对内部 loader 的要求被限定在已配置的模块根：`root: []`（即 dsh CLI 的仅监听式用户 patch 层热重载）不再抛错，初始化时的 externals 收集在没有 loader 时会跳过（[vendored `hmr` 修改](../../../../vendor/README.md)，修改 #20）。模块监听路径保持不变，仍由「有模块根必有内部 loader」这一不变量守护。

**code-runtime 的类型剥离回退。** `dsh-code-runtime-worker-thread` 在加载时解析一次剥离器：Node 下使用 `node:module` 的 `stripTypeScriptTypes`（在导出它的地方），否则使用 amaro 的 WASM `strip-only` 转换（bun），并新增为依赖。两者共享本 seam 的契约——只支持可擦除语法、输出保持字节位置不变、`enum`／namespace 作为程序失败被拒绝——amaro 抛出的普通诊断对象会归一化为 `Error`。剥离解析是可注入的 seam（`resolveStripper`），带单元测试；Node 永远不会加载 amaro。

**bun 下的 computeMs 与 pipe 捕获。** bun 的 `worker_threads` 不提供事件循环占用率（其 stub 恒报全 0），因此在 bun 下会跳过忙碌时间轮询——剩余预算为墙钟上限与输出上限——服务挂载时记录一条警告。bun 也不提供 Worker 捕获流（`stdout`／`stderr` 选项返回 null），因此宿主侧的原生写入兜底只在流存在时注册；worker 侧 bootstrap 补丁仍会捕获 JS 级写入，未捕获的原生写入会落到宿主自己的 stdio。

**`declare` 标识符改名。** web 树中 `llm-pi-ai` 的局部函数 `declare`（TypeScript 中的合法标识符）改名为 `declareProvider`；bun 的解析器把 `declare` 视为保留字，导致源码树在 bun 下每次启动都会解析失败。

## Alternatives considered

**在 bun 下跳过仅监听式 HMR 挂载。** 表面上更省事，但会静默丢失 `cordis.patch.yml` 编辑热重载这一已文档化的契约；vendored 放宽只需两行守卫即可保住该契约。

**为 code-runtime 使用完整 TypeScript 转换器（sucrase、`Bun.Transpiler`）。** 会通过编译来接受 `enum`／namespace，静默改变「仅可擦除语法、不可擦除语法属于程序失败」这一文档化契约；amaro 的 `strip-only` 正是 Node 内置剥离器所包装的实现，语义完全一致。

**保留从 loader 位置 `import(name)` 的裸导入回退。** 只有在宿主安装把所有插件扁平提升到 loader 旁边时才可用（扁平 npm／bun 布局）；在 pnpm 的隔离布局下——以及对照「裸名称从配置目录解析」的文档化契约——它会失败。从 `baseUrl` 解析与内部 loader 的行为对所有嵌入方一致。

**为 bun 单独写一个 CLI 入口脚本。** 一旦 loader 与 code-runtime 与运行时无关，就无需任何产品改动；第二个入口会把 bin 表面拆成两种模式。

## Consequences

- `bunx --bun @deepseek-ai/dsh web` 与 `bunx dsh web`（bun 全局安装；bunx 本身默认使用系统 Node，那条路径同样可用）在 bun 运行时下运行；Node 行为不变（内置剥离器、真实 computeMs 轮询、pipe 捕获兜底都走原路径）。
- 两个 vendored 包新增了已记录的本地修改（loader #19、hmr #20）；同步流程必须重新应用它们。
- `dsh-code-runtime-worker-thread` 新增 `amaro` 依赖（WASM 剥离器，只在没有内置函数的运行时加载）。
- bun 下：`computeMs` 不生效（由墙钟上限兜底），绕过补丁 stream 槽的原生级 worker 写入不会进入运行日志。
- 仓库自己的源码树现在也能在 bun 下运行（tsconfig-paths 开发流程），因为 `llm-pi-ai` 已可解析。

## Testing

- `resolveStripper` 单元测试：优先内置函数、amaro strip-only 回退、诊断归一化、两种剥离器都缺失时报错。
- 在 bun 运行时下运行打包后的 `code-runtime`：可擦除程序（绑定＋日志）、`enum` 拒绝且消息规范、墙钟上限生效。
- 在 bun 运行时下从仓库（打包 bin）以及从打包的 dsh 与 vendor 发布系列（221＋9 个 tarball，全新 `bun install`）启动 `dsh web`：HTTP 200，应用 HTML 与资源可访问，`--version`／`--help` 正确。bin 直接用 `bun` 执行（bunx 默认使用系统 Node，因此直接运行才是 bun 运行时的证据）。
- 发布前用 bun 安装需要 `overrides` 把每个系列 tarball 钉住：bun 会从 registry 解析已装包的传递 `devDependencies`，且不会用直接的 `file:` 依赖满足传递范围；发布后的 registry 状态无需这些即可解析。node-pty 的 `node-gyp` 构建需要 PATH 上有 `node-gyp`（npm 自带，bun 不带）。
