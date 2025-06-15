import { useState, useEffect } from 'react';
import { haStorage, STORAGE_KEYS } from '../services/haStorage';

export interface CustomRoom {
  id: string;
  name: string;
  icon?: string;
  isCustom: true;
  createdAt: number;
}

export function useCustomRooms() {
  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from HA storage on mount
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const stored = await haStorage.getItem(STORAGE_KEYS.CUSTOM_ROOMS);
        if (stored) {
          setCustomRooms(stored);
        }
      } catch (e) {
        // Failed to load custom rooms
      } finally {
        setIsLoading(false);
      }
    };
    loadRooms();
  }, []);

  // Save to HA storage whenever customRooms changes
  useEffect(() => {
    if (!isLoading && customRooms.length >= 0) {
      haStorage.setItem(STORAGE_KEYS.CUSTOM_ROOMS, customRooms);
    }
  }, [customRooms, isLoading]);

  const addCustomRoom = (name: string, icon?: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '_');
    const newRoom: CustomRoom = {
      id,
      name,
      icon,
      isCustom: true,
      createdAt: Date.now(),
    };
    
    setCustomRooms(prev => [...prev, newRoom]);
    return newRoom;
  };

  const deleteCustomRoom = (roomId: string) => {
    setCustomRooms(prev => prev.filter(room => room.id !== roomId));
  };

  const updateCustomRoom = (roomId: string, updates: Partial<CustomRoom>) => {
    setCustomRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    ));
  };

  return {
    customRooms,
    addCustomRoom,
    deleteCustomRoom,
    updateCustomRoom,
  };
}