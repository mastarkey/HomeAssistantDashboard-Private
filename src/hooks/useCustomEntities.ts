// Hook for managing custom user-added entities

import { useState, useEffect } from 'react';

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

const STORAGE_KEY = 'ha-dashboard-custom-entities';

export function useCustomEntities() {
  const [customEntities, setCustomEntities] = useState<Record<string, CustomEntity>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse custom entities:', e);
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customEntities));
  }, [customEntities]);

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
    deleteCustomEntity,
    getCustomEntitiesAsArray,
  };
}