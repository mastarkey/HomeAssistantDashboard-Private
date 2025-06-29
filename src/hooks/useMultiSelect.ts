import { useState, useCallback } from 'react';

export function useMultiSelect() {
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      // Clear selections when exiting selection mode
      setSelectedDevices(new Set());
    }
  }, [isSelectionMode]);

  const toggleDeviceSelection = useCallback((entityId: string) => {
    setSelectedDevices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((entityIds: string[]) => {
    setSelectedDevices(new Set(entityIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDevices(new Set());
  }, []);

  const isDeviceSelected = useCallback((entityId: string) => {
    return selectedDevices.has(entityId);
  }, [selectedDevices]);

  return {
    isSelectionMode,
    selectedDevices: Array.from(selectedDevices),
    selectedCount: selectedDevices.size,
    toggleSelectionMode,
    toggleDeviceSelection,
    selectAll,
    clearSelection,
    isDeviceSelected,
  };
}