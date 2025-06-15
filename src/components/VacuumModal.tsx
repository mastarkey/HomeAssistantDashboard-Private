import React, { useState } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  X, 
  Play, 
  Pause, 
  Home as HomeIcon,
  Power,
  MapPin,
  Battery,
  AlertCircle,
  Clock,
  Navigation,
  Trash2,
  Edit2,
  CheckCircle,
  Wind
} from 'lucide-react';
import EditDeviceModal from './EditDeviceModal';
import { useCustomEntities } from '../hooks/useCustomEntities';
import { useEntityOverrides } from '../hooks/useEntityOverrides';

interface VacuumModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const VacuumModal: React.FC<VacuumModalProps> = ({ entityId, entity, onClose, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService } = useHomeAssistant();
  const { deleteCustomEntity } = useCustomEntities();
  const { setEntityOverride } = useEntityOverrides();
  const [isControlling, setIsControlling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Extract vacuum attributes
  const battery = attributes.battery_level;
  const fanSpeed = attributes.fan_speed;
  const fanSpeedList = attributes.fan_speed_list || [];
  const status = attributes.status || state;
  const cleaningTime = attributes.cleaning_time;
  const cleanedArea = attributes.cleaned_area;
  const model = attributes.model || 'Unknown Model';
  const errorMessage = attributes.error;
  
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
    if (isCleaning) return 'text-green-500';
    if (isDocked) return 'text-blue-500';
    if (isReturning) return 'text-yellow-500';
    if (isPaused) return 'text-orange-500';
    if (isError) return 'text-red-500';
    return 'text-gray-400';
  };
  
  const getStateIcon = () => {
    const iconClass = "w-6 h-6";
    if (isCleaning) return <Navigation className={`${iconClass} animate-pulse`} />;
    if (isDocked) return <HomeIcon className={iconClass} />;
    if (isReturning) return <Navigation className={`${iconClass} rotate-180`} />;
    if (isPaused) return <Pause className={iconClass} />;
    if (isError) return <AlertCircle className={iconClass} />;
    return <Power className={iconClass} />;
  };
  
  const getBatteryColor = () => {
    if (!battery) return 'text-gray-400';
    if (battery > 60) return 'text-green-400';
    if (battery > 30) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gray-800 ${getStateColor()}`}>
                {getStateIcon()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{friendlyName}</h2>
                <p className="text-gray-400 capitalize">{status}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
            {/* Main Content */}
            <div className="lg:col-span-2 p-6 space-y-6">
              {/* Status Overview */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Battery */}
                  {battery !== undefined && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Battery className={`w-5 h-5 ${getBatteryColor()}`} />
                        <span className={`text-2xl font-bold ${getBatteryColor()}`}>
                          {battery}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Battery Level</p>
                    </div>
                  )}
                  
                  {/* Cleaning Time */}
                  {cleaningTime !== undefined && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="text-2xl font-bold text-white">
                          {cleaningTime}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Minutes Cleaned</p>
                    </div>
                  )}
                  
                  {/* Cleaned Area */}
                  {cleanedArea !== undefined && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <MapPin className="w-5 h-5 text-purple-400" />
                        <span className="text-2xl font-bold text-white">
                          {cleanedArea}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Area (m²)</p>
                    </div>
                  )}
                  
                  {/* Fan Speed */}
                  {fanSpeed && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Wind className="w-5 h-5 text-green-400" />
                        <span className="text-lg font-bold text-white capitalize">
                          {fanSpeed}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Fan Speed</p>
                    </div>
                  )}
                </div>
                
                {/* Error Message */}
                {isError && errorMessage && (
                  <div className="mt-4 bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 font-medium">Error</p>
                        <p className="text-sm text-red-300 mt-1">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Controls</h3>
                
                {/* Main Controls */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => {
                      if (isCleaning || isReturning) {
                        handleControl('pause');
                      } else {
                        handleControl('start');
                      }
                    }}
                    disabled={isControlling}
                    className="p-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {isCleaning || isReturning ? (
                      <>
                        <Pause className="w-5 h-5" />
                        <span>Pause Cleaning</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Start Cleaning</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleControl('stop')}
                    disabled={isControlling || (!isCleaning && !isReturning && !isPaused)}
                    className="p-4 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Power className="w-5 h-5" />
                    <span>Stop</span>
                  </button>
                  
                  <button
                    onClick={() => handleControl('return_to_base')}
                    disabled={isControlling || isDocked}
                    className="p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <HomeIcon className="w-5 h-5" />
                    <span>Return to Dock</span>
                  </button>
                  
                  <button
                    onClick={() => handleControl('locate')}
                    disabled={isControlling}
                    className="p-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Find Robot</span>
                  </button>
                </div>
                
                {/* Fan Speed Control */}
                {fanSpeedList.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm text-gray-400 mb-2 block">Fan Speed</label>
                    <div className="grid grid-cols-4 gap-2">
                      {fanSpeedList.map((speed: string) => (
                        <button
                          key={speed}
                          onClick={() => handleControl('set_fan_speed', { fan_speed: speed })}
                          disabled={isControlling}
                          className={`p-2 rounded-lg capitalize text-sm transition-colors ${
                            fanSpeed === speed 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                          }`}
                        >
                          {speed}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Device Info */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Device Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Model</span>
                    <span className="text-white">{model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">State</span>
                    <span className="text-white capitalize">{state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entity ID</span>
                    <span className="text-white font-mono text-xs">{entityId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="bg-gray-800/30 p-6 border-l border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Device</span>
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to ${isCustom ? 'delete' : 'hide'} ${friendlyName}?`)) {
                      if (isCustom) {
                        deleteCustomEntity(entityId);
                      } else {
                        setEntityOverride(entityId, { hidden: true });
                        if (onEntityUpdate) {
                          onEntityUpdate(entityId, { hidden: true });
                        }
                      }
                      onClose();
                    }
                  }}
                  className="w-full p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isCustom ? 'Delete' : 'Hide'} Device</span>
                </button>
              </div>
              
              {/* Capabilities */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Capabilities</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Start/Stop</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Return to Dock</span>
                  </div>
                  {fanSpeedList.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Fan Speed Control</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Locate Robot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Device Modal */}
      {showEditModal && (
        <EditDeviceModal
          entityId={entityId}
          entity={entity}
          onClose={() => setShowEditModal(false)}
          onSave={onEntityUpdate || (() => {})}
          rooms={rooms}
          isCustom={isCustom}
        />
      )}
    </div>
  );
};

export default VacuumModal;