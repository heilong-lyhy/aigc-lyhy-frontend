// src/shared/test/stubs/apollo-client.ts

export const ApolloClient = class {};
export const InMemoryCache = class {};
export const HttpLink = class {};
export function gql(strings: TemplateStringsArray): string {
  return strings.join('');
}
export function useQuery() {
  return { data: null, loading: false, error: null };
}
export function useMutation() {
  return [() => Promise.resolve({ data: null }), { data: null, loading: false, error: null }];
}
export function useLazyQuery() {
  return [() => Promise.resolve({ data: null }), { data: null, loading: false, error: null }];
}
export function useApolloClient() {
  return { client: null };
}
