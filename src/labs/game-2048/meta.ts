// src/labs/game-2048/meta.ts

export const game2048LabMeta = {
  name: '2048 Lab',
  purpose: '本地 2048 交互实验，验证游戏类实验在 labs 中的受控暴露',
  owner: 'frontend',
  reviewAt: '2026-09-30',
  rollback: '移除 /labs/game-2048 路由和导航入口',
  exception: [] as const,
  path: '/labs/game-2048',
} as const;
