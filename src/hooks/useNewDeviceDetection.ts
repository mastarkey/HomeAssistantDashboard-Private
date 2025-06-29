import { useState, useEffect, useRef } from 'react';
import { groupEntitiesByDevice, type DeviceGroup } from '../utils/deviceGrouping';
import type { Device } from '../utils/deviceRegistry';

interface NewDeviceDetectionOptions {
  entities: Record<string, any> | null;
  devices: Device[] | null;
  getEffectiveRoom: (entityId: string) => string | undefined;
  onNewDevicesFound?: (devices: DeviceGroup[]) => void;
}

export function useNewDeviceDetection({ 
  entities, 
  devices, 
  getEffectiveRoom,
  onNewDevicesFound 
}: NewDeviceDetectionOptions) {
  const [newDevices, setNewDevices] = useState<DeviceGroup[]>([]);
  const [hasNewDevices, setHasNewDevices] = useState(false);
  const previousDeviceIds = useRef<Set<string>>(new Set());
  const initialScanComplete = useRef(false);

  useEffect(() => {
    if (!entities || !devices) return;

    // Convert entities to array and group by device
    const entitiesArray = Object.entries(entities);
    const deviceGroups = groupEntitiesByDevice(entitiesArray, devices, entities);
    
    // Find unassigned devices (in "other" room or no room)
    const unassignedDevices = deviceGroups.filter(device => {
      const currentRoom = getEffectiveRoom(device.primaryEntity[0]) || device.room;
      return !currentRoom || currentRoom === 'other';
    });

    // On first scan, just record what devices exist
    if (!initialScanComplete.current) {
      unassignedDevices.forEach(device => {
        previousDeviceIds.current.add(device.deviceId);
      });
      initialScanComplete.current = true;
      return;
    }

    // Find truly new devices (not in our previous set)
    const newlyDiscoveredDevices = unassignedDevices.filter(
      device => !previousDeviceIds.current.has(device.deviceId)
    );

    if (newlyDiscoveredDevices.length > 0) {
      setNewDevices(newlyDiscoveredDevices);
      setHasNewDevices(true);
      
      // Update our tracking set
      newlyDiscoveredDevices.forEach(device => {
        previousDeviceIds.current.add(device.deviceId);
      });

      // Notify parent component
      if (onNewDevicesFound) {
        onNewDevicesFound(newlyDiscoveredDevices);
      }
    }
  }, [entities, devices, getEffectiveRoom, onNewDevicesFound]);

  const dismissNewDevices = () => {
    setNewDevices([]);
    setHasNewDevices(false);
  };

  const getNewDeviceCount = () => newDevices.length;

  return {
    newDevices,
    hasNewDevices,
    dismissNewDevices,
    getNewDeviceCount
  };
}