import { useEffect, useState } from 'react';

// Returns the value only after it stopped changing for `delay` ms (used for search-as-you-type).
export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
