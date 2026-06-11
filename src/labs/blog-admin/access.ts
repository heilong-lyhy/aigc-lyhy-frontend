// src/labs/blog-admin/access.ts

import type { AppEnv } from '@/shared/env';

/**
 * Blog Admin Lab 的结构化 access list
 * 遵循 labs-rules.md 要求：
 * - env: 允许暴露的环境列表
 * - roles: 允许访问的角色列表（空数组表示不限制角色，由 guard 层控制）
 * - menu: 是否在导航中显示入口
 *
 * access list 同时控制导航入口和路由直达，不只是隐藏菜单
 */
export const blogAdminAccessList = {
  env: ['dev', 'test'] as readonly AppEnv[],
  roles: ['ADMIN'] as readonly string[],
  menu: true,
} as const;

/**
 * 判断当前环境是否允许访问 Blog Admin Lab
 * 用于 router loader 层的环境隔离
 */
export function canAccessBlogAdminLab(env: AppEnv): boolean {
  return blogAdminAccessList.env.includes(env);
}

/**
 * 判断指定角色是否允许访问 Blog Admin Lab
 * 用于路由直达的访问控制（与 AdminGuard 配合）
 */
export function canAccessBlogAdminLabByRole(roles: readonly string[]): boolean {
  if (blogAdminAccessList.roles.length === 0) {
    return true;
  }
  return roles.some((role) => blogAdminAccessList.roles.includes(role));
}

/**
 * 判断 Blog Admin Lab 是否应在导航中显示
 */
export function shouldShowBlogAdminMenu(env: AppEnv): boolean {
  return canAccessBlogAdminLab(env) && blogAdminAccessList.menu;
}
