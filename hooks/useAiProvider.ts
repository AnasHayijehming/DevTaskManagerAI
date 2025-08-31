import { useState, useEffect, useCallback } from 'react';

export type AiProvider = 'gemini' | 'openai';
export const AI_PROVIDER_STORAGE_KEY = 'ai_provider';

export const useAiProvider = (): [AiProvider, (provider: AiProvider) => void] => {
  const [provider, setProvider] = useState<AiProvider>('gemini');

  useEffect(() => {
    try {
      const storedProvider = localStorage.getItem(AI_PROVIDER_STORAGE_KEY) as AiProvider | null;
      if (storedProvider && (storedProvider === 'gemini' || storedProvider === 'openai')) {
        setProvider(storedProvider);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  const saveProvider = useCallback((newProvider: AiProvider) => {
    try {
      localStorage.setItem(AI_PROVIDER_STORAGE_KEY, newProvider);
      setProvider(newProvider);
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  return [provider, saveProvider];
};
