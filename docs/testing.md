<!-- docs/testing.md -->

# Testing

- Use Vitest for unit tests close to pure logic.
- Keep route and UI tests focused on the behavior being changed.
- For narrow changes, prefer `npx tsc --noEmit` and `npm run lint`.
- For larger shell or routing changes, add browser-level coverage before production use.

## Vitest 配置

- 测试文件匹配：`src/**/*.spec.ts`、`src/**/*.spec.tsx`
- 默认 DOM 模拟器：`happy-dom`（在需要 DOM 的 spec 文件顶部添加 `// @vitest-environment happy-dom`）
- setup 文件：`src/shared/test/setup.ts`（位于 stable 区 `shared` 内）
- GraphQL stub 别名：vitest 配置中将 `@/shared/graphql` 别名到 `src/shared/test/stubs/graphql.ts`，防止测试环境加载 Apollo Client 导致 OOM
- `isolate: true`：每个测试文件独立隔离
- `.tsx` 组件测试需要 `@vitejs/plugin-react` 插件支持（已在 vitest.config.ts 中配置）

## 测试夹具位置

- 跨域通用测试夹具（如 GraphQL stub、Apollo mock）放在 `src/shared/test/stubs/`
- 具体业务切片的 mock 数据跟随 `feature/infrastructure/`，不放进 `shared`
- 不在 `src/test/` 目录放置测试文件（该目录不在 stable 区内）

## E2E 测试

- E2E 测试放在仓库根 `e2e/` 目录
- 使用 Playwright
- `playwright.config.ts` 中 `baseURL` 默认 `http://localhost:5173`，可通过 `BASE_URL` 环境变量覆盖
