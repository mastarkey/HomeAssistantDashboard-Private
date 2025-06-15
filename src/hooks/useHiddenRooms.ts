import { useState, useEffect } from 'react';
import { haStorage, STORAGE_KEYS } from '../services/haStorage';

export function useHiddenRooms() {
  const [hiddenRooms, setHiddenRooms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from HA storage on mount
  useEffect(() => {
    const loadHiddenRooms = async () => {
      try {
        const stored = await haStorage.getItem(STORAGE_KEYS.HIDDEN_ROOMS);
        if (stored) {
          setHiddenRooms(stored);
        }
      } catch (e) {
        // Failed to load hidden rooms
      } finally {
        setIsLoading(false);
      }
    };
    loadHiddenRooms();
  }, []);

  // Save to HA storage whenever hiddenRooms changes
  useEffect(() => {
    if (!isLoading) {
      haStorage.setItem(STORAGE_KEYS.HIDDEN_ROOMS, hiddenRooms);
    }
  }, [hiddenRooms, isLoading]);

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