// src/app/navigation/catalog.ts

import { ADMIN_ROLE } from '@/app/lib';

import { type AppEnv, getAppEnv } from '@/shared/env';

import type { NavigationItem } from './types';

// Account 和 Blog 对所有用户公开，其余页面仅 ADMIN 可见
const STABLE_PUBLIC_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    description: '技术文章与生活随笔。',
    id: 'blog',
    kind: 'stable',
    label: 'Blog',
    path: '/blog',
    tags: ['blog', 'article', 'post', '博客', '文章'],
  },
  {
    description: '管理您的账户信息。',
    id: 'account',
    kind: 'stable',
    label: 'Account',
    path: '/account',
    tags: ['account', 'profile', 'user', '账户', '个人资料'],
  },
];

const STABLE_ADMIN_NAVIGATION_ITEMS: NavigationItem[] = [
  {
    description: '面向 AI 辅助开发的主工作台。',
    id: 'home',
    kind: 'stable',
    label: 'Workspace',
    path: '/',
    tags: ['home', 'workbench', 'aigc', 'assistant', 'dashboard', '工作台', '助手'],
  },
  {
    description: '博客管理后台：文章、评论、标签、文件等。',
    id: 'blog-admin',
    kind: 'stable',
    label: 'Blog Admin',
    path: '/admin',
    tags: ['blog', 'admin', 'dashboard', 'management', '博客', '管理', '后台'],
  },
  {
    description: '预览通用路由和运行时错误反馈。',
    id: 'error-preview',
    kind: 'stable',
    label: 'Errors',
    path: '/error-preview',
    tags: ['error', 'feedback', '404', '500', 'route', '错误页', '异常反馈'],
  },
];

const GAME_2048_LAB_ITEM: NavigationItem = {
  description: '受控开放的 2048 交互实验。',
  id: 'game-2048-lab',
  kind: 'labs',
  label: 'Lab',
  path: '/labs/game-2048',
  tags: ['lab', '2048', 'game', 'experiment', '游戏', '实验'],
};

// Each lab has its own access list in its access.ts.
// IMPORTANT: Do not duplicate env/role checks here; use the lab's own access functions.
const GAME_2048_ALLOWED_ENVS: readonly AppEnv[] = ['dev', 'test']; // sync with labs/game-2048/access.ts

function canExposeSandbox(env: AppEnv) {
  return env === 'dev' || env === 'test';
}

export interface NavigationAuthContext {
  isAuthenticated: boolean;
  accessGroup: readonly string[];
}

function hasAdminAccess(auth: NavigationAuthContext | undefined): boolean {
  return !!auth?.isAuthenticated && auth.accessGroup.some((role) => role === ADMIN_ROLE);
}

function getStableAdminNavigationItems(
  auth: NavigationAuthContext | undefined,
): NavigationItem[] {
  // Workspace、Blog Admin、Errors 均需要 ADMIN 角色
  if (!hasAdminAccess(auth)) {
    return [];
  }

  return STABLE_ADMIN_NAVIGATION_ITEMS;
}

function getLabNavigationItems(
  env: AppEnv,
  auth: NavigationAuthContext | undefined,
): NavigationItem[] {
  // Lab：需要 ADMIN 角色 + 环境允许
  if (!hasAdminAccess(auth)) {
    return [];
  }

  const items: NavigationItem[] = [];

  if (GAME_2048_ALLOWED_ENVS.includes(env)) {
    items.push(GAME_2048_LAB_ITEM);
  }

  return items;
}

function getSandboxNavigationItems(
  env: AppEnv,
  auth: NavigationAuthContext | undefined,
): NavigationItem[] {
  // Sandbox：需要 ADMIN 角色 + 允许的环境
  if (!hasAdminAccess(auth)) {
    return [];
  }

  if (canExposeSandbox(env)) {
    return [
      {
        description: '用于一次性检查主题 token 的开发试验台。',
        id: 'sandbox-playground',
        kind: 'sandbox',
        label: 'Sandbox',
        path: '/sandbox/playground',
        tags: ['sandbox', 'prototype', 'playground', 'token', 'theme', '沙盒', '主题'],
      },
    ];
  }

  return [];
}

export function getNavigationItems(
  env = getAppEnv(),
  auth?: NavigationAuthContext,
): NavigationItem[] {
  return [
    ...STABLE_PUBLIC_NAVIGATION_ITEMS,
    ...getStableAdminNavigationItems(auth),
    ...getLabNavigationItems(env, auth),
    ...getSandboxNavigationItems(env, auth),
  ];
}
