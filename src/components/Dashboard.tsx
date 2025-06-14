import React, { useState, useMemo } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { useOrderStorage } from '../hooks/useOrderStorage';
import { useCustomEntities } from '../hooks/useCustomEntities';
import EntityCard from './EntityCard';
import DraggableCard from './DraggableCard';
import AddDeviceModal from './AddDeviceModal';
import { getRoomsFromEntities, filterEntitiesByRoom, filterEntitiesByCategory } from '../utils/entityHelpers';
import { deduplicateEntities } from '../utils/deduplicateEntities';
import { filterPrimaryDevices } from '../utils/deviceFiltering';
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
  DoorOpen
} from 'lucide-react';

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

// Category domains mapping for the helper function
const categoryDomains = deviceCategories.reduce((acc, cat) => {
  acc[cat.id] = cat.domains;
  return acc;
}, {} as Record<string, string[]>);

// Room icons mapping
const roomIcons: Record<string, React.ReactNode> = {
  'bedroom': <Bed className="w-8 h-8" />,
  'master bedroom': <Bed className="w-8 h-8" />,
  'guest bedroom': <Bed className="w-8 h-8" />,
  'bathroom': <Bath className="w-8 h-8" />,
  'kitchen': <UtensilsCrossed className="w-8 h-8" />,
  'living room': <Sofa className="w-8 h-8" />,
  'garage': <Car className="w-8 h-8" />,
  'entryway': <DoorOpen className="w-8 h-8" />,
  'hallway': <DoorOpen className="w-8 h-8" />,
  'default': <Home className="w-8 h-8" />
};

const Dashboard: React.FC = () => {
  const { entities, config, connected, error, devices } = useHomeAssistant();
  const { updateRoomOrder, updateCategoryOrder, updateDeviceOrder, getRoomOrder, getCategoryOrder, getDeviceOrder } = useOrderStorage();
  const { customEntities, addCustomEntity } = useCustomEntities();
  const [view, setView] = useState<'rooms' | 'categories'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Merge Home Assistant entities with custom entities
  const allEntities = useMemo(() => {
    if (!entities) return customEntities;
    return { ...entities, ...customEntities };
  }, [entities, customEntities]);
  
  // Get unique rooms from entities
  const rooms = useMemo(() => {
    if (!allEntities) return [];
    const allRooms = getRoomsFromEntities(allEntities);
    
    // Calculate deduplicated counts for each room
    const roomsWithCounts = allRooms.map(room => {
      const roomEntities = filterEntitiesByRoom(allEntities, room.id);
      const deduplicated = deduplicateEntities(roomEntities, devices, allEntities);
      const primaryCount = filterPrimaryDevices(deduplicated, devices, allEntities).length;
      return {
        ...room,
        entityCount: primaryCount
      };
    }).filter(room => room.id !== 'other' || room.entityCount > 5);
    
    // Apply saved order
    return getRoomOrder(roomsWithCounts);
  }, [allEntities, devices, getRoomOrder]);

  // Filter entities based on selection
  const displayedEntities = useMemo(() => {
    if (!allEntities) return [];
    
    let filtered: [string, any][] = [];
    
    if (view === 'rooms' && selectedRoom) {
      filtered = filterEntitiesByRoom(allEntities, selectedRoom);
    } else if (view === 'categories' && selectedCategory) {
      filtered = filterEntitiesByCategory(allEntities, selectedCategory, categoryDomains);
    }
    
    // Deduplicate entities
    const deduplicated = deduplicateEntities(filtered, devices, allEntities);
    
    // Filter to only show primary devices
    const primaryDevices = filterPrimaryDevices(deduplicated, devices, allEntities);
    
    // Sort entities
    const sorted = primaryDevices.sort((a, b) => {
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
    
    return sorted;
  }, [allEntities, view, selectedRoom, selectedCategory, devices, getDeviceOrder]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    if (!allEntities) return {};
    const counts: Record<string, number> = {};
    
    deviceCategories.forEach(category => {
      const categoryEntities = filterEntitiesByCategory(allEntities, category.id, categoryDomains);
      const deduplicated = deduplicateEntities(categoryEntities, devices, allEntities);
      const primaryDevices = filterPrimaryDevices(deduplicated, devices, allEntities);
      counts[category.id] = primaryDevices.length;
    });
    
    return counts;
  }, [allEntities, devices]);
  
  // Get ordered categories
  const orderedCategories = useMemo(() => {
    return getCategoryOrder([...deviceCategories]);
  }, [getCategoryOrder]);
  
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      if (view === 'rooms') {
        const oldIndex = rooms.findIndex(room => room.id === active.id);
        const newIndex = rooms.findIndex(room => room.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(rooms, oldIndex, newIndex).map(room => room.id);
          updateRoomOrder(newOrder);
        }
      } else if (view === 'categories') {
        const oldIndex = orderedCategories.findIndex(cat => cat.id === active.id);
        const newIndex = orderedCategories.findIndex(cat => cat.id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(orderedCategories, oldIndex, newIndex).map(cat => cat.id);
          updateCategoryOrder(newOrder);
        }
      } else if (selectedRoom || selectedCategory) {
        const oldIndex = displayedEntities.findIndex(([id]) => id === active.id);
        const newIndex = displayedEntities.findIndex(([id]) => id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(displayedEntities, oldIndex, newIndex).map(([id]) => id);
          const key = selectedRoom || selectedCategory || '';
          updateDeviceOrder(key, newOrder);
        }
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
                Types ({deviceCategories.length})
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
                  items={view === 'rooms' ? rooms.map(r => r.id) : orderedCategories.map(c => c.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
                    {view === 'rooms' && rooms.map((room) => (
                      <DraggableCard key={room.id} id={room.id}>
                        <button
                          onClick={() => setSelectedRoom(room.id)}
                          className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 hover:bg-gray-800 transition-all group w-full"
                        >
                          <div className="flex justify-center mb-4 text-gray-400 group-hover:text-purple-400 transition-colors">
                            {roomIcons[room.id] || roomIcons.default}
                          </div>
                          <h3 className="font-semibold text-white mb-1">
                            {room.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {room.entityCount} devices
                          </p>
                        </button>
                      </DraggableCard>
                    ))}

                    {view === 'categories' && orderedCategories.map((category) => (
                      <DraggableCard key={category.id} id={category.id}>
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
                      </DraggableCard>
                    ))}
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
                <h2 className="text-2xl font-bold text-white mb-6">
                  {selectedRoom && rooms.find(r => r.id === selectedRoom)?.name}
                  {selectedCategory && orderedCategories.find(c => c.id === selectedCategory)?.name}
                  <span className="text-base font-normal text-gray-400 ml-2">
                    ({displayedEntities.length} devices)
                  </span>
                </h2>

                {/* Entity Grid */}
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
                      {displayedEntities.map(([entityId, entity]) => (
                        <DraggableCard key={entityId} id={entityId}>
                          <EntityCard entityId={entityId} entity={entity} />
                        </DraggableCard>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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
          onAdd={addCustomEntity}
          rooms={rooms}
        />
      )}
    </div>
  );
};

export default Dashboard;