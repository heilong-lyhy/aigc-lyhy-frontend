// src/features/blog/lib/use-mutation-error.ts

import { useCallback, useReducer } from 'react';

type MutationErrorState = {
  mutationError: string | null;
};

type MutationErrorAction =
  | { type: 'CLEAR_MUTATION_ERROR' }
  | { type: 'MUTATION_ERROR'; payload: string };

const INITIAL_STATE: MutationErrorState = {
  mutationError: null,
};

function mutationErrorReducer(
  _state: MutationErrorState,
  action: MutationErrorAction,
): MutationErrorState {
  switch (action.type) {
    case 'CLEAR_MUTATION_ERROR':
      return { mutationError: null };
    case 'MUTATION_ERROR':
      return { mutationError: action.payload };
    default:
      return _state;
  }
}

export function useMutationError() {
  const [state, dispatch] = useReducer(mutationErrorReducer, INITIAL_STATE);

  const clearMutationError = useCallback(() => dispatch({ type: 'CLEAR_MUTATION_ERROR' }), []);
  const setMutationError = useCallback((message: string) => dispatch({ type: 'MUTATION_ERROR', payload: message }), []);

  return {
    mutationError: state.mutationError,
    clearMutationError,
    setMutationError,
  };
}
