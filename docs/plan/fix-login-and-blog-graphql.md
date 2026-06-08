# 修复计划：登录流程改造 & Blog GraphQL 类型对齐（前端部分）

> 创建时间：2026-06-08
> 状态：待执行

---

## 问题一：登录界面改造

### 现状

1. 导航栏中登录入口标签为 **Admin**，路径 `/admin`，用户容易误解为管理后台而非登录入口
2. 首次打开网页时默认进入 Workspace 首页，未自动引导至登录页
3. 未登录状态下，Blog 等功能页面无提示，用户无法感知需要先登录

### 目标

1. 导航栏中将 **Admin** 标签改为 **Login**，路径指向 `/auth`
2. 首次打开网页时（未登录状态），自动跳转至 Login 页面
3. 未登录时，Blog 等需要认证的功能页面显示提示文案"请先登录"，其中"登录"为超链接，点击跳转至 Login 页面

### 修改方案

#### 1. 导航标签 Admin → Login

**文件**：`src/app/navigation/catalog.ts`

```diff
 const BLOG_ADMIN_LAB_ITEM: NavigationItem = {
-  label: 'Admin',
-  path: '/admin',
-  tags: ['admin', 'dashboard', 'manage', '管理', '仪表盘'],
+  label: 'Login',
+  path: '/auth',
+  tags: ['login', 'auth', '登录', '认证'],
 };
```

#### 2. 未登录自动跳转至 Login 页面

**文件**：`src/app/layout/app-layout.tsx`

在 `AppLayout` 组件中增加 `useEffect`，当 `isAuthenticated === false` 且当前路径不是 `/auth` 时，自动跳转：

```tsx
useEffect(() => {
  if (!isAuthenticated && location.pathname !== '/auth') {
    navigate('/auth', { replace: true });
  }
}, [isAuthenticated, location.pathname, navigate]);
```

#### 3. 未登录功能页显示"请先登录"提示

**新增组件**：`src/shared/ui/login-prompt.tsx`

```tsx
import { Link } from 'react-router';

export function LoginPrompt() {
  return (
    <div className="flex items-center justify-center py-20 text-text-secondary">
      请先<Link to="/auth" className="text-primary underline">登录</Link>
    </div>
  );
}
```

**修改**：`src/app/layout/app-layout.tsx`

在渲染 `<Outlet />` 的位置，未登录且不在 `/auth` 或 `/` 时显示提示：

```tsx
{!isAuthenticated && location.pathname !== '/auth' && location.pathname !== '/' ? (
  <LoginPrompt />
) : (
  children ?? <Outlet />
)}
```

#### 4. Auth 页面标题调整

**文件**：`src/pages/auth/index.tsx`

```diff
 <PageHeader
-  description="登录或注册以继续使用 AIGC 工作台"
-  title="认证"
+  description="登录或注册以继续使用"
+  title="Login"
 />
```

---

## 问题二：Blog GraphQL 类型不匹配（前端部分）

### 现状

前端 GraphQL 查询中存在两个类型不匹配问题：

1. **sortOrder 参数类型**：前端声明为 `String`，后端期望枚举类型 `SortDirection`（值为 `ASC` / `DESC`）
2. **Fragment 类型名**：前端使用 `on BlogPost`、`on BlogPostDetail` 等，后端实际 Schema 类型名为 `BlogPostObjectType`、`BlogPostDetailObjectType` 等（需后端配合修改，见后端计划）

### 修改方案

#### 1. sortOrder 类型 String → SortDirection

**涉及文件**：

| 文件 | 修改 |
|---|---|
| `src/features/blog/infrastructure/posts-api.ts` | `$sortOrder: String` → `$sortOrder: SortDirection`（2处） |
| `src/features/blog/infrastructure/comments-api.ts` | `$sortOrder: String` → `$sortOrder: SortDirection`（2处） |
| `src/features/blog/infrastructure/files-api.ts` | `$sortOrder: String` → `$sortOrder: SortDirection`（1处） |

#### 2. Fragment 类型名（依赖后端修改）

后端 `@ObjectType` 添加显式 `name` 后（如 `@ObjectType('BlogPost')`），前端 fragment 中的类型名 `BlogPost`、`BlogPostDetail`、`BlogComment` 等将与后端对齐，无需修改。

若后端未改 name，则需将前端所有 fragment 的类型名改为后端实际名：

| 当前前端 fragment | 需改为（如后端未改 name） |
|---|---|
| `on BlogPost` | `on BlogPostObjectType` |
| `on BlogPostDetail` | `on BlogPostDetailObjectType` |
| `on BlogComment` | `on BlogCommentObjectType` |
| `on BlogFile` | `on BlogFileObjectType` |

---

## 执行顺序

1. 先等后端完成 ObjectType name 修改并重启
2. 修改前端 sortOrder 类型
3. 修改导航标签和登录流程
4. 端到端验证
