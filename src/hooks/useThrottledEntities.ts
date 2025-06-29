import { useState, useEffect, useRef } from 'react';

// Custom hook to throttle entity updates and reduce re-renders
export function useThrottledEntities(entities: any, delay: number = 100) {
  const [throttledEntities, setThrottledEntities] = useState(entities);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!entities) {
      setThrottledEntities(null);
      return;
    }

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // If enough time has passed, update immediately
    if (timeSinceLastUpdate >= delay) {
      setThrottledEntities(entities);
      lastUpdateRef.current = now;
      return;
    }

    // Otherwise, schedule an update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setThrottledEntities(entities);
      lastUpdateRef.current = Date.now();
    }, delay - timeSinceLastUpdate);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [entities, delay]);

  return throttledEntities;
}