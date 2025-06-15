import { useState, useEffect, useMemo } from 'react';
import { useCustomRooms } from './useCustomRooms';
import { useHiddenRooms } from './useHiddenRooms';
import { getRoomsFromEntitiesWithOverrides } from '../utils/entityHelpersWithOverrides';
import { haStorage, STORAGE_KEYS } from '../services/haStorage';
import type { Room } from '../utils/entityHelpers';

interface ManagedRoom extends Room {
  isCustom?: boolean;
  isDetected?: boolean;
}

export function useRoomManager(
  allEntities: any,
  getEffectiveRoom: (entityId: string, defaultRoom?: string) => string
) {
  const { customRooms, addCustomRoom, deleteCustomRoom } = useCustomRooms();
  const { isRoomHidden, unhideRoom } = useHiddenRooms();
  const [deletedRooms, setDeletedRooms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load deleted rooms from HA storage
  useEffect(() => {
    const loadDeletedRooms = async () => {
      try {
        const stored = await haStorage.getItem(STORAGE_KEYS.DELETED_ROOMS);
        if (stored) {
          setDeletedRooms(stored);
        }
      } catch (e) {
        // Failed to load deleted rooms
      } finally {
        setIsLoading(false);
      }
    };
    loadDeletedRooms();
  }, []);

  // Save deleted rooms to HA storage
  useEffect(() => {
    if (!isLoading) {
      haStorage.setItem(STORAGE_KEYS.DELETED_ROOMS, deletedRooms);
    }
  }, [deletedRooms, isLoading]);

  // Get all rooms (detected + custom)
  const allRooms = useMemo(() => {
    // Custom rooms and deleted rooms processed
    
    if (!allEntities) {
      // If no entities yet, return custom rooms
      return customRooms.map(room => ({ 
        ...room, 
        entityCount: 0,
        isCustom: true  // Ensure isCustom flag is set
      }));
    }
    
    // Get detected rooms from Home Assistant
    const detectedRooms = getRoomsFromEntitiesWithOverrides(allEntities, getEffectiveRoom);
    
    // Mark detected rooms
    const detectedRoomsWithFlag = detectedRooms.map(room => ({
      ...room,
      isDetected: true,
      isCustom: false  // Explicitly mark as not custom
    }));
    
    // Merge with custom rooms
    const mergedRooms: ManagedRoom[] = [...detectedRoomsWithFlag];
    
    // Add custom rooms that don't conflict with detected ones
    customRooms.forEach(customRoom => {
      if (!mergedRooms.find(room => room.id === customRoom.id)) {
        mergedRooms.push({
          ...customRoom,
          entityCount: 0,
          isCustom: true  // Ensure this is always true for custom rooms
        });
      }
    });
    
    // Filter out deleted rooms (both detected and custom)
    const filteredRooms = mergedRooms.filter(room => {
      // Don't show if it's in the deleted list
      if (deletedRooms.includes(room.id)) {
        return false;
      }
      // Don't show if it's hidden (for backwards compatibility)
      if (isRoomHidden(room.id)) {
        return false;
      }
      // Don't show "other" room unless it has many devices
      if (room.id === 'other' && room.entityCount <= 5) {
        return false;
      }
      return true;
    });
    
    // Final rooms filtered
    return filteredRooms;
  }, [allEntities, customRooms, deletedRooms, getEffectiveRoom, isRoomHidden]);

  // Add a new custom room
  const addRoom = (name: string, icon?: string) => {
    const roomId = name.toLowerCase().replace(/\s+/g, '_');
    
    // If this room was previously deleted, remove it from deleted list
    if (deletedRooms.includes(roomId)) {
      setDeletedRooms(prev => prev.filter(id => id !== roomId));
    }
    
    // If this room was hidden, unhide it
    if (isRoomHidden(roomId)) {
      unhideRoom(roomId);
    }
    
    return addCustomRoom(name, icon);
  };

  // Delete a room (custom or detected)
  const deleteRoom = (roomId: string) => {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;
    
    if (room.isCustom) {
      // For custom rooms, actually delete them
      deleteCustomRoom(roomId);
    } else {
      // For detected rooms, add to deleted list so they don't reappear
      setDeletedRooms(prev => [...prev, roomId]);
    }
  };

  // Restore a deleted room
  const restoreRoom = (roomId: string) => {
    setDeletedRooms(prev => prev.filter(id => id !== roomId));
    if (isRoomHidden(roomId)) {
      unhideRoom(roomId);
    }
  };

  // Check if a room can be deleted (only if it has no devices)
  const canDeleteRoom = (roomId: string) => {
    const room = allRooms.find(r => r.id === roomId);
    return room ? room.entityCount === 0 : false;
  };

  return {
    rooms: allRooms,
    addRoom,
    deleteRoom,
    restoreRoom,
    canDeleteRoom,
    deletedRooms
  };
}