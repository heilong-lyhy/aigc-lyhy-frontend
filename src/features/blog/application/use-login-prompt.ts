// src/features/blog/application/use-login-prompt.ts

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';

const LOGIN_PROMPT_TITLE = '请先登录';
const LOGIN_BUTTON_TEXT = '去登录';

type UseLoginPromptOptions = {
  readonly message: string;
};

type UseLoginPromptReturn = {
  readonly loginModalOpen: boolean;
  readonly loginPromptTitle: string;
  readonly loginButtonText: string;
  readonly loginPromptMessage: string;
  readonly handleFocus: () => void;
  readonly handleLoginRedirect: () => void;
  readonly closeLoginModal: () => void;
};

export function useLoginPrompt({ message }: UseLoginPromptOptions): UseLoginPromptReturn {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleFocus = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  const handleLoginRedirect = useCallback(() => {
    setLoginModalOpen(false);
    navigate('/auth');
  }, [navigate]);

  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false);
  }, []);

  return {
    loginModalOpen,
    loginPromptTitle: LOGIN_PROMPT_TITLE,
    loginButtonText: LOGIN_BUTTON_TEXT,
    loginPromptMessage: message,
    handleFocus,
    handleLoginRedirect,
    closeLoginModal,
  };
}
