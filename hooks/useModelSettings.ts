import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_MODEL } from '../constants';

export const MODEL_STORAGE_KEY = 'gemini_model';

export const useModelSettings = (): [string, (modelId: string) => void] => {
  const [model, setModel] = useState(DEFAULT_MODEL);

  useEffect(() => {
    try {
      const storedModel = localStorage.getItem(MODEL_STORAGE_KEY);
      if (storedModel) {
        setModel(storedModel);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  const saveModel = useCallback((modelId: string) => {
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, modelId);
      setModel(modelId);
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  return [model, saveModel];
};
