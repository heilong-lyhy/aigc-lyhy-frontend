// src/labs/blog-admin/access.ts

import type { AppEnv } from '@/shared/env';

const ALLOWED_ENVS: readonly AppEnv[] = ['dev', 'prod'];

export function canAccessBlogAdminLab(env: AppEnv): boolean {
  return ALLOWED_ENVS.includes(env);
}
