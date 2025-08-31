import { useState, useEffect, useCallback } from 'react';

export const OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';

export const useOpenAiApiKey = (): [string, (key: string) => void] => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
      if (storedKey) {
        setApiKey(storedKey);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  const saveApiKey = useCallback((key: string) => {
    try {
      localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, key);
      setApiKey(key);
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  return [apiKey, saveApiKey];
};
