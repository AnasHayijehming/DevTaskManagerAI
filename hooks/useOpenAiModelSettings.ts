import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_OPENAI_MODEL } from '../constants';

export const OPENAI_MODEL_STORAGE_KEY = 'openai_model';

export const useOpenAiModelSettings = (): [string, (modelId: string) => void] => {
  const [model, setModel] = useState(DEFAULT_OPENAI_MODEL);

  useEffect(() => {
    try {
      const storedModel = localStorage.getItem(OPENAI_MODEL_STORAGE_KEY);
      if (storedModel) {
        setModel(storedModel);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  const saveModel = useCallback((modelId: string) => {
    try {
      localStorage.setItem(OPENAI_MODEL_STORAGE_KEY, modelId);
      setModel(modelId);
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  return [model, saveModel];
};
