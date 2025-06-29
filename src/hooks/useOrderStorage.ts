// Hook for managing card order persistence in HA storage

import { useState, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../services/haStorage';
import { storageManager } from '../services/storageManager';

interface OrderStorage {
  rooms: string[];
  categories: string[];
  devices: Record<string, string[]>; // roomId/categoryId -> entityIds
}

const STORAGE_VERSION = 2;
const DEFAULT_ORDER: OrderStorage = {
  rooms: [],
  categories: [],
  devices: {}
};

// Migration function for version upgrades
function migrateOrder(oldData: any, oldVersion: number): OrderStorage {
  // Version 0->1: Legacy format
  if (oldVersion === 0) {
    return {
      rooms: oldData?.rooms || [],
      categories: oldData?.categories || [],
      devices: oldData?.devices || {}
    };
  }
  
  // Version 1->2: Add validation
  if (oldVersion === 1) {
    const validated: OrderStorage = {
      rooms: Array.isArray(oldData?.rooms) ? oldData.rooms : [],
      categories: Array.isArray(oldData?.categories) ? oldData.categories : [],
      devices: {}
    };
    
    // Validate devices object
    if (oldData?.devices && typeof oldData.devices === 'object') {
      Object.entries(oldData.devices).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          validated.devices[key] = value;
        }
      });
    }
    
    return validated;
  }

  return oldData;
}

export function useOrderStorage() {
  const [order, setOrder] = useState<OrderStorage>(DEFAULT_ORDER);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');

  // Load from storage on mount
  useEffect(() => {
    const loadOrder = async () => {
      try {
        console.log('[useOrderStorage] Loading card order...');
        const stored = await storageManager.getItem(
          STORAGE_KEYS.CARD_ORDER,
          DEFAULT_ORDER,
          {
            version: STORAGE_VERSION,
            migrate: migrateOrder
          }
        );
        
        if (stored) {
          console.log('[useOrderStorage] Loaded order:', {
            rooms: stored.rooms.length,
            categories: stored.categories.length,
            devices: Object.keys(stored.devices).length
          });
          setOrder(stored);
        }
      } catch (e) {
        console.error('[useOrderStorage] Failed to load:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, []);

  // Save to storage with debouncing
  useEffect(() => {
    if (isLoading) return;

    // Create a stable string representation for comparison
    const currentData = JSON.stringify(order);
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
        console.log('[useOrderStorage] Saving order');
        await storageManager.setItem(
          STORAGE_KEYS.CARD_ORDER,
          order,
          STORAGE_VERSION
        );
        lastSaveRef.current = currentData;
      } catch (e) {
        console.error('[useOrderStorage] Failed to save:', e);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [order, isLoading]);

  const updateRoomOrder = (newOrder: string[]) => {
    console.log('[useOrderStorage] Updating room order:', newOrder);
    setOrder(prev => ({ ...prev, rooms: newOrder }));
  };

  const updateCategoryOrder = (newOrder: string[]) => {
    console.log('[useOrderStorage] Updating category order:', newOrder);
    setOrder(prev => ({ ...prev, categories: newOrder }));
  };

  const updateDeviceOrder = (roomOrCategoryId: string, newOrder: string[]) => {
    console.log('[useOrderStorage] Updating device order for', roomOrCategoryId, ':', newOrder);
    setOrder(prev => {
      const newState = {
        ...prev,
        devices: {
          ...prev.devices,
          [roomOrCategoryId]: newOrder
        }
      };
      
      // Clean up empty arrays
      if (newOrder.length === 0) {
        delete newState.devices[roomOrCategoryId];
      }
      
      return newState;
    });
  };

  const getRoomOrder = (rooms: any[]): any[] => {
    if (order.rooms.length === 0) return rooms;
    
    const orderedRooms = [...rooms];
    orderedRooms.sort((a, b) => {
      const aIndex = order.rooms.indexOf(a.id);
      const bIndex = order.rooms.indexOf(b.id);
      
      // If not in saved order, put at end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
    
    return orderedRooms;
  };

  const getCategoryOrder = (categories: any[]): any[] => {
    if (order.categories.length === 0) return categories;
    
    const orderedCategories = [...categories];
    orderedCategories.sort((a, b) => {
      const aIndex = order.categories.indexOf(a.id);
      const bIndex = order.categories.indexOf(b.id);
      
      // If not in saved order, put at end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
    
    return orderedCategories;
  };

  const getDeviceOrder = (roomOrCategoryId: string, devices: [string, any][]): [string, any][] => {
    const savedOrder = order.devices[roomOrCategoryId];
    
    if (!savedOrder || savedOrder.length === 0) return devices;
    
    const orderedDevices = [...devices];
    orderedDevices.sort((a, b) => {
      const aIndex = savedOrder.indexOf(a[0]);
      const bIndex = savedOrder.indexOf(b[0]);
      
      // If not in saved order, put at end
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
    
    return orderedDevices;
  };

  return {
    updateRoomOrder,
    updateCategoryOrder,
    updateDeviceOrder,
    getRoomOrder,
    getCategoryOrder,
    getDeviceOrder,
    isLoading
  };
}