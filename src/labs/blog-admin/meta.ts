// src/labs/blog-admin/meta.ts

export const blogAdminLabMeta = {
  name: 'Blog Admin',
  purpose: '博客管理端布局和仪表盘，当前仅实现仪表盘页面，仍在迭代中，先放 labs 观察',
  owner: 'frontend',
  reviewAt: '2026-09-30',
  rollback: '移除 /admin 路由组、导航项和 labs 入口',
  exception: [
    '使用 @/entities/blog 公开类型 BlogDashboard（仅 type-only 依赖）',
  ],
  notes: [
    '环境检查由 canAccessBlogAdminLab (labs/access.ts) 在 router loader 执行',
    '角色检查由 AdminGuard (app/lib) 在路由 element 层执行，内嵌 ADMIN_ROLE 常量',
    '数据获取由 AdminDashboardPage (app/router) 调用 features hook，labs 只承载纯 UI',
    '迁入 stable 时应重组为 pages/admin/dashboard + 内部 application 层',
  ],
} as const;
