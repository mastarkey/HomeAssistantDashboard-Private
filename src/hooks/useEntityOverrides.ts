// Hook for managing entity overrides (room assignments, names, etc.)

import { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../services/haStorage';
import { storageManager } from '../services/storageManager';
import { normalizeRoomName } from '../utils/roomNormalization';

export interface EntityOverride {
  entityId: string;
  room?: string;
  friendlyName?: string;
  hidden?: boolean;
}

// Normalize room IDs for consistent comparison
export function normalizeRoomId(room: string): string {
  return room.toLowerCase().replace(/[\s_]+/g, '_');
}

const STORAGE_VERSION = 2;

// Migration function for version upgrades
function migrateOverrides(oldData: any, oldVersion: number): Record<string, EntityOverride> {
  // Version 0->1: Legacy format (direct object)
  if (oldVersion === 0) {
    return oldData || {};
  }
  
  // Version 1->2: Add validation
  if (oldVersion === 1) {
    const validated: Record<string, EntityOverride> = {};
    if (oldData && typeof oldData === 'object') {
      Object.entries(oldData).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          validated[key] = value as EntityOverride;
        }
      });
    }
    return validated;
  }

  return oldData;
}

export function useEntityOverrides() {
  const [overrides, setOverrides] = useState<Record<string, EntityOverride>>({});
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');

  // Load from storage on mount
  useEffect(() => {
    const loadOverrides = async () => {
      try {
        console.log('[useEntityOverrides] Loading entity overrides...');
        const stored = await storageManager.getItem(
          STORAGE_KEYS.ENTITY_OVERRIDES,
          {},
          {
            version: STORAGE_VERSION,
            migrate: migrateOverrides
          }
        );
        
        if (stored && Object.keys(stored).length > 0) {
          console.log(`[useEntityOverrides] Loaded ${Object.keys(stored).length} overrides`);
          setOverrides(stored);
        } else {
          console.log('[useEntityOverrides] No overrides found');
        }
      } catch (e) {
        console.error('[useEntityOverrides] Failed to load:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadOverrides();
  }, []);

  // Save to storage with debouncing
  useEffect(() => {
    if (isLoading) return;

    // Create a stable string representation for comparison
    const currentData = JSON.stringify(overrides);
    if (currentData === lastSaveRef.current) {
      return; // No changes to save
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves by 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log(`[useEntityOverrides] Saving ${Object.keys(overrides).length} overrides`);
        await storageManager.setItem(
          STORAGE_KEYS.ENTITY_OVERRIDES, 
          overrides,
          STORAGE_VERSION
        );
        lastSaveRef.current = currentData;
      } catch (e) {
        console.error('[useEntityOverrides] Failed to save:', e);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [overrides, isLoading]);

  const setEntityOverride = (entityId: string, override: Partial<EntityOverride>) => {
    console.log(`[useEntityOverrides] Setting override for ${entityId}:`, override);
    setOverrides(prev => {
      // Normalize room ID if provided
      const normalizedOverride = {
        ...override,
        ...(override.room ? { room: normalizeRoomId(override.room) } : {})
      };
      
      const newOverrides = {
        ...prev,
        [entityId]: {
          ...prev[entityId],
          ...normalizedOverride,
          entityId,
        }
      };
      
      // Validate the override
      if (!normalizedOverride.room && !normalizedOverride.friendlyName && !normalizedOverride.hidden) {
        // If all override fields are empty, remove the override
        delete newOverrides[entityId];
      }
      
      return newOverrides;
    });
  };

  const removeEntityOverride = (entityId: string) => {
    console.log(`[useEntityOverrides] Removing override for ${entityId}`);
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
    const room = override?.room || defaultRoom || 'other';
    // First normalize the room name (master_bedroom -> bedroom), then normalize to ID format
    const normalizedName = normalizeRoomName(room);
    return normalizeRoomId(normalizedName);
  };

  const getEffectiveName = (entityId: string, defaultName?: string): string => {
    const override = overrides[entityId];
    return override?.friendlyName || defaultName || entityId;
  };

  // Debug function
  const debugOverrides = async () => {
    console.group('[useEntityOverrides] Debug Info');
    console.log('Current overrides:', overrides);
    console.log('Is loading:', isLoading);
    await storageManager.debugStorage(STORAGE_KEYS.ENTITY_OVERRIDES);
    console.groupEnd();
  };

  return {
    overrides,
    setEntityOverride,
    removeEntityOverride,
    getEntityOverride,
    getEffectiveRoom,
    getEffectiveName,
    debugOverrides,
    isLoading
  };
}