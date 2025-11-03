import { useCallback } from "react";

/**
 * Custom hook for interacting with localStorage safely.
 * Handles JSON parsing/stringifying and avoids errors on SSR.
 */
export function useLocalStorage() {
  const getItem = useCallback(<T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, []);

  const setItem = useCallback(<T,>(key: string, value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, []);

  const removeItem = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, []);

  return { getItem, setItem, removeItem };
}
