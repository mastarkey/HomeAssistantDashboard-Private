import React, { useState, useMemo, useEffect } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { useOrderStorage } from '../hooks/useOrderStorage';
import { useCustomEntities } from '../hooks/useCustomEntities';
import { useEntityOverrides } from '../hooks/useEntityOverrides';
import { useRoomManager } from '../hooks/useRoomManager';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { useMultiSelect } from '../hooks/useMultiSelect';
import { useToast } from '../contexts/ToastContext';
import { useNewDeviceDetection } from '../hooks/useNewDeviceDetection';
import { useThrottledEntities } from '../hooks/useThrottledEntities';
import EntityCard from './EntityCard';
import DraggableCard from './DraggableCard';
// Lazy load modals to reduce initial bundle size
const AddDeviceModal = React.lazy(() => import('./AddDeviceModal'));
const AddRoomModal = React.lazy(() => import('./AddRoomModal'));
const AddCategoryModal = React.lazy(() => import('./AddCategoryModal'));
const BulkMoveModal = React.lazy(() => import('./BulkMoveModal').then(module => ({ default: module.BulkMoveModal })));
const LightGroupAnalyzer = React.lazy(() => import('./LightGroupAnalyzer'));
import { StorageDebugPanel } from './StorageDebugPanel';
import NewDeviceNotification from './NewDeviceNotification';
import { filterEntitiesByCategory } from '../utils/entityHelpers';
import { filterEntitiesByRoomWithOverrides } from '../utils/entityHelpersWithOverrides';
import { groupEntitiesByDevice } from '../utils/deviceGrouping';
import UnifiedDeviceCard from './cards/UnifiedDeviceCard';
import { filterPrimaryDevices } from '../utils/deviceFiltering';
import { isCameraDetectionEntity } from '../utils/cameraDetectionHelpers';
import { getDeviceForEntity } from '../utils/deviceRegistry';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Lightbulb, 
  Thermometer, 
  Shield, 
  Tv, 
  Power, 
  Activity, 
  Camera,
  ChevronLeft,
  Home,
  Bed,
  Bath,
  UtensilsCrossed,
  Sofa,
  Car,
  DoorOpen,
  Plus,
  Trash2,
  Square,
  MoveRight,
  X,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Define device categories with Lucide icons
const deviceCategories = [
  { id: 'lights', name: 'Lights', icon: <Lightbulb className="w-8 h-8" />, domains: ['light'] },
  { id: 'climate', name: 'Climate', icon: <Thermometer className="w-8 h-8" />, domains: ['climate', 'weather'] },
  { id: 'security', name: 'Security', icon: <Shield className="w-8 h-8" />, domains: ['lock', 'alarm_control_panel', 'binary_sensor.door', 'binary_sensor.window', 'binary_sensor.motion'] },
  { id: 'media', name: 'Media', icon: <Tv className="w-8 h-8" />, domains: ['media_player'] },
  { id: 'switches', name: 'Switches & Outlets', icon: <Power className="w-8 h-8" />, domains: ['switch'] },
  { id: 'sensors', name: 'Sensors', icon: <Activity className="w-8 h-8" />, domains: ['sensor'] },
  { id: 'cameras', name: 'Cameras', icon: <Camera className="w-8 h-8" />, domains: ['camera'] },
];

// Room icons mapping (using normalized keys)
const roomIcons: Record<string, React.ReactNode> = {
  'bedroom': <Bed className="w-8 h-8" />,
  'master_bedroom': <Bed className="w-8 h-8" />,
  'guest_bedroom': <Bed className="w-8 h-8" />,
  'bathroom': <Bath className="w-8 h-8" />,
  'kitchen': <UtensilsCrossed className="w-8 h-8" />,
  'living_room': <Sofa className="w-8 h-8" />,
  'dining_room': <UtensilsCrossed className="w-8 h-8" />,
  'garage': <Car className="w-8 h-8" />,
  'entryway': <DoorOpen className="w-8 h-8" />,
  'hallway': <DoorOpen className="w-8 h-8" />,
  'foyer': <DoorOpen className="w-8 h-8" />,
  'front_patio': <Home className="w-8 h-8" />,
  'back_patio': <Home className="w-8 h-8" />,
  'driveway': <Car className="w-8 h-8" />,
  'laundry_room': <Home className="w-8 h-8" />,
  'den': <Sofa className="w-8 h-8" />,
  'other': <Home className="w-8 h-8" />,
  'default': <Home className="w-8 h-8" />
};

const Dashboard: React.FC = () => {
  const { entities, config, connected, error, devices } = useHomeAssistant();
  
  // Debug logging for iframe issues
  useEffect(() => {
    console.log('[Dashboard] Current state:', {
      connected,
      hasEntities: !!entities,
      entityCount: entities ? Object.keys(entities).length : 0,
      hasDevices: !!devices,
      deviceCount: devices ? devices.length : 0,
      error,
      isInIframe: window.parent !== window,
      currentUrl: window.location.href
    });
  }, [connected, entities, devices, error]);
  const { updateRoomOrder, updateCategoryOrder, updateDeviceOrder, getRoomOrder, getCategoryOrder, getDeviceOrder } = useOrderStorage();
  const { customEntities, updateCustomEntity, moveCustomEntityToRoom, deleteCustomEntity } = useCustomEntities();
  const { setEntityOverride, getEffectiveRoom, getEntityOverride, getEffectiveName } = useEntityOverrides();
  const { customCategories, addCustomCategory, deleteCustomCategory } = useCustomCategories();
  const [view, setView] = useState<'rooms' | 'categories'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showBulkMove, setShowBulkMove] = useState(false);
  const [showLightAnalyzer, setShowLightAnalyzer] = useState(false);
  
  const {
    isSelectionMode,
    selectedDevices,
    selectedCount,
    toggleSelectionMode,
    toggleDeviceSelection,
    clearSelection,
    isDeviceSelected,
  } = useMultiSelect();
  
  const { showToast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Category domains mapping for the helper function
  const categoryDomains = useMemo(() => {
    const domains: Record<string, string[]> = {};
    
    // Add default category domains
    deviceCategories.forEach(cat => {
      domains[cat.id] = cat.domains;
    });
    
    // Add custom category domains
    customCategories.forEach(cat => {
      domains[cat.id] = cat.domains;
    });
    
    return domains;
  }, [customCategories]);

  // Throttle entity updates to reduce re-renders
  const throttledEntities = useThrottledEntities(entities, 200);
  
  // Merge Home Assistant entities with custom entities
  const allEntities = useMemo(() => {
    if (!throttledEntities) return customEntities;
    return { ...throttledEntities, ...customEntities };
  }, [throttledEntities, customEntities]);
  
  // Use the room manager for unified room handling
  const roomManager = useRoomManager(allEntities, getEffectiveRoom);
  
  // New device detection
  const { newDevices, hasNewDevices, dismissNewDevices } = useNewDeviceDetection({
    entities: allEntities,
    devices,
    getEffectiveRoom,
    onNewDevicesFound: (devices) => {
      showToast(`${devices.length} new ${devices.length === 1 ? 'device' : 'devices'} discovered!`, 'info');
    }
  });
  
  // Get rooms with proper entity counts
  const rooms = useMemo(() => {
    console.log('[Dashboard] Computing rooms:', {
      roomManagerRooms: roomManager.rooms.length,
      allEntitiesCount: allEntities ? Object.keys(allEntities).length : 0
    });
    
    const roomsWithCounts = roomManager.rooms.map(room => {
      const roomEntities = filterEntitiesByRoomWithOverrides(allEntities, room.id, getEffectiveRoom);
      
      // Group entities by their physical device
      const entityGroups = groupEntitiesByDevice(roomEntities, devices, allEntities);
      
      // Filter to only show primary devices
      const primaryDeviceGroups = entityGroups.filter(group => {
        return filterPrimaryDevices([group.primaryEntity], devices, allEntities).length > 0;
      });
      
      // Debug logging for garage and other rooms
      if (room.id === 'garage' || room.id === 'other') {
        console.log(`[DEBUG] ${room.name} room analysis:`, {
          allEntitiesCount: roomEntities.length,
          entityGroupsCount: entityGroups.length,
          primaryDeviceGroupsCount: primaryDeviceGroups.length,
          groups: primaryDeviceGroups.map(group => ({
            deviceId: group.deviceId,
            deviceName: group.deviceName,
            primary: group.primaryEntity[0],
            entitiesCount: group.entities.length,
            device: group.device?.name || null
          }))
        });
        
        // Check specifically for Tesla entities
        const teslaEntities = Object.entries(allEntities).filter(([id, e]) => {
          const name = (e as any).attributes?.friendly_name || id;
          return id.toLowerCase().includes('tesla') || name.toLowerCase().includes('tesla') ||
                 id.toLowerCase().includes('wall_connector') || name.toLowerCase().includes('wall connector');
        });
        console.log('[DEBUG] All Tesla entities:', teslaEntities.map(([id, e]) => ({
          id,
          friendlyName: (e as any).attributes?.friendly_name,
          effectiveRoom: getEffectiveRoom(id),
          override: getEntityOverride(id)
        })));
      }
      
      // Filter out hidden and camera detection entities
      const visibleGroups = primaryDeviceGroups.filter(group => {
        const [entityId, entity] = group.primaryEntity;
        const override = getEntityOverride(entityId);
        if (override?.hidden) return false;
        
        // Use improved detection logic that doesn't rely on friendly names
        const device = devices ? getDeviceForEntity(entityId, allEntities, devices) : null;
        if (isCameraDetectionEntity(entityId, entity, device)) {
          return false;
        }
        
        return true;
      });
      
      return {
        ...room,
        entityCount: visibleGroups.length // Count groups, not individual entities
      };
    });
    
    // Apply saved order
    const ordered = getRoomOrder(roomsWithCounts);
    return ordered;
  }, [roomManager.rooms, allEntities, devices, getRoomOrder, getEffectiveRoom, getEntityOverride]);

  // Filter entities based on selection
  const displayedEntityGroups = useMemo(() => {
    console.log('[DEBUG] Computing displayedEntityGroups for room:', selectedRoom, 'view:', view);
    if (!allEntities) return [];
    
    // DEBUG: Check if Tesla entities exist in allEntities
    if (selectedRoom === 'other') {
      const teslaEntities = Object.entries(allEntities).filter(([id]) => 
        id.toLowerCase().includes('tesla_wall_connector')
      );
      console.log('[DEBUG] Tesla entities in allEntities:', teslaEntities.map(([id, e]) => ({
        id,
        state: (e as any).state,
        friendlyName: (e as any).attributes?.friendly_name
      })));
    }
    
    let filtered: [string, any][] = [];
    
    if (view === 'rooms' && selectedRoom) {
      filtered = filterEntitiesByRoomWithOverrides(allEntities, selectedRoom, getEffectiveRoom);
      
      // FORCE ADD Tesla entities to Other room
      if (selectedRoom === 'other') {
        // Add any Tesla Wall Connector entities that might have been missed
        Object.entries(allEntities).forEach(([entityId, entity]) => {
          const friendlyName = (entity as any).attributes?.friendly_name || '';
          if (entityId.toLowerCase().includes('tesla_wall_connector') || 
              entityId.toLowerCase().includes('wall_connector') ||
              friendlyName.toLowerCase().includes('tesla wall connector') ||
              friendlyName.toLowerCase().includes('wall connector')) {
            const exists = filtered.some(([id]) => id === entityId);
            if (!exists) {
              console.log(`[DEBUG] FORCE ADDING Tesla/Wall Connector entity to Other room: ${entityId}`);
              filtered.push([entityId, entity]);
            }
          }
        });
        
        console.log('[DEBUG] Step 1 - Entities in Other room after filterEntitiesByRoomWithOverrides:', filtered.map(([id, entity]) => ({
          id,
          name: entity.attributes?.friendly_name || id,
          domain: id.split('.')[0]
        })));
      }
    } else if (view === 'categories' && selectedCategory) {
      filtered = filterEntitiesByCategory(allEntities, selectedCategory, categoryDomains);
    }
    
    // Group entities by their physical device
    const entityGroups = groupEntitiesByDevice(filtered, devices, allEntities);
    
    if (selectedRoom === 'other') {
      console.log('[DEBUG] Step 2 - Device groups:', entityGroups.map(group => ({
        deviceId: group.deviceId,
        deviceName: group.deviceName,
        entitiesCount: group.entities.length,
        primaryEntity: group.primaryEntity[0]
      })));
    }
    
    // Filter to only show primary devices
    const primaryDeviceGroups = entityGroups.filter(group => {
      // Check if this is a primary device
      return filterPrimaryDevices([group.primaryEntity], devices, allEntities).length > 0;
    });
    
    if (selectedRoom === 'other') {
      console.log('[DEBUG] Step 3 - After filterPrimaryDevices:', primaryDeviceGroups.map(group => ({
        deviceId: group.deviceId,
        deviceName: group.deviceName,
        primary: group.primaryEntity[0],
        domain: group.primaryEntity[0].split('.')[0],
        entitiesCount: group.entities.length
      })));
    }
    
    // Filter out hidden entities and camera detection entities
    const visibleGroups = primaryDeviceGroups.filter(group => {
      const [entityId, entity] = group.primaryEntity;
      const override = getEntityOverride(entityId);
      if (override?.hidden) return false;
      
      // ALWAYS show Tesla Wall Connector entities
      const friendlyName = entity.attributes?.friendly_name || '';
      if (entityId.toLowerCase().includes('tesla_wall_connector') || 
          entityId.toLowerCase().includes('wall_connector') ||
          friendlyName.toLowerCase().includes('tesla wall connector') ||
          friendlyName.toLowerCase().includes('wall connector')) {
        console.log(`[DEBUG] Keeping Tesla Wall Connector entity visible: ${entityId}`);
        return true;
      }
      
      // Use improved detection logic that doesn't rely on friendly names
      const device = devices ? getDeviceForEntity(entityId, allEntities, devices) : null;
      if (isCameraDetectionEntity(entityId, entity, device)) {
        return false;
      }
      
      return true;
    });
    
    // Debug final visible devices for Other room
    if (selectedRoom === 'other') {
      console.log('[DEBUG] Final visible groups:', visibleGroups.map(group => ({
        deviceId: group.deviceId,
        deviceName: group.deviceName,
        primary: group.primaryEntity[0],
        entitiesCount: group.entities.length
      })));
    }
    
    // Sort groups by primary entity
    const sorted = visibleGroups.sort((a, b) => {
      // Sort by domain first (lights, switches, then others)
      const domainOrder = ['light', 'switch', 'climate', 'media_player', 'sensor', 'binary_sensor'];
      const aDomain = a.primaryEntity[0].split('.')[0];
      const bDomain = b.primaryEntity[0].split('.')[0];
      const aOrder = domainOrder.indexOf(aDomain) !== -1 ? domainOrder.indexOf(aDomain) : 999;
      const bOrder = domainOrder.indexOf(bDomain) !== -1 ? domainOrder.indexOf(bDomain) : 999;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Then sort by device name
      const aName = a.deviceName.toLowerCase();
      const bName = b.deviceName.toLowerCase();
      return aName.localeCompare(bName);
    });
    
    return sorted;
  }, [allEntities, view, selectedRoom, selectedCategory, devices, getDeviceOrder, categoryDomains]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!allEntities) return {};
    const counts: Record<string, number> = {};
    
    const countCategoryDevices = (category: any) => {
      const categoryEntities = filterEntitiesByCategory(allEntities, category.id, categoryDomains);
      
      // Group entities by their physical device
      const entityGroups = groupEntitiesByDevice(categoryEntities, devices, allEntities);
      
      // Filter to only show primary devices
      const primaryDeviceGroups = entityGroups.filter(group => {
        return filterPrimaryDevices([group.primaryEntity], devices, allEntities).length > 0;
      });
      
      // Debug logging for climate category
      if (category.id === 'climate') {
        console.log('[DEBUG] Climate category analysis:', {
          domains: category.domains,
          allEntitiesCount: categoryEntities.length,
          categoryEntities: categoryEntities.map(([id, e]) => ({
            id,
            domain: id.split('.')[0],
            friendlyName: e.attributes?.friendly_name
          })),
          entityGroupsCount: entityGroups.length,
          primaryDeviceGroupsCount: primaryDeviceGroups.length,
          groups: primaryDeviceGroups.map(group => ({
            deviceId: group.deviceId,
            deviceName: group.deviceName,
            primary: group.primaryEntity[0],
            entitiesCount: group.entities.length,
            device: group.device?.name || null
          }))
        });
      }
      
      // Filter out hidden and camera detection entities
      const visibleGroups = primaryDeviceGroups.filter(group => {
        const [entityId, entity] = group.primaryEntity;
        const override = getEntityOverride(entityId);
        if (override?.hidden) return false;
        
        // Use improved detection logic that doesn't rely on friendly names
        const device = devices ? getDeviceForEntity(entityId, allEntities, devices) : null;
        if (isCameraDetectionEntity(entityId, entity, device)) {
          return false;
        }
        
        return true;
      });
      
      // Return the number of visible device groups (not individual entities)
      return visibleGroups.length;
    };
    
    // Count devices for default categories
    deviceCategories.forEach(category => {
      counts[category.id] = countCategoryDevices(category);
    });
    
    // Count devices for custom categories
    customCategories.forEach(category => {
      counts[category.id] = countCategoryDevices(category);
    });
    
    return counts;
  }, [allEntities, devices, customCategories, categoryDomains, getEntityOverride]);
  
  // Get ordered categories and merge with custom categories
  const orderedCategories = useMemo(() => {
    // Convert custom category icons from string to React components
    const customCategoriesWithIcons = customCategories.map(cat => {
      const IconComponent = (LucideIcons as any)[cat.icon as string];
      return {
        ...cat,
        icon: IconComponent ? <IconComponent className="w-8 h-8" /> : <Home className="w-8 h-8" />,
        isCustom: true
      };
    });
    
    // Merge default categories with custom categories
    const allCategories = [...deviceCategories, ...customCategoriesWithIcons];
    
    return getCategoryOrder(allCategories);
  }, [getCategoryOrder, customCategories]);
  
  // Get unassigned devices for quick assign
  const unassignedDevices = useMemo(() => {
    if (!allEntities || !devices) return [];
    
    const entitiesArray = Object.entries(allEntities) as Array<[string, any]>;
    const deviceGroups = groupEntitiesByDevice(entitiesArray, devices, allEntities);
    
    // Filter to only show primary devices that are unassigned
    return deviceGroups.filter(device => {
      const currentRoom = getEffectiveRoom(device.primaryEntity[0]) || device.room;
      return (!currentRoom || currentRoom === 'other') && 
             filterPrimaryDevices([device.primaryEntity], devices, allEntities).length > 0;
    });
  }, [allEntities, devices, getEffectiveRoom]);
  
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    console.log('[DEBUG] handleDragEnd:', { 
      activeId: active?.id, 
      overId: over?.id,
      view,
      selectedRoom,
      selectedCategory
    });
    
    if (!over || active.id === over.id) {
      return;
    }
    
    if (view === 'rooms' && !selectedRoom) {
      const oldIndex = rooms.findIndex(room => room.id === active.id);
      const newIndex = rooms.findIndex(room => room.id === over.id);
      
      console.log('[DEBUG] Room drag:', { oldIndex, newIndex });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(rooms, oldIndex, newIndex).map(room => room.id);
        console.log('[DEBUG] New room order:', newOrder);
        updateRoomOrder(newOrder);
      }
    } else if (view === 'categories' && !selectedCategory) {
      const oldIndex = orderedCategories.findIndex(cat => cat.id === active.id);
      const newIndex = orderedCategories.findIndex(cat => cat.id === over.id);
      
      console.log('[DEBUG] Category drag:', { oldIndex, newIndex });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedCategories, oldIndex, newIndex).map(cat => cat.id);
        console.log('[DEBUG] New category order:', newOrder);
        updateCategoryOrder(newOrder);
      }
    } else if (selectedRoom || selectedCategory) {
      const deviceIds = displayedEntityGroups.map(g => g.deviceId);
      const oldIndex = deviceIds.findIndex(id => id === active.id);
      const newIndex = deviceIds.findIndex(id => id === over.id);
      
      console.log('[DEBUG] Device drag:', { oldIndex, newIndex, key: selectedRoom || selectedCategory });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(deviceIds, oldIndex, newIndex);
        const key = selectedRoom || selectedCategory || '';
        console.log('[DEBUG] New device order for', key, ':', newOrder);
        updateDeviceOrder(key, newOrder);
      }
    }
  };
  
  const handleEntityUpdate = (entityId: string, updates: any) => {
    // Check if it's a custom entity
    if (entityId.startsWith('custom.')) {
      if (updates.room) {
        moveCustomEntityToRoom(entityId, updates.room);
      }
      if (updates.name || updates.attributes) {
        updateCustomEntity(entityId, {
          ...(updates.name && { name: updates.name }),
          ...(updates.attributes && { attributes: updates.attributes }),
        });
      }
    } else {
      // For Home Assistant entities, check if this entity is part of a device group
      const deviceGroup = displayedEntityGroups.find(group => 
        group.entities.some(([eid]) => eid === entityId)
      );
      
      if (deviceGroup && deviceGroup.entities.length > 1 && updates.room) {
        // If it's part of a multi-entity device and room is being updated,
        // update all entities in the device group
        console.log(`[Dashboard] Updating room for all entities in device group ${deviceGroup.deviceId}`);
        deviceGroup.entities.forEach(([eid]) => {
          const overrideUpdates: any = { room: updates.room };
          if (eid === entityId && updates.name) {
            overrideUpdates.friendlyName = updates.name;
          }
          setEntityOverride(eid, overrideUpdates);
        });
      } else {
        // For single entities or non-room updates, just update the single entity
        const overrideUpdates: any = {};
        if (updates.room) overrideUpdates.room = updates.room;
        if (updates.name) overrideUpdates.friendlyName = updates.name;
        setEntityOverride(entityId, overrideUpdates);
      }
    }
  };

  const handleDeleteEntity = (entityId: string) => {
    // Check if it's a custom entity
    if (entityId.startsWith('custom.')) {
      deleteCustomEntity(entityId);
      showToast('Device removed from dashboard');
    } else {
      // For Home Assistant entities, check if this entity is part of a device group
      const deviceGroup = displayedEntityGroups.find(group => 
        group.entities.some(([eid]) => eid === entityId)
      );
      
      if (deviceGroup && deviceGroup.entities.length > 1) {
        // If it's part of a multi-entity device, hide all entities in the device group
        console.log(`[Dashboard] Hiding all entities in device group ${deviceGroup.deviceId}`);
        deviceGroup.entities.forEach(([eid]) => {
          setEntityOverride(eid, { hidden: true });
        });
        showToast(`Removed ${deviceGroup.deviceName} (${deviceGroup.entities.length} entities) from dashboard`);
      } else {
        // For single entities, just hide this entity
        setEntityOverride(entityId, { hidden: true });
        showToast('Device removed from dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Home Assistant
              </h1>
              <p className="text-gray-400 mt-1">Welcome back, {config?.location_name || 'User'}</p>
            </div>
            <div className="flex items-center gap-4">
              {!isSelectionMode && (
                <>
                  <button 
                    onClick={() => {
                      console.log('[Dashboard] Add Device clicked');
                      setShowAddDevice(true);
                    }}
                    className="relative bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" /> Add Device
                    {unassignedDevices.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full 
                                     w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                        {unassignedDevices.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={toggleSelectionMode}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Square className="w-5 h-5" /> Select
                  </button>
                  <button
                    onClick={() => setShowLightAnalyzer(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    title="Analyze light groups"
                  >
                    <Lightbulb className="w-5 h-5" /> Light Groups
                  </button>
                </>
              )}
              
              {isSelectionMode && (
                <>
                  <span className="text-gray-400">
                    {selectedCount} selected
                  </span>
                  {selectedCount > 0 && (
                    <button
                      onClick={() => setShowBulkMove(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <MoveRight className="w-5 h-5" /> Move {selectedCount} Device{selectedCount > 1 ? 's' : ''}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      clearSelection();
                      toggleSelectionMode();
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <X className="w-5 h-5" /> Cancel
                  </button>
                </>
              )}
              
              <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {connected && entities && (
          <>
            {/* View Toggle */}
            <div className="flex gap-4 mb-8 overflow-x-auto">
              <button
                onClick={() => {
                  setView('rooms');
                  setSelectedRoom(null);
                  setSelectedCategory(null);
                }}
                className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  view === 'rooms'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Rooms ({rooms.length})
              </button>
              <button
                onClick={() => {
                  setView('categories');
                  setSelectedRoom(null);
                  setSelectedCategory(null);
                }}
                className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                  view === 'categories'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Types ({orderedCategories.filter(category => (categoryCounts[category.id] || 0) > 0).length})
              </button>
            </div>

            {/* Room/Category Selection Grid */}
            {!selectedRoom && !selectedCategory && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={view === 'rooms' ? rooms.map(r => r.id) : orderedCategories.filter(category => (categoryCounts[category.id] || 0) > 0).map(c => c.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                    {view === 'rooms' && (
                      <>
                        {rooms.map((room) => {
                          // Handle custom room icons
                          let icon = roomIcons[room.id] || roomIcons.default;
                          if (room.isCustom && room.icon) {
                            const IconComponent = (LucideIcons as any)[room.icon];
                            if (IconComponent) {
                              icon = <IconComponent className="w-8 h-8" />;
                            }
                          }
                          
                          return (
                            <DraggableCard key={room.id} id={room.id}>
                              <div className="relative">
                                <button
                                  onClick={() => setSelectedRoom(room.id)}
                                  className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 hover:bg-gray-800 transition-all group w-full"
                                >
                                  <div className="flex justify-center mb-4 text-gray-400 group-hover:text-purple-400 transition-colors">
                                    {icon}
                                  </div>
                                  <h3 className="font-semibold text-white mb-1">
                                    {room.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {room.entityCount} devices
                                  </p>
                                </button>
                                {room.isCustom && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Are you sure you want to delete the room "${room.name}"?`)) {
                                        roomManager.deleteRoom(room.id);
                                      }
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 text-white" />
                                  </button>
                                )}
                              </div>
                            </DraggableCard>
                          );
                        })}
                        {/* Add Room Button */}
                        <button
                          onClick={() => setShowAddRoom(true)}
                          className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 hover:bg-gray-800 transition-all group border-2 border-dashed border-gray-700 hover:border-purple-600"
                        >
                          <div className="flex justify-center mb-4 text-gray-400 group-hover:text-purple-400 transition-colors">
                            <Plus className="w-8 h-8" />
                          </div>
                          <h3 className="font-semibold text-white mb-1">
                            Add Room
                          </h3>
                          <p className="text-sm text-gray-500">
                            Create custom room
                          </p>
                        </button>
                      </>
                    )}

                    {view === 'categories' && (
                      <>
                        {orderedCategories
                          .filter(category => (categoryCounts[category.id] || 0) > 0)
                          .map((category) => (
                          <DraggableCard key={category.id} id={category.id}>
                            <div className="relative">
                              <button
                                onClick={() => setSelectedCategory(category.id)}
                                className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 hover:bg-gray-800 transition-all group w-full"
                              >
                                <div className="flex justify-center mb-4 text-gray-400 group-hover:text-purple-400 transition-colors">
                                  {category.icon}
                                </div>
                                <h3 className="font-semibold text-white mb-1">
                                  {category.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {categoryCounts[category.id] || 0} devices
                                </p>
                              </button>
                              {category.isCustom && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
                                      deleteCustomCategory(category.id);
                                    }
                                  }}
                                  className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-white" />
                                </button>
                              )}
                            </div>
                          </DraggableCard>
                        ))}
                        {/* Add Category Button */}
                        <button
                          onClick={() => setShowAddCategory(true)}
                          className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 hover:bg-gray-800 transition-all group border-2 border-dashed border-gray-700 hover:border-purple-600"
                        >
                          <div className="flex justify-center mb-4 text-gray-400 group-hover:text-purple-400 transition-colors">
                            <Plus className="w-8 h-8" />
                          </div>
                          <h3 className="font-semibold text-white mb-1">
                            Add Category
                          </h3>
                          <p className="text-sm text-gray-500">
                            Create custom type
                          </p>
                        </button>
                      </>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Selected Room/Category View */}
            {(selectedRoom || selectedCategory) && (
              <div>
                {/* Back Button */}
                <button
                  onClick={() => {
                    setSelectedRoom(null);
                    setSelectedCategory(null);
                  }}
                  className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back to {view === 'rooms' ? 'rooms' : 'categories'}
                </button>

                {/* Room/Category Title */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedRoom && rooms.find(r => r.id === selectedRoom)?.name}
                    {selectedCategory && orderedCategories.find(c => c.id === selectedCategory)?.name}
                    <span className="text-base font-normal text-gray-400 ml-2">
                      ({displayedEntityGroups.length} devices)
                    </span>
                  </h2>
                  
                  {/* Delete Room Button - Show for any room with no devices */}
                  {selectedRoom && displayedEntityGroups.length === 0 && (
                    <button
                      onClick={() => {
                        const room = rooms.find(r => r.id === selectedRoom);
                        if (room && confirm(`Are you sure you want to delete the room "${room.name}"?`)) {
                          roomManager.deleteRoom(selectedRoom);
                          setSelectedRoom(null);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Room
                    </button>
                  )}
                  
                  {/* Delete Category Button - Only show for custom categories with no devices */}
                  {selectedCategory && displayedEntityGroups.length === 0 && (
                    <>
                      {orderedCategories.find(c => c.id === selectedCategory)?.isCustom && (
                        <button
                          onClick={() => {
                            const category = orderedCategories.find(c => c.id === selectedCategory);
                            if (category && confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
                              deleteCustomCategory(selectedCategory);
                              setSelectedCategory(null);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Category
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Entity Grid */}
                {displayedEntityGroups.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={displayedEntityGroups.map(g => g.deviceId)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {displayedEntityGroups.map(group => {
                          const [primaryId, primaryEntity] = group.primaryEntity;
                          
                          // Use UnifiedDeviceCard if we have multiple entities for this device
                          if (group.entities.length > 1 || group.device) {
                            return (
                              <DraggableCard key={group.deviceId} id={group.deviceId} isSelectionMode={isSelectionMode}>
                                <UnifiedDeviceCard
                                  deviceId={group.deviceId}
                                  device={group.device || undefined}
                                  entities={group.entities}
                                  primaryEntity={group.primaryEntity}
                                  onEntityUpdate={handleEntityUpdate}
                                  onDelete={handleDeleteEntity}
                                  rooms={rooms}
                                  isCustom={primaryId.startsWith('custom.')}
                                  isSelectionMode={isSelectionMode}
                                  isSelected={isDeviceSelected(group.deviceId)}
                                  onSelectionToggle={() => toggleDeviceSelection(group.deviceId)}
                                />
                              </DraggableCard>
                            );
                          }
                          
                          // Use regular EntityCard for single entities
                          return (
                            <DraggableCard key={group.deviceId} id={group.deviceId} isSelectionMode={isSelectionMode}>
                              <EntityCard 
                                entityId={primaryId} 
                                entity={primaryEntity}
                                onEntityUpdate={handleEntityUpdate}
                                onDelete={handleDeleteEntity}
                                rooms={rooms}
                                isCustom={primaryId.startsWith('custom.')}
                                isSelectionMode={isSelectionMode}
                                isSelected={isDeviceSelected(group.deviceId)}
                                onSelectionToggle={() => toggleDeviceSelection(group.deviceId)}
                              />
                            </DraggableCard>
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-12 bg-gray-800/30 rounded-2xl">
                    <div className="text-gray-400 mb-4">
                      <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No devices in this {view === 'rooms' ? 'room' : 'category'}</p>
                      <p className="text-sm mt-2">Add devices using the "Add Device" button above</p>
                      
                      {/* Debug: Check for Tesla entities in overrides */}
                      {selectedRoom === 'other' && (() => {
                        const teslaInOverrides = getEntityOverride ? 
                          Object.keys(allEntities || {}).map(id => ({ id, override: getEntityOverride(id) }))
                            .filter(item => item.override?.room === 'other' && item.id.toLowerCase().includes('tesla_wall_connector'))
                          : [];
                        
                        if (teslaInOverrides.length > 0) {
                          return (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-left">
                              <p className="text-red-400 font-medium mb-2">Debug: Tesla entities assigned but not displaying</p>
                              {teslaInOverrides.map((item) => (
                                <div key={item.id} className="text-xs text-red-300 mb-1">
                                  {item.id} - Room: {item.override?.room}
                                </div>
                              ))}
                              <p className="text-xs text-yellow-400 mt-2">
                                These entities are assigned to this room but not found in Home Assistant entities.
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!selectedRoom && !selectedCategory && rooms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No rooms detected. Try the Categories view instead.</p>
              </div>
            )}
          </>
        )}

        {/* Loading State */}
        {!connected && !error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Connecting to Home Assistant...</p>
            </div>
          </div>
        )}
      </main>
      
      {/* Add Device Modal */}
      {showAddDevice && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <AddDeviceModal
            onClose={() => setShowAddDevice(false)}
            onAssign={(entityId, roomId) => {
              setEntityOverride(entityId, { room: roomId });
            }}
            entities={allEntities}
            devices={devices}
            rooms={rooms}
            getEffectiveRoom={getEffectiveRoom}
          />
        </React.Suspense>
      )}
      
      
      {/* Add Room Modal */}
      {showAddRoom && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <AddRoomModal
            onClose={() => setShowAddRoom(false)}
            onAdd={roomManager.addRoom}
            existingRooms={rooms}
          />
        </React.Suspense>
      )}
      
      {/* Add Category Modal */}
      {showAddCategory && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <AddCategoryModal
            onClose={() => setShowAddCategory(false)}
            onAdd={addCustomCategory}
            existingCategories={orderedCategories}
          />
        </React.Suspense>
      )}
      
      {/* Bulk Move Modal */}
      {showBulkMove && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <BulkMoveModal
          selectedDevices={selectedDevices}
          rooms={rooms}
          onClose={() => {
            setShowBulkMove(false);
            clearSelection();
            toggleSelectionMode();
          }}
          onMove={(deviceIds, targetRoom) => {
            // For each selected device, find its device group and move all entities
            let totalEntitiesMoved = 0;
            deviceIds.forEach(deviceId => {
              const deviceGroup = displayedEntityGroups.find(group => group.deviceId === deviceId);
              if (deviceGroup) {
                // Move all entities in the device group
                deviceGroup.entities.forEach(([eid]) => {
                  setEntityOverride(eid, { room: targetRoom });
                  totalEntitiesMoved++;
                });
              } else {
                // Fallback for single entities
                setEntityOverride(deviceId, { room: targetRoom });
                totalEntitiesMoved++;
              }
            });
            showToast(`Moved ${deviceIds.length} device${deviceIds.length > 1 ? 's' : ''} (${totalEntitiesMoved} entities) to ${rooms.find(r => r.id === targetRoom)?.name || targetRoom}`);
            setShowBulkMove(false);
            clearSelection();
            toggleSelectionMode();
          }}
          entities={allEntities}
          getEffectiveName={getEffectiveName}
        />
        </React.Suspense>
      )}

      {/* New Device Notification */}
      {hasNewDevices && (
        <NewDeviceNotification
          newDevices={newDevices}
          onAddDevice={() => {
            setShowAddDevice(true);
            dismissNewDevices();
          }}
          onDismiss={dismissNewDevices}
        />
      )}
      

      {/* Light Group Analyzer Modal */}
      {showLightAnalyzer && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"><div className="text-white">Loading...</div></div>}>
          <LightGroupAnalyzer onClose={() => setShowLightAnalyzer(false)} />
        </React.Suspense>
      )}

      {/* Storage Debug Panel - Only in development */}
      {import.meta.env.DEV && <StorageDebugPanel />}
    </div>
  );
};

export default Dashboard;