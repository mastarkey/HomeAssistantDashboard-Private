// Hook for managing card order persistence in localStorage

import { useState, useEffect } from 'react';

interface OrderStorage {
  rooms: string[];
  categories: string[];
  devices: Record<string, string[]>; // roomId/categoryId -> entityIds
}

const STORAGE_KEY = 'ha-dashboard-order';

export function useOrderStorage() {
  const [order, setOrder] = useState<OrderStorage>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored order:', e);
      }
    }
    return {
      rooms: [],
      categories: [],
      devices: {}
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }, [order]);

  const updateRoomOrder = (newOrder: string[]) => {
    setOrder(prev => ({ ...prev, rooms: newOrder }));
  };

  const updateCategoryOrder = (newOrder: string[]) => {
    setOrder(prev => ({ ...prev, categories: newOrder }));
  };

  const updateDeviceOrder = (roomOrCategoryId: string, newOrder: string[]) => {
    setOrder(prev => ({
      ...prev,
      devices: {
        ...prev.devices,
        [roomOrCategoryId]: newOrder
      }
    }));
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
    getDeviceOrder
  };
}