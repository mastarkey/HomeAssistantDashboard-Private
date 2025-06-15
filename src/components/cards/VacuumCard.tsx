import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { 
  MoreVertical,
  Power,
  Play,
  Pause,
  Home as HomeIcon,
  MapPin,
  Battery,
  AlertCircle,
  Clock,
  Gauge,
  Navigation
} from 'lucide-react';
import VacuumModal from '../VacuumModal';

interface VacuumCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const VacuumCard: React.FC<VacuumCardProps> = ({ entityId, entity, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService } = useHomeAssistant();
  const [isControlling, setIsControlling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Extract vacuum attributes
  const battery = attributes.battery_level;
  const fanSpeed = attributes.fan_speed;
  const status = attributes.status || state;
  const cleaningTime = attributes.cleaned_time;
  const cleanedArea = attributes.cleaned_area;
  
  // Determine state
  const isDocked = state === 'docked';
  const isCleaning = state === 'cleaning';
  const isReturning = state === 'returning';
  const isPaused = state === 'paused';
  const isError = state === 'error';
  
  const handleControl = async (service: string, data?: any) => {
    if (isControlling) return;
    setIsControlling(true);
    
    try {
      await callService('vacuum', service, {
        entity_id: entityId,
        ...data
      });
    } catch (error) {
      console.error(`Failed to ${service}:`, error);
    } finally {
      setTimeout(() => setIsControlling(false), 300);
    }
  };
  
  const getStateColor = () => {
    if (isCleaning) return 'bg-green-500';
    if (isDocked) return 'bg-blue-500';
    if (isReturning) return 'bg-yellow-500';
    if (isPaused) return 'bg-orange-500';
    if (isError) return 'bg-red-500';
    return 'bg-gray-500';
  };
  
  const getStateIcon = () => {
    if (isCleaning) return <Navigation className="w-4 h-4 animate-pulse" />;
    if (isDocked) return <HomeIcon className="w-4 h-4" />;
    if (isReturning) return <Navigation className="w-4 h-4 rotate-180" />;
    if (isPaused) return <Pause className="w-4 h-4" />;
    if (isError) return <AlertCircle className="w-4 h-4" />;
    return <Power className="w-4 h-4" />;
  };
  
  const getBatteryColor = () => {
    if (!battery) return 'text-gray-400';
    if (battery > 60) return 'text-green-400';
    if (battery > 30) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  return (
    <>
      <div 
        className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group cursor-pointer relative overflow-hidden"
        onClick={() => setShowModal(true)}
      >
        {/* Background gradient for active state */}
        {isCleaning && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-blue-600/10" />
        )}
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <Navigation className="w-5 h-5 text-gray-300" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStateColor()} flex items-center justify-center`}>
                  {getStateIcon()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-medium truncate">{friendlyName}</h3>
                <p className="text-xs text-gray-400 capitalize">
                  {status}
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
          
          {/* Status Info */}
          <div className="bg-gray-700/30 rounded-lg p-3 mb-3 space-y-2">
            {/* Battery */}
            {battery !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Battery className={`w-4 h-4 ${getBatteryColor()}`} />
                  <span className="text-gray-300">Battery</span>
                </div>
                <span className={`text-sm font-medium ${getBatteryColor()}`}>
                  {battery}%
                </span>
              </div>
            )}
            
            {/* Cleaning info */}
            {(cleaningTime || cleanedArea) && (
              <>
                {cleaningTime && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Time</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {cleaningTime} min
                    </span>
                  </div>
                )}
                {cleanedArea && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Area</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {cleanedArea} m²
                    </span>
                  </div>
                )}
              </>
            )}
            
            {/* Fan Speed */}
            {fanSpeed && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Fan</span>
                </div>
                <span className="text-sm text-gray-400 capitalize">
                  {fanSpeed}
                </span>
              </div>
            )}
          </div>
          
          {/* Quick Controls */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isCleaning || isReturning) {
                  handleControl('pause');
                } else {
                  handleControl('start');
                }
              }}
              disabled={isControlling}
              className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center gap-1 text-sm"
            >
              {isCleaning || isReturning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start</span>
                </>
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleControl('return_to_base');
              }}
              disabled={isControlling || isDocked}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center gap-1 text-sm disabled:opacity-50"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Dock</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleControl('locate');
              }}
              disabled={isControlling}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Find</span>
            </button>
          </div>
          
          {/* Type Label */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider">VACUUM</span>
          </div>
        </div>
      </div>
      
      {/* Vacuum Modal */}
      {showModal && (
        <VacuumModal
          entityId={entityId}
          entity={entity}
          onClose={() => setShowModal(false)}
          onEntityUpdate={onEntityUpdate}
          rooms={rooms}
          isCustom={isCustom}
        />
      )}
    </>
  );
};

export default VacuumCard;