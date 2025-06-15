import React, { useState, useMemo } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { useOrderStorage } from '../hooks/useOrderStorage';
import { useCustomEntities } from '../hooks/useCustomEntities';
import { useEntityOverrides } from '../hooks/useEntityOverrides';
import { useRoomManager } from '../hooks/useRoomManager';
import { useCustomCategories } from '../hooks/useCustomCategories';
import EntityCard from './EntityCard';
import DraggableCard from './DraggableCard';
import AddDeviceModal from './AddDeviceModal';
import AddRoomModal from './AddRoomModal';
import AddCategoryModal from './AddCategoryModal';
import { filterEntitiesByCategory } from '../utils/entityHelpers';
import { filterEntitiesByRoomWithOverrides } from '../utils/entityHelpersWithOverrides';
import { deduplicateEntities } from '../utils/deduplicateEntities';
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
  const { updateRoomOrder, updateCategoryOrder, updateDeviceOrder, getRoomOrder, getCategoryOrder, getDeviceOrder } = useOrderStorage();
  const { customEntities, updateCustomEntity, moveCustomEntityToRoom } = useCustomEntities();
  const { setEntityOverride, getEffectiveRoom, getEntityOverride } = useEntityOverrides();
  const { customCategories, addCustomCategory, deleteCustomCategory } = useCustomCategories();
  const [view, setView] = useState<'rooms' | 'categories'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  
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

  // Merge Home Assistant entities with custom entities
  const allEntities = useMemo(() => {
    if (!entities) return customEntities;
    return { ...entities, ...customEntities };
  }, [entities, customEntities]);
  
  // Use the room manager for unified room handling
  const roomManager = useRoomManager(allEntities, getEffectiveRoom);
  
  // Get rooms with proper entity counts
  const rooms = useMemo(() => {
    const roomsWithCounts = roomManager.rooms.map(room => {
      const roomEntities = filterEntitiesByRoomWithOverrides(allEntities, room.id, getEffectiveRoom);
      const deduplicated = deduplicateEntities(roomEntities, devices, allEntities);
      const primaryDevices = filterPrimaryDevices(deduplicated, devices, allEntities);
      
      // Debug logging for garage and other rooms
      if (room.id === 'garage' || room.id === 'other') {
        console.log(`[DEBUG] ${room.name} room entities:`, {
          allEntitiesCount: roomEntities.length,
          deduplicatedCount: deduplicated.length,
          primaryDevicesCount: primaryDevices.length,
          entities: primaryDevices.map(([id, e]) => ({ 
            id, 
            friendlyName: e.attributes?.friendly_name,
            domain: id.split('.')[0],
            effectiveRoom: getEffectiveRoom(id),
            override: getEntityOverride(id)
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
      
      // Filter out hidden and camera detection entities for count
      const visibleCount = primaryDevices.filter(([entityId, entity]) => {
        const override = getEntityOverride(entityId);
        if (override?.hidden) return false;
        
        // Use improved detection logic that doesn't rely on friendly names
        const device = devices ? getDeviceForEntity(entityId, allEntities, devices) : null;
        if (isCameraDetectionEntity(entityId, entity, device)) {
          return false;
        }
        
        return true;
      }).length;
      
      return {
        ...room,
        entityCount: visibleCount
      };
    });
    
    // Apply saved order
    const ordered = getRoomOrder(roomsWithCounts);
    return ordered;
  }, [roomManager.rooms, allEntities, devices, getRoomOrder, getEffectiveRoom, getEntityOverride]);

  // Filter entities based on selection
  const displayedEntities = useMemo(() => {
    console.log('[DEBUG] Computing displayedEntities for room:', selectedRoom, 'view:', view);
    if (!allEntities) return [];
    
    let filtered: [string, any][] = [];
    
    if (view === 'rooms' && selectedRoom) {
      filtered = filterEntitiesByRoomWithOverrides(allEntities, selectedRoom, getEffectiveRoom);
      
      // FORCE ADD Tesla entities to Other room
      if (selectedRoom === 'other') {
        // Add any Tesla Wall Connector entities that might have been missed
        Object.entries(allEntities).forEach(([entityId, entity]) => {
          if (entityId.toLowerCase().includes('tesla_wall_connector')) {
            const exists = filtered.some(([id]) => id === entityId);
            if (!exists) {
              console.log(`[DEBUG] FORCE ADDING Tesla entity to Other room: ${entityId}`);
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
    
    // Deduplicate entities
    const deduplicated = deduplicateEntities(filtered, devices, allEntities);
    
    if (selectedRoom === 'other') {
      console.log('[DEBUG] Step 2 - After deduplication:', deduplicated.map(([id, entity]) => ({
        id,
        name: entity.attributes?.friendly_name || id,
        domain: id.split('.')[0]
      })));
    }
    
    // Filter to only show primary devices
    const primaryDevices = filterPrimaryDevices(deduplicated, devices, allEntities);
    
    if (selectedRoom === 'other') {
      console.log('[DEBUG] Step 3 - After filterPrimaryDevices:', primaryDevices.map(([id, entity]) => ({
        id,
        name: entity.attributes?.friendly_name || id,
        domain: id.split('.')[0]
      })));
    }
    
    // Filter out hidden entities and camera detection entities
    const visibleDevices = primaryDevices.filter(([entityId, entity]) => {
      const override = getEntityOverride(entityId);
      if (override?.hidden) return false;
      
      // Use improved detection logic that doesn't rely on friendly names
      const device = devices ? getDeviceForEntity(entityId, allEntities, devices) : null;
      if (isCameraDetectionEntity(entityId, entity, device)) {
        return false;
      }
      
      return true;
    });
    
    // Debug final visible devices for Other room
    if (selectedRoom === 'other') {
      console.log('[DEBUG] Step 4 - Final visible devices in Other room:', visibleDevices.map(([id, entity]) => ({
        id,
        name: entity.attributes?.friendly_name || id,
        domain: id.split('.')[0]
      })));
      
      // Also log all entities with their overrides
      console.log('[DEBUG] Entity overrides:', Object.entries(allEntities)
        .filter(([id]) => id.toLowerCase().includes('tesla'))
        .map(([id]) => ({
          id,
          override: getEntityOverride(id),
          effectiveRoom: getEffectiveRoom(id)
        }))
      );
    }
    
    // Sort entities
    const sorted = visibleDevices.sort((a, b) => {
      // Sort by domain first (lights, switches, then others)
      const domainOrder = ['light', 'switch', 'climate', 'media_player', 'sensor', 'binary_sensor'];
      const aDomain = a[0].split('.')[0];
      const bDomain = b[0].split('.')[0];
      const aOrder = domainOrder.indexOf(aDomain) !== -1 ? domainOrder.indexOf(aDomain) : 999;
      const bOrder = domainOrder.indexOf(bDomain) !== -1 ? domainOrder.indexOf(bDomain) : 999;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Then sort by friendly name
      const aName = (a[1].attributes?.friendly_name || a[0]).toLowerCase();
      const bName = (b[1].attributes?.friendly_name || b[0]).toLowerCase();
      return aName.localeCompare(bName);
    });
    
    // Apply saved order for devices
    if (selectedRoom) {
      return getDeviceOrder(selectedRoom, sorted);
    } else if (selectedCategory) {
      return getDeviceOrder(selectedCategory, sorted);
    }
    
    // Final debug for Other room
    if (selectedRoom === 'other') {
      console.log('[DEBUG] FINAL displayedEntities for Other room:', sorted.length, 'entities');
      sorted.forEach(([id, entity]) => {
        if (id.toLowerCase().includes('tesla')) {
          console.log('[DEBUG] Tesla entity in final display:', id, entity.state);
        }
      });
    }
    
    return sorted;
  }, [allEntities, view, selectedRoom, selectedCategory, devices, getDeviceOrder, categoryDomains]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!allEntities) return {};
    const counts: Record<string, number> = {};
    
    deviceCategories.forEach(category => {
      const categoryEntities = filterEntitiesByCategory(allEntities, category.id, categoryDomains);
      const deduplicated = deduplicateEntities(categoryEntities, devices, allEntities);
      const primaryDevices = filterPrimaryDevices(deduplicated, devices, allEntities);
      
      // Debug logging for climate category
      if (category.id === 'climate') {
        console.log('[DEBUG] Climate category entities:', {
          allEntitiesCount: categoryEntities.length,
          deduplicatedCount: deduplicated.length,
          primaryDevicesCount: primaryDevices.length,
          entities: primaryDevices.map(([id, e]) => ({ 
            id, 
            friendlyName: e.attributes?.friendly_name,
            room: getEffectiveRoom(id)
          }))
        });
      }
      
      // Filter out hidden and camera detection entities
      const visibleCount = primaryDevices.filter(([entityId, entity]) => {
        const override = getEntityOverride(entityId);
        if (override?.hidden) return false;
        
        // Use improved detection logic that doesn't rely on friendly names
        const device = devices ? getDeviceForEntity(entityId, allEntities, devices) : null;
        if (isCameraDetectionEntity(entityId, entity, device)) {
          return false;
        }
        
        return true;
      }).length;
      
      counts[category.id] = visibleCount;
    });
    
    // Add counts for custom categories
    customCategories.forEach(category => {
      const categoryEntities = filterEntitiesByCategory(allEntities, category.id, categoryDomains);
      const deduplicated = deduplicateEntities(categoryEntities, devices, allEntities);
      const primaryDevices = filterPrimaryDevices(deduplicated, devices, allEntities);
      
      // Filter out hidden and camera detection entities
      const visibleCount = primaryDevices.filter(([entityId, entity]) => {
        const override = getEntityOverride(entityId);
        if (override?.hidden) return false;
        
        // Use improved detection logic that doesn't rely on friendly names
        const device = devices ? getDeviceForEntity(entityId, allEntities, devices) : null;
        if (isCameraDetectionEntity(entityId, entity, device)) {
          return false;
        }
        
        return true;
      }).length;
      
      counts[category.id] = visibleCount;
    });
    
    return counts;
  }, [allEntities, devices, customCategories, categoryDomains, getEffectiveRoom, getEntityOverride]);
  
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
      const oldIndex = displayedEntities.findIndex(([id]) => id === active.id);
      const newIndex = displayedEntities.findIndex(([id]) => id === over.id);
      
      console.log('[DEBUG] Device drag:', { oldIndex, newIndex, key: selectedRoom || selectedCategory });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(displayedEntities, oldIndex, newIndex).map(([id]) => id);
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
      // For Home Assistant entities, just save overrides
      const overrideUpdates: any = {};
      if (updates.room) overrideUpdates.room = updates.room;
      if (updates.name) overrideUpdates.friendlyName = updates.name;
      setEntityOverride(entityId, overrideUpdates);
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
              <button 
                onClick={() => setShowAddDevice(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span className="text-xl">+</span> Add Device
              </button>
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
                      ({displayedEntities.length} devices)
                    </span>
                  </h2>
                  
                  {/* Delete Room Button - Show for any room with no devices */}
                  {selectedRoom && displayedEntities.length === 0 && (
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
                  {selectedCategory && displayedEntities.length === 0 && (
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
                {displayedEntities.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={displayedEntities.map(([id]) => id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {displayedEntities.map(([entityId, entity]) => {
                          if (entityId.toLowerCase().includes('tesla')) {
                            console.log('[DEBUG] Rendering Tesla entity card:', entityId);
                          }
                          return (
                            <DraggableCard key={entityId} id={entityId}>
                              <EntityCard 
                                entityId={entityId} 
                                entity={entity}
                                onEntityUpdate={handleEntityUpdate}
                                rooms={rooms}
                                isCustom={entityId.startsWith('custom.')}
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
      )}
      
      
      {/* Add Room Modal */}
      {showAddRoom && (
        <AddRoomModal
          onClose={() => setShowAddRoom(false)}
          onAdd={roomManager.addRoom}
          existingRooms={rooms}
        />
      )}
      
      {/* Add Category Modal */}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onAdd={addCustomCategory}
          existingCategories={orderedCategories}
        />
      )}
    </div>
  );
};

export default Dashboard;