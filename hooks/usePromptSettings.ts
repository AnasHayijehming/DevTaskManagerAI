import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_PROMPTS, PROMPTS_STORAGE_KEY, PromptKeys } from '../constants/prompts';

export const usePromptSettings = () => {
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);

  useEffect(() => {
    try {
      const storedPrompts = localStorage.getItem(PROMPTS_STORAGE_KEY);
      if (storedPrompts) {
        setPrompts({ ...DEFAULT_PROMPTS, ...JSON.parse(storedPrompts) });
      }
    } catch (e) {
      console.error("Could not access localStorage for prompts", e);
    }
  }, []);

  const saveAllPrompts = useCallback((newPrompts: Record<PromptKeys, string>) => {
    try {
      localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(newPrompts));
      setPrompts({ ...DEFAULT_PROMPTS, ...newPrompts });
    } catch (e) {
      console.error("Could not save prompts to localStorage", e);
    }
  }, []);
  
  const resetAllPrompts = useCallback(() => {
    try {
      localStorage.removeItem(PROMPTS_STORAGE_KEY);
      setPrompts(DEFAULT_PROMPTS);
    } catch (e) {
        console.error("Could not reset prompts in localStorage", e);
    }
  }, []);

  return { prompts, saveAllPrompts, resetAllPrompts, defaultPrompts: DEFAULT_PROMPTS };
};
export { PromptKeys };
