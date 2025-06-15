// Hook for managing entity overrides (room assignments, names, etc.)

import { useState, useEffect } from 'react';
import { haStorage, STORAGE_KEYS } from '../services/haStorage';

export interface EntityOverride {
  entityId: string;
  room?: string;
  friendlyName?: string;
  hidden?: boolean;
}

export function useEntityOverrides() {
  const [overrides, setOverrides] = useState<Record<string, EntityOverride>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from HA storage on mount
  useEffect(() => {
    const loadOverrides = async () => {
      try {
        const stored = await haStorage.getItem(STORAGE_KEYS.ENTITY_OVERRIDES);
        if (stored) {
          setOverrides(stored);
        }
      } catch (e) {
        // Failed to load entity overrides
      } finally {
        setIsLoading(false);
      }
    };
    loadOverrides();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      haStorage.setItem(STORAGE_KEYS.ENTITY_OVERRIDES, overrides);
    }
  }, [overrides, isLoading]);

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