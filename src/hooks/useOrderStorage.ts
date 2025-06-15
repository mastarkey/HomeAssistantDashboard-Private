// Hook for managing card order persistence in HA storage

import { useState, useEffect } from 'react';
import { haStorage, STORAGE_KEYS } from '../services/haStorage';

interface OrderStorage {
  rooms: string[];
  categories: string[];
  devices: Record<string, string[]>; // roomId/categoryId -> entityIds
}

export function useOrderStorage() {
  const [order, setOrder] = useState<OrderStorage>({
    rooms: [],
    categories: [],
    devices: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load from HA storage on mount
  useEffect(() => {
    const loadOrder = async () => {
      try {
        const stored = await haStorage.getItem(STORAGE_KEYS.CARD_ORDER);
        if (stored) {
          setOrder(stored);
        }
      } catch (e) {
        // Failed to load order
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      haStorage.setItem(STORAGE_KEYS.CARD_ORDER, order);
    }
  }, [order, isLoading]);

  const updateRoomOrder = (newOrder: string[]) => {
    setOrder(prev => ({ ...prev, rooms: newOrder }));
  };

  const updateCategoryOrder = (newOrder: string[]) => {
    setOrder(prev => ({ ...prev, categories: newOrder }));
  };

  const updateDeviceOrder = (roomOrCategoryId: string, newOrder: string[]) => {
    console.log('[DEBUG] updateDeviceOrder:', { roomOrCategoryId, newOrder });
    setOrder(prev => {
      const newState = {
        ...prev,
        devices: {
          ...prev.devices,
          [roomOrCategoryId]: newOrder
        }
      };
      console.log('[DEBUG] New order state:', newState);
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
    console.log('[DEBUG] getDeviceOrder:', { roomOrCategoryId, savedOrder, devicesCount: devices.length });
    
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
    
    console.log('[DEBUG] Ordered devices:', orderedDevices.map(d => d[0]));
    return orderedDevices;
  };

  return {
    updateRoomOrder,
    updateCategoryOrder,
    updateDeviceOrder,
    getRoomOrder,
    getCategoryOrder,
    getDeviceOrder
  };
}