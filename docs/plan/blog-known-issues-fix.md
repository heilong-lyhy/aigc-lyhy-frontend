# Blog 已知问题修复计划（前端部分）

> 创建时间：2026-06-14
> 状态：执行中（问题 6 已完成）

---

## 问题总览

| # | 问题 | 优先级 | 根因 | 影响范围 |
|---|------|--------|------|----------|
| 1 | 非 mahiru 的 ADMIN 账户无法使用 Blog Admin | P1 | `useAdminProfile` 使用 `useAsyncQuery({ autoLoad: false })` 但 AdminGuard 未触发 load | Blog Admin 全部管理功能 |
| 2 | 文件管理无法上传文件 | P1 | 上一轮修复已改用原生 fetch + FormData，需验证是否仍有问题 | 文件管理页 |
| 3 | 置顶功能仅在 Blog Admin，展示端未体现排序效果 | P2 | 后端已按 isPinned DESC 排序，前端 PostCard 有置顶标签，但用户感知不明显 | 博客展示端 |
| 4 | 回收站无法正常运作 | P1 | 前端使用 `blogPosts(status: DELETED)` 查询，但后端 `blogPosts` 过滤 `deleted_at IS NULL`，应使用 `blogDeletedPosts` | 回收站页 |
| 5 | 点赞无账号划分 | P1 | `userIdentifier` 硬编码为 `'anonymous'`，所有用户共享同一标识 | 点赞功能 |
| 6 | Blog Admin 仍在 labs 区，未迁入 stable 正式区 | P1 | blog-admin 所有 UI 组件仍在 `labs/blog-admin/`，环境限制为 dev/test，prod 无法使用 | 生产环境 Blog Admin 全部功能 |

---

## 修复前必读规范文档

每个问题修复执行前，必须先阅读以下规范文档，确保修改符合项目架构约束：

### 全局必读（所有问题修复前）

| 文档 | 路径 | 核心关注点 |
|------|------|------------|
| 层模型 | `docs/layer-model.md` | stable/labs/sandbox 三层治理，stable 区细分职责 |
| 依赖规则 | `docs/dependency-rules.md` | 正式区依赖方向、labs 依赖限制、公开 API 规则 |
| Infrastructure 规则 | `docs/infrastructure-rules.md` | 外部技术边界收束、防腐职责、mock 规则 |
| GraphQL Auth 边界 | `docs/project-convention/graphql-ingress-auth-boundary.md` | protected/public 请求语义、authMode 使用 |
| Stable Clean Architecture | `docs/stable-clean/architecture.md` | 第二维分层规则、features/entities 内部结构 |
| Labs 规则 | `docs/labs-rules.md` | labs 模块结构、access list、迁入 stable 规则 |
| 环境暴露 | `docs/environment-exposure.md` | stable/labs/sandbox 在 dev/test/prod 中的暴露语义 |

### 问题专项必读

| 问题 | 额外必读文档 | 关注点 |
|------|-------------|--------|
| 问题 1（ADMIN 权限） | `docs/project-convention/graphql-ingress-auth-boundary.md` | auth 请求模式、token 注入 |
| 问题 2（文件上传） | `docs/infrastructure-rules.md`（重点重读） | infrastructure 收束规则、API adapter 归属 |
| 问题 3（置顶展示） | `docs/stable-clean/architecture.md`（重点重读） | features 内部结构、ui/application/infrastructure 职责 |
| 问题 4（回收站） | `docs/infrastructure-rules.md`（重点重读） | 新增 API adapter 归属 feature/infrastructure |
| 问题 5（点赞账号划分） | `docs/project-convention/graphql-ingress-auth-boundary.md`、`docs/labs-rules.md` | authMode 使用、labs 依赖限制 |
| 问题 6（Blog Admin 迁入 stable） | `docs/labs-rules.md`（重点重读）、`docs/layer-model.md`（重点重读）、`docs/environment-exposure.md`（重点重读）、`docs/dependency-rules.md`（重点重读） | 迁入 stable 规则、stable 区职责、环境暴露语义、依赖方向变化 |

---

## 问题 1：非 mahiru 的 ADMIN 账户无法使用 Blog Admin

### 修复前必读

- [ ] `docs/layer-model.md` — 确认 stable 区权限控制方式
- [ ] `docs/dependency-rules.md` — 确认 pages → features 依赖方向
- [ ] `docs/project-convention/graphql-ingress-auth-boundary.md` — 确认 protected 请求语义

### 根因分析

`AdminGuard` 通过 `useFullUserInfo(accountId)` 获取用户信息并检查 `accessGroup` 是否包含 `ADMIN`。该逻辑本身正确，任何拥有 ADMIN 角色的账户都应通过。

但 `useAdminProfile` 使用了 `useAsyncQuery({ autoLoad: false })`，需要在页面挂载后手动调用 `load()`。如果页面组件未调用 `load()`，则 `data` 为 `null`，导致管理功能无法正常展示数据。

**需要排查的关键点**：
1. `AdminGuard` 的 `useFullUserInfo` 是否正确获取到非 mahiru 账户的 `accessGroup`
2. Blog Admin 各页面是否正确调用了对应 hook 的 `load` 方法
3. 后端 `userInfo` query 是否对非 mahiru 账户正确返回 `accessGroup`

### 修复方案

> 注意：问题 6 完成后，以下文件路径将从 `labs/blog-admin/` 变为 `pages/admin/`。此处先按当前路径描述，问题 6 迁移后需同步更新。

| 文件 | 修改内容 | 规范合规说明 |
|------|----------|-------------|
| `src/labs/blog-admin/ui/profile-settings.tsx` → `src/pages/admin/profile-settings.tsx` | 确认 `useAdminProfile` 的 `load()` 被正确调用（useEffect 或页面初始化时） | 迁入 stable 后，pages 层调用 features 公开 API，符合依赖方向 |
| `src/labs/blog-admin/ui/dashboard.tsx` → `src/pages/admin/dashboard.tsx` | 确认 `useBlogDashboard` 的 `load()` 被正确调用 | 同上 |
| `src/app/router/index.tsx` | 检查 `AdminPostTrashPage` 及其他 Admin 页面组件是否正确初始化数据 | `app/router` 作为组合根 |

### 验收标准

- 非 mahiru 的 ADMIN 账户登录后可正常访问 Blog Admin 所有页面
- 仪表盘、文章管理、文件管理、评论管理等功能正常
- `AdminGuard` 正确识别所有 ADMIN 账户

---

## 问题 2：文件管理无法上传文件

### 修复前必读

- [ ] `docs/infrastructure-rules.md` — 确认 API adapter 归属 feature/infrastructure
- [ ] `docs/dependency-rules.md` — 确认 pages → features 依赖方向
- [ ] `docs/stable-clean/architecture.md` — 确认 feature 内部 infrastructure 职责

### 根因分析

上一轮修复已将 `uploadBlogFile` 改为使用原生 `fetch` + `FormData` 发送 multipart 请求。当前代码逻辑看起来正确，但可能存在以下问题：

1. **`storedName` 使用原始文件名**：后端 `blog-file.resolver.ts` 第 59 行 `storedName: upload.filename`，如果文件名包含中文或特殊字符，可能导致存储路径问题
2. **`graphql-upload` 中间件加载失败**：后端 `main.ts` 中使用动态导入 `graphql-upload`，如果加载失败会 warn 但不阻止启动，此时文件上传 mutation 不可用
3. **前端 `Upload` 组件的 `customRequest` 回调**：`file-manager.tsx` 中 `customRequest` 的 `file` 参数类型可能不匹配

### 修复方案

| 文件 | 修改内容 | 规范合规说明 |
|------|----------|-------------|
| `src/features/blog/infrastructure/files-api.ts` | 检查 `uploadBlogFile` 的 FormData 构造是否正确；添加更详细的错误信息 | API adapter 归属 `features/blog/infrastructure/`，符合 infrastructure-rules |
| `src/labs/blog-admin/ui/file-manager.tsx` → `src/pages/admin/file-manager.tsx` | 检查 `customRequest` 回调中 `file` 参数是否正确传递；确保 `onUpload` 被正确调用 | 迁入 stable 后，pages 层调用 features 公开 API，符合依赖方向 |
| `src/features/blog/application/use-admin-files.ts` | 检查 `upload` 方法是否正确处理成功/失败状态 | feature/application 层修改 |

**规范合规注意**：
- `uploadBlogFile` 使用原生 `fetch` 而非 Apollo Client，是因为 Apollo 不支持 GraphQL Upload。该实现放在 `features/blog/infrastructure/files-api.ts` 符合 infrastructure-rules 中"API client 归属 feature/infrastructure"的要求
- 迁入 stable 后，`file-manager.tsx` 在 `pages/admin/` 中，调用 `features/blog` 的公开 API，`pages → features` 依赖方向合法（不再有 labs → features 的违规问题）

### 验收标准

- 选择图片文件后成功上传
- 上传成功后文件列表自动刷新
- 上传失败时显示明确错误信息
- 上传中显示 loading 状态

---

## 问题 3：置顶功能仅在 Blog Admin，展示端未体现

### 修复前必读

- [ ] `docs/stable-clean/architecture.md` — 确认 features 内部 ui/application/infrastructure 职责
- [ ] `docs/dependency-rules.md` — 确认 features → entities 依赖方向
- [ ] `docs/infrastructure-rules.md` — 确认不涉及 infrastructure 修改

### 根因分析

后端 `ListBlogPublishedPostsUsecase` 已在排序中前置 `isPinned DESC`，前端 `PostCard` 已显示置顶标签。但用户反馈"置顶功能在 Blog Admin 的文章管理页面中，而不是展示端"。

**实际情况**：
- 后端排序已正确：置顶文章排在最前
- 前端 `PostCard` 已有 `isPinned` 标签显示
- 问题可能是：置顶标签不够醒目，用户未注意到排序变化

### 修复方案

增强展示端置顶文章的视觉区分度：

| 文件 | 修改内容 | 规范合规说明 |
|------|----------|-------------|
| `src/features/blog/ui/post-card.tsx` | 置顶文章卡片增加视觉强调：如边框高亮、置顶图标前置、背景色微调 | features 内部 UI 组件修改 |
| `src/pages/blog-archive/index.tsx` | 归档页同样增强置顶文章的视觉区分 | pages 层组合修改 |
| `src/features/blog/ui/post-detail-header.tsx` | 文章详情页置顶标签更醒目 | features 内部 UI 组件修改 |

**规范合规注意**：
- 仅修改 `features/blog/ui/` 和 `pages/` 中的展示组件，不涉及 infrastructure 或 application 层
- 不修改 `entities/blog/types.ts`（`isPinned` 字段已存在）
- 不新增 infrastructure 代码（数据源未变）

### 验收标准

- 置顶文章在列表中视觉上明显区别于普通文章
- 置顶文章始终排在列表最前
- 文章详情页显示置顶标识

---

## 问题 4：回收站无法正常运作

### 修复前必读

- [ ] `docs/infrastructure-rules.md` — 新增 API adapter 必须归属 `features/blog/infrastructure/`
- [ ] `docs/dependency-rules.md` — 确认 pages → features 依赖方向
- [ ] `docs/stable-clean/architecture.md` — 确认 feature 内部 application/infrastructure 职责划分

### 根因分析

**核心问题**：前端回收站页面使用 `useAdminPosts({ status: 'deleted' })`，底层调用 `blogPosts` query 并传 `status: DELETED`。但后端 `blogPosts` 的 `createPostQueryBuilder` 有 `where('post.deleted_at IS NULL')` 硬过滤，**软删除的文章永远不会出现在 `blogPosts` 结果中**。

后端已提供专用的 `blogDeletedPosts` query（使用 `createDeletedPostsQueryBuilder` + `withDeleted()`），但前端未使用。

**次要问题**：
- `post-trash.tsx` 显示 `updatedAt` 作为删除时间，应显示 `deletedAt`
- `BlogPost` 类型缺少 `deletedAt` 字段
- `posts-api.ts` 的 `BlogPostDTO` 缺少 `deletedAt` 字段
- `POST_LIST_FRAGMENT` 缺少 `deletedAt` 字段

### 修复方案

#### 前端

| 文件 | 修改内容 | 规范合规说明 |
|------|----------|-------------|
| `src/entities/blog/types.ts` | `BlogPost` 接口添加 `deletedAt: string \| null` | entities 层类型扩展，符合依赖方向 |
| `src/features/blog/infrastructure/posts-api.ts` | `BlogPostDTO` 添加 `deletedAt`；`POST_LIST_FRAGMENT` 添加 `deletedAt`；`mapBlogPost` 映射 `deletedAt`；新增 `fetchBlogDeletedPosts` 函数调用 `blogDeletedPosts` query | API adapter 归属 `features/blog/infrastructure/`，符合 infrastructure-rules；新增 `fetchBlogDeletedPosts` 是新增 API adapter，必须放在此目录 |
| `src/features/blog/infrastructure/index.ts` | 导出 `fetchBlogDeletedPosts` | 公开 API 导出，符合 dependency-rules 中"跨模块导入只允许走公开 API" |
| `src/features/blog/application/use-admin-posts.ts` | 新增 `useAdminDeletedPosts` hook 或为 `useAdminPosts` 添加 `deletedMode` 参数，使用 `fetchBlogDeletedPosts` | application 层编排，调用 infrastructure 的公开 API |
| `src/labs/blog-admin/ui/post-trash.tsx` → `src/pages/admin/post-trash.tsx` | 删除时间列从 `updatedAt` 改为 `deletedAt` | 迁入 stable 后，pages 层修改 |
| `src/app/router/index.tsx` | `AdminPostTrashPage` 改用新的 deleted posts 数据源 | `app/router` 作为组合根 |

**规范合规注意**：
- 新增 `fetchBlogDeletedPosts` 必须放在 `features/blog/infrastructure/posts-api.ts` 中，不得散落在 `pages/` 或 `labs/`（infrastructure-rules: "API、storage、URL 参数读写直接散落在 pages、widgets、app/layout 是违规的"）
- `BlogPostDTO` 和 mapper 的修改在 `features/blog/infrastructure/` 中完成，符合防腐职责要求
- `entities/blog/types.ts` 的 `BlogPost` 添加 `deletedAt` 是类型扩展，不违反 entities 不承接 infrastructure 的规则（`deletedAt` 是业务字段，不是外部协议细节）
- 迁入 stable 后，`pages/admin/` 通过 `features/blog` 的公开 API 获取数据，`pages → features` 依赖方向合法

### 验收标准

- 文章移入回收站后，回收站页面能正确列出
- 回收站显示正确的删除时间
- 恢复文章后从回收站消失，回到文章列表
- 永久删除后文章彻底消失

---

## 问题 5：点赞无账号划分

### 修复前必读

- [ ] `docs/project-convention/graphql-ingress-auth-boundary.md` — 确认 protected/public 请求语义，authMode 使用
- [ ] `docs/infrastructure-rules.md` — 确认 API adapter 修改归属
- [ ] `docs/dependency-rules.md` — 确认 pages → features 依赖方向
- [ ] `docs/stable-clean/architecture.md` — 确认 feature 内部 application/infrastructure 职责

### 根因分析

**核心问题**：`BlogPostPage` 中 `useLike` 的 `userIdentifier` 硬编码为 `'anonymous'`：

```tsx
// src/pages/blog-post/index.tsx:50
const likeHook = useLike({
  postId: post?.id ? Number(post.id) : 0,
  userIdentifier: 'anonymous',
  autoCheck: !!post?.id,
});
```

所有用户共享同一个 `userIdentifier`，导致：
- A 用户点赞后，B 用户进入同一篇文章时 `hasLiked` 返回 `true`
- B 用户点击点赞实际上是取消 A 的赞

后端 `BlogLikeEntity` 使用 `(postId, userIdentifier)` 联合唯一约束，设计上支持按用户区分，但前端未传递正确的用户标识。

### 修复方案

**策略**：已登录用户使用 `accountId` 作为 `userIdentifier`，未登录用户使用 localStorage 生成的匿名 ID。

#### 前端

| 文件 | 修改内容 | 规范合规说明 |
|------|----------|-------------|
| `src/pages/blog-post/index.tsx` | 从 `useAuth` 获取 `accountId`，已登录时 `userIdentifier = \`user:\${accountId}\``，未登录时使用 localStorage 生成的匿名 ID | pages 层调用 features 公开 API（`useLike`、`useAuth`），符合依赖方向 |
| `src/features/blog/application/use-like.ts` | 无需修改，`userIdentifier` 由调用方传入 | - |
| `src/features/blog/infrastructure/likes-api.ts` | 已登录用户的点赞请求使用默认 `authMode`（protected），以便后端从 JWT 获取用户 ID 做二次校验；未登录用户使用 `authMode: 'none'` | 符合 graphql-ingress-auth-boundary 中的 protected/public 请求语义 |

**未登录匿名 ID 方案**：
- 在 `shared/` 中新增 `getAnonymousId()` 工具函数，使用 localStorage 生成并持久化一个随机 ID
- 该函数无业务语义，属于通用浏览器能力，可放在 `shared/`
- 不得放在 `features/` 或 `entities/`（不属于任何业务切片）

**规范合规注意**：
- `useAuth` 在 `features/auth/application/` 中，`pages` → `features` 依赖方向合法
- `useLike` 在 `features/blog/application/` 中，同上
- `getAnonymousId()` 放在 `shared/` 中，符合"真正通用、无业务归属或业务弱相关内容"的定位
- 点赞 API 调用时，已登录用户使用 protected 请求（默认 authMode），未登录用户使用 public 请求（`authMode: 'none'`），符合 graphql-ingress-auth-boundary 规范
- 不得在 `pages/` 中直接调用 `likes-api.ts`（infrastructure），必须通过 `features/blog/application/use-like.ts` 的公开 API

### 验收标准

- A 用户点赞后，B 用户进入同一篇文章时点赞状态独立
- 已登录用户的点赞标识为 `user:{accountId}`
- 未登录用户的点赞标识为 localStorage 匿名 ID
- 点赞/取消点赞正常工作
- 点赞数正确增减

---

## 问题 6：Blog Admin 仍在 labs 区，未迁入 stable 正式区 ✅ 已完成

### 修复前必读

- [x] `docs/labs-rules.md` — 重点重读"迁入 Stable"章节
- [x] `docs/layer-model.md` — 重点重读 stable 区细分职责、stable vs labs 定位
- [x] `docs/environment-exposure.md` — 重点重读 stable 与 labs 的环境暴露语义差异
- [x] `docs/dependency-rules.md` — 重点重读正式区依赖方向、labs 依赖限制
- [x] `docs/stable-clean/architecture.md` — 确认迁入后的目录结构
- [x] `docs/infrastructure-rules.md` — 确认迁入后 infrastructure 归属

### 根因分析

Blog Admin 所有 UI 组件仍在 `labs/blog-admin/` 中，但 blog 已是正式业务功能，不应继续留在实验区。

**当前问题**：

1. **生产环境不可用**：`labs/blog-admin/access.ts` 限制 `env: ['dev', 'test']`，prod 环境无法访问 Blog Admin。按 environment-exposure.md，labs 默认不暴露 prod，只有显式配置 access list 后才允许。但 Blog Admin 是正式功能，应进入 stable 区，stable 区在 prod 默认可见
2. **导航标记为 labs**：`app/navigation/catalog.ts` 中 `BLOG_ADMIN_LAB_ITEM` 的 `kind: 'labs'`，Blog Admin 在导航中被归类为实验功能
3. **依赖方向违规**：`dependency-rules.md` 规定"labs 默认不得依赖 pages、widgets、features"，当前 `app/router` 中的 Admin 页面组件直接调用 `features/blog` 的 hooks（`useAdminPosts`、`useBlogDashboard` 等），虽然通过 router 间接调用被允许，但这本身说明 Blog Admin 已超越 labs 的定位
4. **meta.ts 自述矛盾**：`meta.ts` 的 purpose 写"仍在迭代中，先放 labs 观察"，但 blog 已是正式业务；notes 中写"迁入 stable 时应重组为 pages/admin/ + 内部 application 层"，说明迁移路径已规划但未执行

**当前 labs/blog-admin 文件清单**：

```
src/labs/blog-admin/
  index.ts              # 公开入口
  access.ts             # access list（env: dev/test, roles: ADMIN）
  meta.ts               # 实验元信息
  lib/
    status-options.ts    # 状态选项常量
  ui/
    admin-layout.tsx     # 管理端布局
    category-manager.tsx # 分类管理
    comment-manager.tsx  # 评论管理
    dashboard.tsx        # 仪表盘
    file-manager.tsx     # 文件管理
    friend-link-manager.tsx # 友链管理
    post-editor.tsx      # 文章编辑器
    post-list.tsx        # 文章列表
    post-trash.tsx       # 回收站
    profile-settings.tsx # 个人设置
    tag-manager.tsx      # 标签管理
```

### 修复方案

**迁移策略**：按 `meta.ts` notes 中的规划"迁入 stable 时应重组为 pages/admin/ + 内部 application 层"，将 Blog Admin 从 `labs/blog-admin/` 迁入 `pages/admin/`。

#### 迁移步骤

**Step 1：创建 `pages/admin/` 目录结构**

```
src/pages/admin/
  index.ts              # 公开入口
  layout.tsx            # 管理端布局（原 admin-layout.tsx）
  dashboard.tsx         # 仪表盘页面
  post-list.tsx         # 文章列表页面
  post-editor.tsx       # 文章编辑器页面
  post-trash.tsx        # 回收站页面
  category-manager.tsx  # 分类管理页面
  tag-manager.tsx       # 标签管理页面
  comment-manager.tsx   # 评论管理页面
  file-manager.tsx      # 文件管理页面
  friend-link-manager.tsx # 友链管理页面
  profile-settings.tsx  # 个人设置页面
  lib/
    status-options.ts    # 状态选项常量（从 labs/lib/ 迁入）
```

**Step 2：更新文件内容**

| 原路径 | 新路径 | 修改内容 |
|--------|--------|----------|
| `labs/blog-admin/ui/admin-layout.tsx` | `pages/admin/layout.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/dashboard.tsx` | `pages/admin/dashboard.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/post-list.tsx` | `pages/admin/post-list.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/post-editor.tsx` | `pages/admin/post-editor.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/post-trash.tsx` | `pages/admin/post-trash.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/category-manager.tsx` | `pages/admin/category-manager.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/tag-manager.tsx` | `pages/admin/tag-manager.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/comment-manager.tsx` | `pages/admin/comment-manager.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/file-manager.tsx` | `pages/admin/file-manager.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/friend-link-manager.tsx` | `pages/admin/friend-link-manager.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/ui/profile-settings.tsx` | `pages/admin/profile-settings.tsx` | 移动；更新 import 路径 |
| `labs/blog-admin/lib/status-options.ts` | `pages/admin/lib/status-options.ts` | 移动 |
| `labs/blog-admin/index.ts` | `pages/admin/index.ts` | 重写公开入口，导出所有页面组件 |

**Step 3：更新 `app/router/index.tsx`**

| 修改内容 | 说明 |
|----------|------|
| 将 `import ... from '@/labs/blog-admin'` 改为 `import ... from '@/pages/admin'` | 依赖方向从 router → labs 改为 router → pages，符合正式区依赖方向 |
| 移除 `blogAdminLoader` 中的 `canAccessBlogAdminLab(getAppEnv())` 环境检查 | stable 区默认在 prod 可见，不再需要 labs 环境隔离 |
| 保留 `AdminGuard` 角色检查 | 权限控制由正式业务规则（ADMIN 角色）继续管理 |

**Step 4：更新 `app/navigation/catalog.ts`**

| 修改内容 | 说明 |
|----------|------|
| `BLOG_ADMIN_LAB_ITEM` 改为 `BLOG_ADMIN_ITEM`，`kind: 'labs'` 改为 `kind: 'stable'` | Blog Admin 正式归入 stable 导航 |
| 移除 `BLOG_ADMIN_ALLOWED_ENVS` 常量和 `canAccessBlogAdminLab` 相关逻辑 | stable 区不需要环境隔离 |
| 保留 ADMIN 角色检查 | 权限控制不变 |

**Step 5：删除 `labs/blog-admin/` 目录**

| 操作 | 说明 |
|------|------|
| 删除 `src/labs/blog-admin/` 整个目录 | 迁入 stable 后，labs 中的 blog-admin 不再需要 |
| 确认无其他文件引用 `@/labs/blog-admin` | 全局搜索确认 |

**Step 6：验证**

| 验证项 | 说明 |
|--------|------|
| `tsc --noEmit` 无错误 | 类型检查通过 |
| `npm run test` 全部通过 | 测试通过 |
| ESLint boundaries 无违规 | 依赖方向合规 |
| prod 环境可访问 Blog Admin | 环境暴露正确 |
| 非 ADMIN 角色无法访问 | 权限控制正确 |

**规范合规注意**：

- **迁入 stable 的规则**（labs-rules.md）："labs 迁入 stable 时，默认不是让正式区继续依赖 labs 实现，更稳的做法是把已验证的能力重新落到 stable 内部的拥有者切片中，再由 pages 或其他正式模块消费"。本次迁移将 UI 组件落到 `pages/admin/`，符合此规则
- **stable 区职责**（layer-model.md）：`pages` 负责"正式页面级组合，负责页面组装和布局组织"。Blog Admin 各页面属于页面级组合，放在 `pages/admin/` 符合定位
- **依赖方向**（dependency-rules.md）：`pages -> features, entities, shared`。迁入后 `pages/admin/` 调用 `features/blog` 的公开 API，依赖方向合法。不再有 labs → features 的违规问题
- **环境暴露**（environment-exposure.md）：stable 区在 dev/test/prod 均可见。迁入后 Blog Admin 在 prod 可用，具体权限由 ADMIN 角色控制
- **不需要第二维**（stable-clean/architecture.md）：`pages/admin/` 作为页面级组合，不需要引入 application/infrastructure 第二维。数据获取逻辑已在 `features/blog/application/` 中，页面只负责组装和展示
- **status-options.ts 归属**：`lib/status-options.ts` 是纯常量定义，无业务逻辑，放在 `pages/admin/lib/` 中符合"当前功能足够简单时，优先保持窄 owner 和浅结构"的原则

### 验收标准

- `labs/blog-admin/` 目录已删除
- `pages/admin/` 目录包含所有 Blog Admin 页面组件
- `app/router/index.tsx` 从 `@/pages/admin` 导入，无 labs 依赖
- `app/navigation/catalog.ts` 中 Blog Admin 的 `kind` 为 `'stable'`
- prod 环境 ADMIN 角色用户可正常访问 Blog Admin
- dev/test 环境 ADMIN 角色用户可正常访问 Blog Admin
- 非 ADMIN 角色用户无法访问 Blog Admin
- 无 `@/labs/blog-admin` 的残留引用

---

## 执行顺序

1. **问题 6（Blog Admin 迁入 stable）** ✅ 已完成：架构基础问题，影响所有其他问题的文件路径，必须最先处理
2. **问题 4（回收站）**：影响最大，修复最明确
3. **问题 5（点赞账号划分）**：数据一致性问题
4. **问题 1（ADMIN 权限）**：需排查确认根因，可能涉及前后端
5. **问题 2（文件上传）**：需验证当前状态，可能已修复
6. **问题 3（置顶展示）**：体验优化，优先级较低

---

## 自检清单

### 规范合规

- [ ] 所有新增 API adapter 放在 `features/<feature>/infrastructure/` 中
- [ ] 所有跨模块导入走公开 API（`index.ts`）
- [ ] Blog Admin 已迁入 `pages/admin/`，不再依赖 `labs/`
- [ ] `pages/admin/` 通过 `features/blog` 公开 API 获取数据，`pages → features` 依赖方向合法
- [ ] infrastructure 不承载业务规则
- [ ] entities 不承接 mock、API、storage
- [ ] 未在 `pages/`、`widgets/`、`app/layout` 中直接散落 API/adapter 代码
- [ ] 无 `@/labs/blog-admin` 残留引用
- [ ] Blog Admin 在 prod 环境可用（stable 区环境暴露语义）

### 功能验证

- [ ] `tsc --noEmit` 无错误
- [ ] `npm run test` 全部通过
- [ ] 非 mahiru 的 ADMIN 账户可正常使用 Blog Admin
- [ ] 文件上传功能正常
- [ ] 置顶文章在展示端视觉区分明显
- [ ] 回收站正确列出已删除文章
- [ ] 回收站显示正确删除时间
- [ ] 恢复/永久删除功能正常
- [ ] 不同用户的点赞状态独立
- [ ] 点赞数正确增减
- [ ] prod 环境 ADMIN 角色可访问 Blog Admin
