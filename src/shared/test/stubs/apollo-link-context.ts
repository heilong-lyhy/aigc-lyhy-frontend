// src/shared/test/stubs/apollo-link-context.ts

export function setContext() {
  return (next: unknown) => next;
}
