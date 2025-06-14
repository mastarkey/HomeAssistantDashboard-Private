// Hook for managing entity overrides (room assignments, names, etc.)

import { useState, useEffect } from 'react';

export interface EntityOverride {
  entityId: string;
  room?: string;
  friendlyName?: string;
  hidden?: boolean;
}

const STORAGE_KEY = 'ha-dashboard-entity-overrides';

export function useEntityOverrides() {
  const [overrides, setOverrides] = useState<Record<string, EntityOverride>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse entity overrides:', e);
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const setEntityOverride = (entityId: string, override: Partial<EntityOverride>) => {
    setOverrides(prev => ({
      ...prev,
      [entityId]: {
        ...prev[entityId],
        ...override,
        entityId,
      }
    }));
  };

  const removeEntityOverride = (entityId: string) => {
    setOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[entityId];
      return newOverrides;
    });
  };

  const getEntityOverride = (entityId: string): EntityOverride | null => {
    return overrides[entityId] || null;
  };

  const getEffectiveRoom = (entityId: string, defaultRoom?: string): string => {
    const override = overrides[entityId];
    return override?.room || defaultRoom || 'other';
  };

  const getEffectiveName = (entityId: string, defaultName?: string): string => {
    const override = overrides[entityId];
    return override?.friendlyName || defaultName || entityId;
  };

  return {
    overrides,
    setEntityOverride,
    removeEntityOverride,
    getEntityOverride,
    getEffectiveRoom,
    getEffectiveName,
  };
}