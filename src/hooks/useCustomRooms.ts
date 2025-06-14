import { useState, useEffect } from 'react';

export interface CustomRoom {
  id: string;
  name: string;
  icon?: string;
  isCustom: true;
  createdAt: number;
}

const STORAGE_KEY = 'ha_custom_rooms';

export function useCustomRooms() {
  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomRooms(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse custom rooms:', e);
      }
    }
  }, []);

  // Save to localStorage whenever customRooms changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customRooms));
  }, [customRooms]);

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