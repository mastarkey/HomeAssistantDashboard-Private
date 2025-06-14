import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ha_hidden_rooms';

export function useHiddenRooms() {
  const [hiddenRooms, setHiddenRooms] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHiddenRooms(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse hidden rooms:', e);
      }
    }
  }, []);

  // Save to localStorage whenever hiddenRooms changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenRooms));
  }, [hiddenRooms]);

  const hideRoom = (roomId: string) => {
    setHiddenRooms(prev => {
      if (prev.includes(roomId)) return prev;
      return [...prev, roomId];
    });
  };

  const unhideRoom = (roomId: string) => {
    setHiddenRooms(prev => prev.filter(id => id !== roomId));
  };

  const isRoomHidden = (roomId: string) => {
    return hiddenRooms.includes(roomId);
  };

  return {
    hiddenRooms,
    hideRoom,
    unhideRoom,
    isRoomHidden,
  };
}