import { useState } from 'react';

// Like useState, but remembered in the browser (e.g. grid / list view). Works even if storage is blocked.
export function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  });

  function update(next) {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* storage not available: keep the value only in memory */
    }
  }

  return [value, update];
}
