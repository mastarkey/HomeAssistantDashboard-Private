// Hook for managing custom user-added entities

import { useState, useEffect } from 'react';
import { haStorage, STORAGE_KEYS } from '../services/haStorage';

export interface CustomEntity {
  id: string;
  name: string;
  type: string; // light, switch, sensor, climate, etc.
  room: string;
  state: string;
  attributes: Record<string, any>;
  isCustom: true; // Flag to identify custom entities
  createdAt: number;
}

export function useCustomEntities() {
  const [customEntities, setCustomEntities] = useState<Record<string, CustomEntity>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from HA storage on mount
  useEffect(() => {
    const loadEntities = async () => {
      try {
        const stored = await haStorage.getItem(STORAGE_KEYS.CUSTOM_ENTITIES);
        if (stored) {
          setCustomEntities(stored);
        }
      } catch (e) {
        // Failed to load custom entities
      } finally {
        setIsLoading(false);
      }
    };
    loadEntities();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      haStorage.setItem(STORAGE_KEYS.CUSTOM_ENTITIES, customEntities);
    }
  }, [customEntities, isLoading]);

  const addCustomEntity = (entity: Omit<CustomEntity, 'id' | 'createdAt' | 'isCustom'>) => {
    const id = `custom.${entity.type}_${Date.now()}`;
    const newEntity: CustomEntity = {
      ...entity,
      id,
      isCustom: true,
      createdAt: Date.now(),
    };
    
    setCustomEntities(prev => ({
      ...prev,
      [id]: newEntity
    }));
    
    return id;
  };

  const updateCustomEntity = (id: string, updates: Partial<CustomEntity>) => {
    setCustomEntities(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
        attributes: {
          ...prev[id]?.attributes,
          ...updates.attributes,
        }
      }
    }));
  };
  
  const moveCustomEntityToRoom = (id: string, newRoom: string) => {
    setCustomEntities(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        room: newRoom,
      }
    }));
  };

  const deleteCustomEntity = (id: string) => {
    setCustomEntities(prev => {
      const newEntities = { ...prev };
      delete newEntities[id];
      return newEntities;
    });
  };

  const getCustomEntitiesAsArray = (): [string, CustomEntity][] => {
    return Object.entries(customEntities);
  };

  return {
    customEntities,
    addCustomEntity,
    updateCustomEntity,
    moveCustomEntityToRoom,
    deleteCustomEntity,
    getCustomEntitiesAsArray,
  };
}