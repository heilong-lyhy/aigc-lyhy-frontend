# 博客功能完善工作规划（前端部分）

> 创建时间：2026-06-08
> 状态：待执行

---

## 进度跟踪

| 任务 | 状态 | 阻塞项 | 开始时间 | 完成时间 | 备注 |
|------|------|--------|----------|----------|------|
| 1.1 分类/标签筛选连接后端 | 待开始 | 后端 1.1+1.2 | | | |
| 1.2 搜索关键词连接后端 | 待开始 | 后端 1.1 | | | |
| 1.3 文件管理列表连接后端 | 待开始 | 无 | | | ⚡ 可立即开始 |
| 1.4 评论管理添加删除按钮 | 待开始 | 无 | | | ⚡ 可立即开始 |
| 2.1 上一篇/下一篇导航 | 待开始 | 后端 2.1 | | | |
| 2.2 Markdown 实时预览 | 待开始 | 无 | | | ⚡ 可立即开始 |
| 2.3 标签编辑功能 | 待开始 | 后端 1.4 | | | |
| 2.4 评论管理回复功能 | 待开始 | 后端 1.5 | | | |
| 2.5 友链页面+管理 | 待开始 | 后端 2.2 | | | |
| 2.6 封面图上传按钮 | 待开始 | 无 | | | ⚡ 可立即开始 |
| 3.1 头像自动生成 | 待开始 | 可选后端对接 | | | |
| 3.2 软删除/回收站 | 待开始 | 后端 3.1 | | | |
| 3.3 评论隐藏状态 | 待开始 | 后端 2.3 | | | |

## 风险登记

| 风险 | 影响 | 概率 | 触发条件 | 应对方案 |
|------|------|------|----------|----------|
| 分类/标签筛选状态丢失 | 刷新页面后筛选重置 | 高 | 用户刷新页面或分享链接 | 筛选状态同步到 URL query |
| 搜索输入频繁请求 | 后端压力大 | 中 | 用户快速连续输入 | 300ms 防抖 |
| Markdown 实时预览大文档卡顿 | 编辑体验差 | 中 | 文章内容超过 10000 字 | 300ms 防抖渲染 |
| Cravatar 国内仍不可达 | 头像无法显示 | 低 | Cravatar 服务故障或 DNS 污染 | identicon 回退 |
| 1.1 与 1.2 修改同一文件产生合并冲突 | 代码冲突 | 高 | 两人并行开发 1.1 和 1.2 | 1.1+1.2 的 posts-api.ts 修改应合并为一次提交 |

---

## 阶段一：核心功能补全（P1）

> 目标：让已有 UI 真正连接后端，消除"有按钮无效果"的问题

### 1.1 首页分类/标签筛选连接后端

**问题**：首页侧边栏有分类和标签列表，点击后调用 `onCategoryClick`/`onTagClick`，但 `useBlogPosts` 不接受 `categoryId`/`tagId` 参数，筛选不生效。

**已验证**：`posts-api.ts` 的 `FetchBlogPublishedPosts` query **尚未**包含 `$categoryId`/`$tagId`/`$title` 变量（当前只有 `$page/$limit/$sortBy/$sortOrder`），需要新增。`files-api.ts` 已有完整的 `fetchBlogFiles()` 和 `uploadBlogFile()` 函数。

**设计决策**：
- 分类和标签筛选**共存**（AND 语义）：文章既属该分类又含该标签
- 筛选状态同步到 URL query（`?category=1&tag=2`），刷新/分享保持状态
- 点击已选中项取消筛选
- 浏览器前进/后退按钮正常工作

**合并提交说明**：1.1 和 1.2 都修改 `posts-api.ts` 的 `FetchBlogPublishedPosts` query，应合并为一次提交，避免合并冲突。

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/infrastructure/posts-api.ts` | `FetchBlogPublishedPosts` query 添加 `$categoryId: Int`、`$tagId: Int`、`$title: String` 变量；`blogPublishedPosts()` 调用添加 `categoryId`、`tagId`、`title` 参数（**1.1+1.2 合并修改**） |
| `src/features/blog/application/use-blog-posts.ts` | `UseBlogPostsOptions` 添加 `categoryId?: number`、`tagId?: number` 可选参数；传递到 fetcher |
| `src/pages/blog-home/index.tsx` | 从 URL query 读取 `category`/`tag` 初始化 state；`useBlogPosts` 传入筛选参数；`onCategoryClick`/`onTagClick` 设置对应 state 并同步 URL；侧边栏分类/标签高亮选中项 |

**验收标准**：
- 点击侧边栏分类，文章列表仅显示该分类下的文章
- 点击侧边栏标签，文章列表仅显示含该标签的文章
- 再次点击已选中项取消筛选
- URL 同步筛选状态（`?category=1&tag=2`）
- 刷新页面后筛选状态保持

### 1.2 搜索关键词连接后端

**问题**：`blog-search` 页面有搜索 UI，但 `useBlogSearch` 的 keyword 未传递到后端 API。

**已验证**：`useBlogSearch` 已内置 300ms 防抖和 URL 同步（读取 `q` 参数），只需将 `keyword` 映射为 `title` 传递给 `fetchBlogPublishedPosts`。

**设计决策**：
- 搜索关键词映射为后端 `title` 参数（当前版本只搜标题）
- `useBlogSearch` 已有 300ms 防抖，无需重复添加
- `blog-search` 页面已从 URL 读取 `q` 参数，无需重复实现
- 区分"加载中"和"无结果"状态（`useBlogSearch` 已返回 `isEmpty` 和 `isLoading`）

**合并提交说明**：`posts-api.ts` 的修改已在 1.1 中完成，本任务只需修改 `use-blog-search.ts`。

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/application/use-blog-search.ts` | `fetchData` 中将 `currentFilters.keyword` 映射为 `title` 参数传递给 `fetchBlogPublishedPosts`（当前 `fetchData` 只传了 `sortBy`/`sortOrder`，未传 `keyword`/`title`） |

**验收标准**：
- 输入关键词后文章列表实时筛选（已有 300ms 防抖）
- 空关键词时显示全部文章
- URL 同步搜索词（`?q=xxx`，已实现）
- 无结果时显示"未找到相关文章"（`useBlogSearch` 已返回 `isEmpty`）
- 加载中显示 loading 状态（`useBlogSearch` 已返回 `isLoading`）

### 1.3 文件管理列表连接后端

**问题**：`AdminFileManagerPage` 中 `files` 硬编码为空数组 `const files = [] as const`，未调用后端文件列表 API。

**已验证**：`files-api.ts` 已有完整的 `fetchBlogFiles()` 函数，`useAdminFiles` hook 只需添加列表查询。

**设计决策**：
- 支持分页（文件数量大时）
- 支持按文件类型筛选（后端 `blogFiles` 已支持 `fileType` 参数）
- 空列表时显示"暂无文件"提示

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/application/use-admin-files.ts` | 添加文件列表查询：引入 `useAsyncQuery`；添加 `files`、`isLoadingFiles`、`refetchFiles` 到返回值；调用 `fetchBlogFiles`；支持分页参数 |
| `src/app/router/index.tsx` — `AdminFileManagerPage` | 移除 `const files = [] as const`；从 `useAdminFiles` 获取 `files`、`isLoadingFiles`、`refetchFiles`；传给 `FileManager` |
| `src/labs/blog-admin/ui/file-manager.tsx` | `FileManagerProps` 添加 `isLoading: boolean`、`onRefetch: () => void`；渲染加载态和刷新按钮；空列表时显示"暂无文件" |

**验收标准**：
- 文件管理页显示已上传文件列表
- 上传/删除文件后列表自动刷新
- 空列表时显示"暂无文件"提示
- 加载中显示 loading 状态

### 1.4 评论管理添加删除按钮

**问题**：管理端评论管理只有"通过/驳回/垃圾"按钮，无删除按钮。后端 `deleteBlogComment` mutation 已存在。

**设计决策**：
- 删除是不可逆操作，**必须**有 Popconfirm 确认
- 仅管理员可见删除按钮
- 同时添加 `isAdminReply` 字段到 `BlogComment` 类型（后端 1.5 新增字段，提前添加避免 TypeScript 警告）

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/infrastructure/comments-api.ts` | 确认 `deleteBlogComment` mutation 已存在（已验证存在） |
| `src/labs/blog-admin/ui/comment-manager.tsx` | 操作列添加"删除"按钮（红色，Popconfirm 确认："确定要删除此评论吗？此操作不可恢复"）；调用 `deleteBlogComment` mutation；删除后刷新列表 |
| `src/entities/blog/index.ts` | `BlogComment` 类型添加 `isAdminReply?: boolean` 字段（提前添加，与后端 1.5 对齐） |

**验收标准**：
- 管理端可删除评论
- 删除前有确认弹窗
- 删除后列表自动刷新
- `isAdminReply` 字段不会导致 TypeScript 类型错误

### 阶段一测试补充

| 测试文件 | 覆盖内容 |
|----------|----------|
| `src/features/blog/application/use-blog-posts.spec.ts` | 分类筛选、标签筛选、组合筛选、取消筛选 |
| `src/features/blog/application/use-blog-search.spec.ts` | keyword 映射为 title、空关键词返回全部 |
| `src/features/blog/application/use-admin-files.spec.ts` | 文件列表查询、分页、上传后刷新 |
| `src/labs/blog-admin/ui/comment-manager.spec.tsx` | 删除评论、确认弹窗、删除后刷新 |

### 阶段一自检清单

- [ ] `tsc --noEmit` 无错误
- [ ] `npm run test` 全部通过
- [ ] 确认前端 `pageSize` 正确映射到后端 `limit`（GraphQL 变量名）
- [ ] 浏览器验证：首页分类/标签筛选正常工作
- [ ] 浏览器验证：搜索页面关键词搜索正常工作
- [ ] 浏览器验证：文件管理页显示文件列表
- [ ] 浏览器验证：评论管理页可删除评论

---

## 阶段二：功能增强（P2）

> 目标：补齐缺失的独立功能模块

### 2.1 上一篇/下一篇文章导航

**问题**：文章详情页无上一篇/下一篇导航。

**设计决策**：
- 导航跨全站（不限定分类），与后端排序一致
- 仅文字链接，不带缩略图（保持简洁）
- 点击跳转到 `/blog/post/:slug`

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/entities/blog/index.ts` | `BlogPostDetail` 类型添加 `prevPost?: { id: number; title: string; slug: string }` 和 `nextPost?: { id: number; title: string; slug: string }` |
| `src/features/blog/infrastructure/posts-api.ts` | `FetchBlogPostDetail` query fragment 添加 `prevPost { id title slug }` 和 `nextPost { id title slug }` |
| `src/pages/blog-post/index.tsx` | 文章底部渲染上一篇/下一篇导航 |
| 新建 `src/features/blog/ui/post-navigation.tsx` | 导航 UI 组件：左右箭头 + 文章标题 |

**验收标准**：
- 文章详情页底部显示上一篇/下一篇链接
- 第一篇无"上一篇"，最后一篇无"下一篇"
- 点击可跳转到对应文章

### 2.2 文章编辑器 Markdown 实时预览

**问题**：文章编辑器使用纯文本 TextArea，无 Markdown 预览。

**已验证**：`MarkdownRenderer` 组件存在于 `src/features/blog/ui/markdown-renderer.tsx`，接受 `content` 和 `onTocReady` props，适合编辑器预览场景。

**设计决策**：
- 预览渲染 300ms 防抖，避免大文档卡顿
- 三种模式切换：纯编辑 / 纯预览 / 分栏
- 不做同步滚动（延后）、不做 Markdown 工具栏（延后）

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/labs/blog-admin/ui/post-editor.tsx` | 内容编辑区域改为左右分栏（编辑 | 预览）；右侧使用 `MarkdownRenderer` 实时渲染（300ms 防抖）；添加"编辑/预览/分栏"切换按钮 |

**验收标准**：
- 编辑区输入 Markdown，预览区实时渲染（300ms 防抖）
- 可切换纯编辑/纯预览/分栏三种模式
- 现有编辑功能不受影响

### 2.3 标签编辑功能

**问题**：标签管理只有创建和删除，无编辑。需后端先完成 `updateBlogTag` mutation。

**设计决策**：
- 复用创建 Modal 表单，预填现有值
- slug 自动从 name 生成，但允许单独编辑

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/infrastructure/tags-api.ts` | 添加 `UpdateBlogTag` GraphQL mutation 和 `updateBlogTag()` fetcher |
| `src/features/blog/application/use-admin-tags.ts` | 添加 `updateTag` 方法 |
| `src/labs/blog-admin/ui/tag-manager.tsx` | 标签列表项添加"编辑"按钮；点击后弹出编辑 Modal（复用创建 Modal 表单，预填现有值） |

**验收标准**：
- 可编辑标签名称和 slug
- slug 重复时显示错误提示
- 编辑 Modal 预填现有值

### 2.4 评论管理回复功能

**问题**：管理端无法回复评论。需后端先完成 `replyBlogComment` mutation。

**设计决策**：
- 管理员回复显示"博主"徽章（基于后端 `isAdminReply` 字段，已在 1.4 提前添加到类型）
- 内联回复表单：输入框 + 提交按钮，点击"回复"展开

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/infrastructure/comments-api.ts` | 添加 `ReplyBlogComment` GraphQL mutation 和 `replyBlogComment()` fetcher |
| `src/labs/blog-admin/ui/comment-manager.tsx` | 评论项添加"回复"按钮；点击后展开内联回复表单（输入框 + 提交按钮）；管理员回复显示"博主"徽章 |

**验收标准**：
- 管理员可在评论管理页直接回复评论
- 回复后评论列表刷新
- 管理员回复显示"博主"徽章

### 2.5 友链页面 + 友链管理

**问题**：前后端均无友链功能。需后端先完成友链 API。

**设计决策**：
- 友链卡片适配移动端（响应式网格）
- 链接添加 `rel="noopener noreferrer"` + `target="_blank"`
- 无友链时显示空状态提示
- 仅管理员可添加友链

**新建文件清单**：

| 文件 | 说明 |
|------|------|
| `src/entities/blog/friend-link.ts` | `BlogFriendLink` 类型定义 |
| `src/entities/blog/index.ts` | 导出 `BlogFriendLink` |
| `src/features/blog/infrastructure/friend-links-api.ts` | GraphQL query/mutation |
| `src/features/blog/application/use-blog-friend-links.ts` | 公开友链列表 hook |
| `src/features/blog/application/use-admin-friend-links.ts` | 管理端友链 CRUD hook |
| 新建 `src/pages/blog-friends/index.tsx` | 友链展示页面（响应式卡片网格） |
| 新建 `src/labs/blog-admin/ui/friend-link-manager.tsx` | 友链管理组件 |
| `src/app/router/index.tsx` | 添加 `/blog/friends` 路由 + 管理端友链路由 |

**验收标准**：
- `/blog/friends` 页面展示友链列表（响应式）
- 管理端可增删改查友链
- 友链按 `sortOrder` 排序
- 无友链时显示空状态

### 2.6 封面图上传按钮

**问题**：文章编辑器封面图只能手动输入 URL。后端 `uploadBlogFile` mutation 已存在。

**设计决策**：
- 限制文件类型：jpg/png/webp
- 限制文件大小：5MB（参考 `MAX_FILE_SIZE_BYTES`）
- 上传中显示进度/loading
- 上传成功后显示缩略图预览

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/labs/blog-admin/ui/post-editor.tsx` | 封面图输入框旁添加"上传"按钮；点击触发文件选择（accept="image/jpeg,image/png,image/webp"）；文件大小校验（>5MB 提示）；调用 `uploadBlogFile` → 返回 URL 填入输入框；上传中显示 loading；上传成功后显示缩略图 |

**验收标准**：
- 点击上传按钮可选择图片
- 上传成功后 URL 自动填入封面图输入框
- 上传中显示 loading 状态
- 非图片文件提示"仅支持 JPG/PNG/WebP 格式"
- 超过 5MB 提示"文件大小不能超过 5MB"

### 阶段二测试补充

| 测试文件 | 覆盖内容 |
|----------|----------|
| `src/features/blog/ui/post-navigation.spec.tsx` | 渲染导航、首篇/末篇边界、点击跳转 |
| `src/labs/blog-admin/ui/post-editor.spec.tsx` | Markdown 预览切换、防抖渲染、封面图上传、格式校验、大小校验 |
| `src/features/blog/application/use-admin-tags.spec.ts` | 标签编辑、slug 重复 |
| `src/features/blog/application/use-admin-friend-links.spec.ts` | 友链 CRUD |

### 阶段二自检清单

- [ ] `tsc --noEmit` 无错误
- [ ] `npm run test` 全部通过
- [ ] 确认前端 `pageSize` 正确映射到后端 `limit`
- [ ] 浏览器验证：文章详情页显示上一篇/下一篇导航
- [ ] 浏览器验证：编辑器 Markdown 预览正常工作
- [ ] 浏览器验证：标签编辑功能正常
- [ ] 浏览器验证：评论管理回复功能正常
- [ ] 浏览器验证：友链页面展示正常（含移动端）
- [ ] 浏览器验证：封面图上传功能正常

---

## 阶段三：体验优化（P3）

> 目标：锦上添花，提升用户体验

### 3.1 头像自动生成（Gravatar/Cravatar）

**设计决策**：
- 后端已通过 `AvatarGenerator` 契约在评论创建时生成 `authorAvatar` 字段
- 前端只需确保 `BlogComment` 类型包含 `authorAvatar` 字段并在评论列表中展示
- 后端 P3 会将 `GravatarAvatarGeneratorAdapter` 替换为 `CravatarAvatarGeneratorAdapter`，前端无需改动
- identicon 作为默认回退头像（后端已处理）

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/entities/blog/index.ts` | `BlogComment` 类型添加 `authorAvatar?: string` 字段 |
| `src/features/blog/ui/comment-list.tsx` | 评论头像使用 `authorAvatar` 字段渲染；无头像时显示默认头像图标 |
| `src/features/blog/ui/comment-form.tsx` | 邮箱输入框下方提示"头像将根据邮箱自动生成" |

**验收标准**：
- 有 `authorAvatar` 的评论显示头像
- 无头像时显示默认头像图标
- 后端切换 Cravatar 后前端无需改动

### 3.2 软删除/回收站

**设计决策**：
- 文章列表"删除"改为"移入回收站"
- 回收站页面显示已删除文章列表 + 恢复/永久删除按钮
- 永久删除需二次确认

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/infrastructure/posts-api.ts` | 添加 `RestoreBlogPost` mutation、`FetchBlogDeletedPosts` query、`PermanentDeleteBlogPost` mutation |
| 新建 `src/labs/blog-admin/ui/post-trash.tsx` | 回收站页面：已删除文章列表 + 恢复/永久删除按钮（Popconfirm 确认） |
| `src/labs/blog-admin/ui/post-list.tsx` | "删除"改为"移入回收站" |
| `src/app/router/index.tsx` | 管理端添加回收站路由 |

**验收标准**：
- 删除文章后可在回收站查看
- 可恢复已删除文章
- 可永久删除（需确认）
- 空回收站显示空状态

### 3.3 评论"隐藏"状态

**设计决策**：
- 使用后端 `isHidden` 布尔字段（非枚举）
- 评论列表中"已隐藏"评论显示灰色标签
- 管理端评论管理支持按状态筛选

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/entities/blog/index.ts` | `BlogComment` 类型添加 `isHidden?: boolean` 字段 |
| `src/labs/blog-admin/ui/comment-manager.tsx` | 添加"隐藏"/"取消隐藏"操作按钮；已隐藏评论显示灰色标签；添加状态筛选下拉框 |

**验收标准**：
- 管理员可将评论标记为隐藏
- 隐藏评论不在前台显示
- 管理端可查看和取消隐藏
- 已隐藏评论有视觉区分

### 阶段三测试补充

| 测试文件 | 覆盖内容 |
|----------|----------|
| `src/features/blog/ui/comment-list.spec.tsx` | authorAvatar 渲染、无头像默认图标 |
| `src/labs/blog-admin/ui/post-trash.spec.tsx` | 恢复文章、永久删除、空回收站 |
| `src/labs/blog-admin/ui/comment-manager.spec.tsx` | 隐藏/取消隐藏、状态筛选（**追加到阶段一/二同文件**） |

### 阶段三自检清单

- [ ] `tsc --noEmit` 无错误
- [ ] `npm run test` 全部通过
- [ ] 浏览器验证：评论头像正常显示
- [ ] 浏览器验证：回收站功能正常
- [ ] 浏览器验证：评论隐藏/取消隐藏正常

---

## e2e 测试规划

> 关键端到端流程验证，每个阶段完成后执行

| 流程 | 覆盖阶段 | 验证内容 |
|------|----------|----------|
| 发布文章 → 前台展示 → 用户评论 → 管理员回复 → 前台查看 | P1+P2 | 全链路数据流通 |
| 搜索关键词 → 筛选分类 → 点击文章 → 上一篇/下一篇导航 | P1+P2 | 筛选+导航流程 |
| 管理员隐藏评论 → 前台不可见 → 取消隐藏 → 前台可见 | P2 | 评论隐藏流程 |
| 删除文章 → 回收站查看 → 恢复文章 → 前台可见 | P3 | 软删除流程 |

---

## 执行顺序与依赖关系

```
阶段一（前后端可并行，前端部分依赖后端先完成）
├── 1.1 分类/标签筛选      ← 阻塞项：后端 1.1+1.2
│   └── ⚠️ 与 1.2 合并修改 posts-api.ts
├── 1.2 搜索关键词         ← 阻塞项：后端 1.1
├── 1.3 文件管理列表       ← 无阻塞项 ⚡ 可立即开始
└── 1.4 评论删除按钮       ← 无阻塞项 ⚡ 可立即开始
    └── 同时添加 isAdminReply 到 BlogComment 类型

阶段二（均依赖后端先完成对应 API）
├── 2.1 上一篇/下一篇      ← 阻塞项：后端 2.1
├── 2.2 Markdown 预览      ← 无阻塞项 ⚡ 可立即开始
├── 2.3 标签编辑           ← 阻塞项：后端 1.4
├── 2.4 评论管理回复       ← 阻塞项：后端 1.5
├── 2.5 友链页面+管理      ← 阻塞项：后端 2.2
└── 2.6 封面图上传         ← 无阻塞项 ⚡ 可立即开始

阶段三（低优先级）
├── 3.1 Cravatar 头像      ← 阻塞项：可选后端对接
├── 3.2 软删除/回收站      ← 阻塞项：后端 3.1
└── 3.3 评论隐藏           ← 阻塞项：后端 2.3
```

## 建议执行策略

1. **立即开始**（无后端依赖）：1.3 文件管理列表、1.4 评论删除按钮、2.2 Markdown 预览、2.6 封面图上传
2. **后端完成 1.1+1.2 后**：前端开始 1.1 分类/标签筛选 + 1.2 搜索关键词（合并修改 posts-api.ts）
3. **后端完成 1.4+1.5 后**：前端开始 2.3 标签编辑 + 2.4 评论管理回复
4. **后端完成 2.1+2.2 后**：前端开始 2.1 上一篇/下一篇 + 2.5 友链
