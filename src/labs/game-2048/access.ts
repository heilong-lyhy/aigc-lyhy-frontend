// src/labs/game-2048/access.ts

import type { AppEnv } from '@/shared/env';

export const game2048AccessList = {
  env: ['dev', 'test'] as const,
  roles: [] as const,
  menu: true,
};

export function canAccessGame2048Lab(env: AppEnv) {
  return (game2048AccessList.env as readonly AppEnv[]).includes(env);
}
