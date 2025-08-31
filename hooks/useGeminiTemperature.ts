import { useState, useEffect, useCallback } from 'react';

export const GEMINI_TEMPERATURE_STORAGE_KEY = 'gemini_temperature';
export const DEFAULT_GEMINI_TEMPERATURE = 0.7;

export const useGeminiTemperature = (): [number, (temp: number) => void] => {
  const [temperature, setTemperature] = useState(DEFAULT_GEMINI_TEMPERATURE);

  useEffect(() => {
    try {
      const storedTemp = localStorage.getItem(GEMINI_TEMPERATURE_STORAGE_KEY);
      if (storedTemp) {
        const parsedTemp = parseFloat(storedTemp);
        if (!isNaN(parsedTemp)) {
          setTemperature(parsedTemp);
        }
      } else {
        // If nothing is stored, set to default
        setTemperature(DEFAULT_GEMINI_TEMPERATURE);
      }
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  const saveTemperature = useCallback((temp: number) => {
    try {
      localStorage.setItem(GEMINI_TEMPERATURE_STORAGE_KEY, String(temp));
      setTemperature(temp);
    } catch (e) {
      console.error("Could not access localStorage", e);
    }
  }, []);

  return [temperature, saveTemperature];
};
