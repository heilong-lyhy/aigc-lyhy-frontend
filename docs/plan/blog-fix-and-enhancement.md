# 博客功能修复与完善计划（前端部分）

> 创建时间：2026-06-13
> 状态：待执行

---

## 需求来源

用户提出的修改点、已知 Bug、缺失功能，经代码审查确认后的修复计划。

---

## 进度跟踪

| 任务 | 状态 | 阻塞项 | 备注 |
|------|------|--------|------|
| 1.1 标签页可见性与权限控制 | 已完成 | 无 | 已实现导航鉴权上下文，Blog/Errors/Account/Lab/Workspace 未登录可见 |
| 1.2 Blog Admin 仅 ADMIN 可见 | 已完成 | 无 | 导航项需登录+ADMIN角色才显示 |
| 1.3 Blog 评论登录态改造 | 待执行 | 后端 2.1 | |
| 1.4 关闭 Throttler 限流 | 已完成 | 无 | 后端已处理 |
| 1.5 Blog 博主固定为 mahiru | 已完成 | 无 | 当前实现已满足，无需改动 |
| 2.1 Admin 侧边栏高亮不跟随 | 已完成 | 无 | 修复 selectedKey 逻辑：/admin 精确匹配 dashboard，其余排除 dashboard 防止 /admin/ 前缀误匹配 |
| 2.2 标签选择框过窄 | 已完成 | 无 | 标签 Select 添加 popupMatchSelectWidth={false} 和 style={{ minWidth: '100%' }} |
| 2.3 文件上传不生效 | 已完成 | 无 | uploadBlogFile 改用原生 fetch + FormData 发送 multipart 请求，绕过 Apollo Client |
| 2.4 操作列"移入回收站"超出边框 | 已完成 | 无 | 操作列改为 Dropdown 菜单 + Modal.confirm 确认删除 |
| 3.1 文章置顶开关 | 待执行 | 无 | 后端已支持 isPinned |
| 3.2 搜索入口可见性 | 待执行 | 无 | BlogLayout 已有搜索导航 |
| 3.3 时间归档入口可见性 | 待执行 | 无 | BlogLayout 已有归档导航 |
| 3.4 关于我/友链页面入口 | 待执行 | 无 | BlogLayout 已有导航 |

---

## 阶段一：标签页权限与可见性（P1）

### 1.1 标签页可见性与权限控制

**问题**：用户要求以下标签页在未登录时可见：Workspace、Account、Blog、Lab、Errors。未登录不可见：Blog Admin、Sandbox。其中 Account 和 Lab 未登录时不展示内容，仅显示"请先登录"。

**当前状态**：
- `catalog.ts` 中 `STABLE_NAVIGATION_ITEMS` 包含 Workspace、Account、Blog
- `GAME_2048_LAB_ITEM`（Lab）在 dev/test 环境可见
- `BLOG_ADMIN_LAB_ITEM` 通过 `shouldShowBlogAdminMenu(env)` 控制，当前仅检查环境，未检查登录态
- `SANDBOX_NAVIGATION_ITEMS` 在 dev/test 可见
- Account 页面已有登录态检查（当前已显示"请先登录"）

**设计决策**：
- Blog Admin 导航项需同时检查环境 + 登录态 + ADMIN 角色
- Lab（Game2048）导航项在未登录时仍可见（环境允许即可），但页面内容需登录
- Sandbox 在 dev/test 环境可见（符合 environment-exposure.md 规范）
- Account 页面已有登录态提示，无需改动
- Errors 页面始终可见，无需改动

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/app/navigation/catalog.ts` | `shouldShowBlogAdminMenu` 增加登录态 + ADMIN 角色检查参数；`getLabNavigationItems` 传入 auth 信息 |
| `src/labs/blog-admin/access.ts` | `shouldShowBlogAdminMenu` 增加 `isAuthenticated` 和 `roles` 参数；未登录或非 ADMIN 时返回 false |
| `src/app/layout` 或导航消费方 | 调用 `getNavigationItems` 时传入当前用户的登录态和角色信息 |

**验收标准**：
- 未登录时导航栏显示：Workspace、Account、Blog、Lab、Errors
- 未登录时 Account 页面显示"请先登录"
- 未登录时 Lab 页面显示"请先登录"或类似提示
- 未登录时不显示 Blog Admin 和 Sandbox
- 登录后 ADMIN 用户可见 Blog Admin
- 登录后非 ADMIN 用户不可见 Blog Admin

### 1.2 Blog Admin 仅 ADMIN 可见

**问题**：Blog Admin 标签页仅 ADMIN 角色可见。

**当前状态**：
- `AdminGuard` 已实现：未登录跳 `/auth`，非 ADMIN 跳 `/`
- `blogAdminAccessList.roles = ['ADMIN']` 已定义
- 但 `shouldShowBlogAdminMenu` 只检查环境，未检查角色

**设计决策**：
- 与 1.1 合并实现：导航项显示需同时满足环境 + 登录态 + ADMIN 角色
- 路由直达的 `AdminGuard` 已正确拦截，无需改动
- `blogAdminAccessList.env` 需添加 `'prod'`，使生产环境 ADMIN 可见

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/labs/blog-admin/access.ts` | `blogAdminAccessList.env` 添加 `'prod'`；`shouldShowBlogAdminMenu` 增加 `isAuthenticated` 和 `roles` 参数 |
| `src/app/navigation/catalog.ts` | `getLabNavigationItems` 接收 auth 参数并传递给 `shouldShowBlogAdminMenu` |

**验收标准**：
- ADMIN 用户在生产环境可见 Blog Admin 导航和页面
- 非 ADMIN 用户不可见 Blog Admin 导航，直达 `/admin` 被重定向到首页
- 未登录用户不可见 Blog Admin 导航，直达 `/admin` 被重定向到登录页

---

## 阶段二：评论登录态改造（P1）

### 2.1 Blog 评论功能登录态改造

**问题**：用户要求删除评论表单中的"昵称"和"邮箱"输入框，这两项从当前登录用户数据自动读取；未登录用户点击评论输入框时弹出"请先登录"提示。

**当前状态**：
- `comment-form.tsx` 有 `authorName` 和 `authorEmail` 输入框
- `comment-fields.tsx` 渲染昵称和邮箱表单项
- `reply-form.tsx` 同样使用 `CommentFields` 组件
- `use-comment.ts` 的 `submitComment` 接收 `authorName` 和 `authorEmail`
- 后端 `CreateBlogCommentInput` 要求 `authorName` 和 `authorEmail` 为必填

**设计决策**：
- 前端删除 `authorName` 和 `authorEmail` 输入框
- 评论提交时从当前登录用户信息自动读取 `nickname` 和 `email`
- 未登录用户点击评论输入框时，显示 Modal 提示"请先登录"，带"去登录"按钮跳转 `/auth`
- 后端需新增 `createBlogCommentByUser` mutation（或修改现有 mutation），从 JWT context 获取用户信息，不再要求前端传递 `authorName`/`authorEmail`
- `CommentFields` 组件移除昵称和邮箱表单项，仅保留内容输入

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/ui/comment-fields.tsx` | 移除 `authorName` 和 `authorEmail` 表单项及相关 props；仅保留内容输入 |
| `src/features/blog/ui/comment-form.tsx` | 移除 `CommentFormValues` 中的 `authorName`/`authorEmail`；从 `useAuth`/`useFullUserInfo` 获取用户信息；未登录时点击输入框弹出登录提示 Modal；`handleSubmit` 自动填充 `authorName`/`authorEmail` |
| `src/features/blog/ui/reply-form.tsx` | 同 comment-form 改造 |
| `src/features/blog/application/use-comment.ts` | `submitComment` 参数保持 `authorName`/`authorEmail`（向后端传递），但调用方从用户信息自动填充 |
| `src/features/blog/infrastructure/comments-api.ts` | 新增 `createBlogCommentByUser` mutation 调用（后端新增的 mutation） |

**验收标准**：
- 已登录用户评论表单无昵称和邮箱输入框
- 已登录用户提交评论时自动使用当前用户的昵称和邮箱
- 未登录用户点击评论输入框时弹出"请先登录"提示
- 点击"去登录"跳转到登录页
- 回复评论同理

---

## 阶段三：Bug 修复（P1）

### 3.1 Admin 侧边栏高亮不跟随选中页

**问题**：Blog Admin 页面左侧选择管理标签时，蓝色高亮一直停留在仪表盘上，不随选中改变。

**当前状态**：
- `admin-layout.tsx` 第 82 行：`selectedKey` 通过 `location.pathname` 匹配
- 匹配逻辑：`ADMIN_NAV_ITEMS.find((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))?.key ?? 'dashboard'`
- 问题在于 `/admin/posts/new` 和 `/admin/posts/:id` 匹配到 `posts`，但 `location.pathname.startsWith('/admin/posts' + '/')` 应该能匹配
- **实际根因**：`/admin` 本身是 index 路由指向 Dashboard，但 `location.pathname === '/admin'` 时匹配不到任何 item（因为 dashboard 的 path 是 `/admin`），而 `startsWith('/admin/')` 也不匹配 `/admin` 本身

**设计决策**：
- 修改 `selectedKey` 计算逻辑：精确匹配 `/admin` → `dashboard`
- 对于子路径如 `/admin/posts/123`，使用 `startsWith` 匹配到 `posts`
- 确保 index 路由 `/admin` 正确高亮 dashboard

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/labs/blog-admin/ui/admin-layout.tsx` | 修改 `selectedKey` 计算逻辑：先精确匹配 `/admin` → `dashboard`；其余路径用 `startsWith` 匹配 |

**验收标准**：
- 访问 `/admin` 时仪表盘高亮
- 访问 `/admin/posts` 时文章管理高亮
- 访问 `/admin/posts/new` 时文章管理高亮
- 访问 `/admin/posts/123` 时文章管理高亮
- 访问其他管理页面时对应项高亮

### 3.2 标签选择框过窄

**问题**：编辑或新建文章时，标签选择框在没有任何标签被选中时过于狭窄，下拉菜单只能看到标签首字母。

**当前状态**：
- `post-editor.tsx` 使用 Ant Design `Select` 组件的 `mode="multiple"`
- 未设置 `minWidth` 或 `style` 属性

**设计决策**：
- 为标签 `Select` 组件设置 `style={{ minWidth: '100%' }}` 或 `className` 确保宽度
- 设置 `popupMatchSelectWidth` 为 false 或适当值，确保下拉菜单宽度足够显示完整标签名
- 设置 `listHeight` 增加下拉菜单可见行数

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/labs/blog-admin/ui/post-editor.tsx` | 标签 `Select` 组件添加 `style={{ minWidth: 200 }}`；设置 `popupMatchSelectWidth={false}` 或适当宽度；设置 `optionLabelProp="label"` 确保选中后显示完整名称 |

**验收标准**：
- 标签选择框在未选中标签时有合理宽度
- 下拉菜单能完整显示标签名称
- 选中标签后显示正常

### 3.3 文件上传不生效

**问题**：文件管理页面点击上传文件可以选择文件，但选中后没有实际上传。

**当前状态**：
- `file-manager.tsx` 使用 Ant Design `Upload` 组件，`customRequest` 调用 `onUpload`
- `files-api.ts` 的 `uploadBlogFile` 使用 `executeGraphQL` 发送 mutation
- 后端 `UploadBlogFileInput.file` 使用 `GraphQLUpload` 标量，需要 multipart/form-data
- **根因**：Apollo Client 的 `HttpLink` 不支持 GraphQL Upload（multipart），`File` 对象无法序列化为 JSON

**设计决策**：
- 方案 A（推荐）：为文件上传使用独立的 HTTP fetch 请求（`/graphql` endpoint + multipart），绕过 Apollo Client
- 方案 B：引入 `@apollo/client` 的 `createUploadLink` 替换 `HttpLink`（影响全局，风险较大）
- 选择方案 A：在 `files-api.ts` 中新增 `uploadFileViaHttp` 函数，使用原生 `fetch` + `FormData` 发送 multipart 请求

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/infrastructure/files-api.ts` | 新增 `uploadFileViaHttp` 函数：构造 `FormData`（operations map file）；使用 `fetch` 发送 multipart POST 到 GraphQL endpoint；携带 Authorization header；解析响应 |
| `src/shared/graphql/request.ts` 或 `src/shared/env` | 导出 `getGraphQLEndpoint` 和 `getAccessToken` 供 `uploadFileViaHttp` 使用（已存在，直接 import） |

**验收标准**：
- 选择文件后实际上传到服务器
- 上传成功后文件列表自动刷新
- 上传失败时显示错误提示
- 上传中显示 loading 状态

### 3.4 操作列"移入回收站"超出边框

**问题**：文章管理页面中"操作"列的"移入回收站"选项超出标签边框。

**设计决策**：
- 将"操作"列改为 Dropdown 菜单（三个点按钮），悬浮展开
- 菜单项包含：编辑、移入回收站、删除（如适用）
- 节省表格空间，避免文字溢出

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/labs/blog-admin/ui/post-list.tsx` | 操作列改为 `Dropdown` + `Button`（三个点图标）；菜单项包含编辑、移入回收站等操作 |

**验收标准**：
- 操作列显示三个点按钮
- 悬浮/点击展开菜单
- 菜单项不超出表格边框
- 所有操作功能正常

---

## 阶段四：缺失功能补全（P2）

### 4.1 文章置顶开关

**问题**：后端已支持 `isPinned` 字段，但前端文章编辑器没有置顶开关。

**当前状态**：
- 后端 `CreateBlogPostInput` 和 `UpdateBlogPostInput` 已有 `isPinned?: boolean`
- 前端 `posts-api.ts` 的 mutation 已包含 `isPinned`
- `use-admin-posts.ts` 的 `create`/`update` 参数未包含 `isPinned`
- `post-editor.tsx` 无置顶开关 UI

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/application/use-admin-posts.ts` | `CreatePostInput` 和 `UpdatePostInput` 添加 `isPinned?: boolean` |
| `src/labs/blog-admin/ui/post-editor.tsx` | 添加"置顶"Switch 开关；绑定到表单 `isPinned` 字段 |
| `src/labs/blog-admin/ui/post-list.tsx` | 文章列表中置顶文章显示"置顶"标签 |

**验收标准**：
- 编辑器可切换文章置顶状态
- 置顶文章在列表中显示"置顶"标签
- 前台首页置顶文章排在最前

### 4.2 搜索入口可见性

**问题**：用户反馈没看到搜索框。

**当前状态**：
- `BlogLayout` 导航栏已有"搜索"链接（`/blog/search`）
- 搜索页面 `BlogSearchPage` 功能完整
- 用户可能未注意到导航栏中的搜索入口

**设计决策**：
- 在 `BlogHomePage` 的侧边栏或顶部添加搜索入口（搜索图标 + 输入框）
- 或在 `BlogSidebar` 中添加搜索框组件
- 保持 BlogLayout 导航栏中的搜索链接

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/ui/blog-sidebar.tsx` | 在博主信息卡片下方添加搜索框（Input.Search），输入后跳转 `/blog/search?q=xxx` |

**验收标准**：
- 首页侧边栏有搜索入口
- 输入关键词后跳转搜索页

### 4.3 时间归档入口可见性

**问题**：用户反馈没看到时间归档功能。

**当前状态**：
- `BlogLayout` 导航栏已有"归档"链接（`/blog/archive`）
- 归档页面 `BlogArchivePage` 功能完整（按年月折叠显示）

**设计决策**：
- 在 `BlogSidebar` 中添加"归档"快捷入口链接
- 当前归档页面功能已完整，无需额外开发

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/ui/blog-sidebar.tsx` | 在分类和标签卡片下方添加"归档"链接卡片 |

**验收标准**：
- 首页侧边栏有归档入口
- 点击跳转归档页

### 4.4 关于我/友链页面入口

**问题**：用户反馈没看到"关于我"和"友链"页面。

**当前状态**：
- `BlogLayout` 导航栏已有"友链"和"关于"链接
- 两个页面功能完整
- 用户可能未注意到导航栏

**设计决策**：
- 在 `BlogSidebar` 中添加"关于"和"友链"快捷入口
- 当前页面功能已完整，无需额外开发

**修改文件**：

| 文件 | 修改内容 |
|------|----------|
| `src/features/blog/ui/blog-sidebar.tsx` | 在归档入口下方添加"关于"和"友链"链接 |

**验收标准**：
- 首页侧边栏有关于和友链入口
- 点击跳转对应页面

---

## 阶段五：关闭 Throttler 限流（P1）

### 5.1 关闭 ThrottlerException: Too Many Requests

**问题**：用户希望关闭请求限流功能。

**当前状态**：
- 后端 `AppThrottlerModule` 配置了全局 `GqlThrottlerGuard`
- 限流规则：short（60s/60次）、publicWrite（60s/10次）
- 测试环境已跳过限流

**设计决策**：
- 前端无需改动
- 后端移除 `APP_GUARD` 注册即可关闭全局限流
- 保留 `ThrottlerModule` 和 `GqlThrottlerGuard` 代码，仅取消全局注册
- 如需恢复，重新注册即可

**验收标准**：
- 不再出现 ThrottlerException
- 正常请求不受限流影响

---

## 阶段六：Blog 博主固定（P1）

### 6.1 Blog 博主固定为 mahiru 账号

**问题**：Blog 前台的博主信息应固定为 mahiru 账号，不随登录用户变化。

**当前状态**：
- 后端 `GetBlogProfileUsecase` 查询 `blog_profile` 表的第一条记录
- 前端 `useBlogProfile` 调用 `blogProfile` query
- 博主信息与登录用户无关，已经是独立数据

**设计决策**：
- 前端无需改动
- 后端 `blog_profile` 表存储博主信息，与用户账号系统独立
- 只需确保 `blog_profile` 表中有一条 mahiru 的记录即可

**验收标准**：
- Blog 前台始终显示 mahiru 的博主信息
- 切换登录账号不影响博主信息显示

---

## 自检清单

- [ ] `tsc --noEmit` 无错误
- [ ] `npm run test` 全部通过
- [ ] 未登录时导航栏显示正确
- [ ] ADMIN 用户可见 Blog Admin
- [ ] 非 ADMIN 用户不可见 Blog Admin
- [ ] 评论表单无昵称/邮箱输入框
- [ ] 未登录点击评论弹出登录提示
- [ ] Admin 侧边栏高亮正确跟随
- [ ] 标签选择框宽度合理
- [ ] 文件上传功能正常
- [ ] 操作列改为下拉菜单
- [ ] 文章编辑器有置顶开关
- [ ] 侧边栏有搜索/归档/关于/友链入口
