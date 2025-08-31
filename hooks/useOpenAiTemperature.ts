import { useState, useEffect, useCallback } from 'react';

export const OPENAI_TEMPERATURE_STORAGE_KEY = 'openai_temperature';
export const DEFAULT_OPENAI_TEMPERATURE = 0.7;

export const useOpenAiTemperature = (): [number, (temp: number) => void] => {
  const [temperature, setTemperature] = useState(DEFAULT_OPENAI_TEMPERATURE);

  useEffect(() => {
    try {
      const storedTemp = localStorage.getItem(OPENAI_TEMPERATURE_STORAGE_KEY);
      if (storedTemp) {
        const parsedTemp = parseFloat(storedTemp);
        if (!isNaN(parsedTemp)) {
          setTemperature(parsedTemp);
        }
      } else {
        // If nothing is stored, set to default
        setTemperature(DEFAULT_OPENAI_TEMPERATURE);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  const saveTemperature = useCallback((temp: number) => {
    try {
      localStorage.setItem(OPENAI_TEMPERATURE_STORAGE_KEY, String(temp));
      setTemperature(temp);
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  return [temperature, saveTemperature];
};
