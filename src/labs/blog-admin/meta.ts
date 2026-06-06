// src/labs/blog-admin/meta.ts

export const blogAdminLabMeta = {
  name: 'Blog Admin',
  purpose: '博客管理端：仪表盘、文章管理（列表+编辑器）、分类/标签/评论管理，仍在迭代中，先放 labs 观察',
  owner: 'frontend',
  reviewAt: '2026-09-30',
  rollback: '移除 /admin 路由组、导航项和 labs 入口',
  exception: [] as const,
  notes: [
    '环境检查由 canAccessBlogAdminLab (labs/access.ts) 在 router loader 执行',
    '角色检查由 AdminGuard (app/lib) 在路由 element 层执行，内嵌 ADMIN_ROLE 常量',
    '数据获取由 AdminDashboardPage/AdminPostListPage/AdminPostEditorPage (app/router) 调用 features hook，labs 只承载纯 UI',
    'usePostEditor 已迁至 features/blog/hooks，PostEditorForm 类型定义在 entities/blog/types',
    'useAutoSave (features/blog) 通过 app/router wrapper 调用，使用 blog-storage 持久化草稿',
    '对 @/entities/blog 公开函数（formatAbsoluteDate、toCurrentPage 等）的依赖属于 labs 规则允许范围，不列为 exception',
    '迁入 stable 时应重组为 pages/admin/ + 内部 application 层',
  ],
} as const;
