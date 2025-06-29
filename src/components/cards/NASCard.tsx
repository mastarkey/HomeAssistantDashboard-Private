import React, { useState } from 'react';
import { useHomeAssistant } from '../../hooks/useHomeAssistant';
import { 
  Server, 
  HardDrive, 
  Cpu,
  Thermometer,
  Wifi,
  MoreVertical,
  Power,
  Database
} from 'lucide-react';
import NASModal from '../NASModal';

interface NASCardProps {
  entityId: string;
  entity: any;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: () => void;
}

const NASCard: React.FC<NASCardProps> = ({ entityId, entity, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService, entities } = useHomeAssistant();
  const [isControlling, setIsControlling] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Common NAS states
  const isOn = state === 'on' || state === 'online' || state === 'running';
  const isOff = state === 'off' || state === 'offline';
  const isSleeping = state === 'sleeping' || state === 'standby';
  const isUnknown = state === 'unknown' || state === 'unavailable';
  
  // Find related entities
  const findRelatedEntity = (pattern: RegExp): any => {
    if (!entities) return null;
    const baseName = entityId.split('.')[1];
    const relatedId = Object.keys(entities).find(id => 
      (id.includes(baseName) || id.includes('nas') || id.includes('synology') || id.includes('qnap')) && 
      pattern.test(id)
    );
    return relatedId ? entities[relatedId] : null;
  };
  
  // Storage metrics
  const diskUsageSensor = findRelatedEntity(/_(disk_usage|volume_usage|storage_usage)$/);
  const diskUsedSensor = findRelatedEntity(/_(disk_used|volume_used|storage_used)$/);
  const diskTotalSensor = findRelatedEntity(/_(disk_total|volume_total|storage_total)$/);
  
  const diskUsage = diskUsageSensor?.state ? parseFloat(diskUsageSensor.state) : 
                   attributes.disk_usage || attributes.volume_usage || attributes.storage_usage || 0;
  const diskUsed = diskUsedSensor?.state ? parseFloat(diskUsedSensor.state) : 
                  attributes.disk_used || attributes.volume_used || 0;
  const diskTotal = diskTotalSensor?.state ? parseFloat(diskTotalSensor.state) : 
                   attributes.disk_total || attributes.volume_total || 0;
  
  // System metrics
  const cpuSensor = findRelatedEntity(/_(cpu|processor)(_usage|_load)?$/);
  const memorySensor = findRelatedEntity(/_(memory|ram)(_usage)?$/);
  const temperatureSensor = findRelatedEntity(/_(temperature|temp)$/);
  const uptimeSensor = findRelatedEntity(/_uptime$/);
  const networkSensor = findRelatedEntity(/_(network|download|upload)(_speed)?$/);
  
  const cpuUsage = cpuSensor?.state ? parseFloat(cpuSensor.state) : 
                  attributes.cpu_usage || attributes.cpu_load || 0;
  const memoryUsage = memorySensor?.state ? parseFloat(memorySensor.state) : 
                     attributes.memory_usage || attributes.ram_usage || 0;
  const temperature = temperatureSensor?.state ? parseFloat(temperatureSensor.state) : 
                     attributes.temperature || null;
  const uptime = uptimeSensor?.state || attributes.uptime || null;
  const networkSpeed = networkSensor?.state || attributes.network_speed || null;
  
  // Calculate disk usage percentage if we have total and used
  const calculateDiskUsage = () => {
    if (diskUsage > 0) return diskUsage;
    if (diskTotal > 0 && diskUsed > 0) {
      return (diskUsed / diskTotal) * 100;
    }
    return 0;
  };
  
  const actualDiskUsage = calculateDiskUsage();
  
  const handleControl = async (service: string, data?: any) => {
    if (isControlling) return;
    setIsControlling(true);
    
    try {
      const domain = entityId.split('.')[0];
      await callService(domain, service, {
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
    if (isOn) return 'bg-green-500';
    if (isSleeping) return 'bg-yellow-500';
    if (isOff) return 'bg-gray-600';
    if (isUnknown) return 'bg-red-600';
    return 'bg-gray-700';
  };
  
  const getStateText = () => {
    if (isOn) return 'Online';
    if (isSleeping) return 'Sleeping';
    if (isOff) return 'Offline';
    if (isUnknown) return 'Unknown';
    return state;
  };
  
  const formatStorage = (gb: number) => {
    if (gb >= 1000) {
      return `${(gb / 1000).toFixed(1)} TB`;
    }
    return `${gb.toFixed(0)} GB`;
  };
  
  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-400';
    if (usage >= 75) return 'text-yellow-400';
    return 'text-green-400';
  };
  
  const getUsageBarColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-600';
    if (usage >= 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };
  
  return (
    <>
      <div 
        className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group cursor-pointer relative overflow-hidden"
        onClick={() => setShowModal(true)}
      >
        {/* Background gradient for critical states */}
        {actualDiskUsage >= 90 && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-orange-900/10" />
        )}
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative p-2 bg-gray-700 rounded-lg">
                <Server className="w-5 h-5 text-white" />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStateColor()}`}></div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-medium truncate">{friendlyName}</h3>
                <p className="text-xs text-gray-400">{getStateText()}</p>
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
          
          {/* Storage Usage */}
          {isOn && actualDiskUsage > 0 && (
            <div className="bg-gray-700/30 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white">Storage</span>
                </div>
                <span className={`text-sm font-medium ${getUsageColor(actualDiskUsage)}`}>
                  {actualDiskUsage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getUsageBarColor(actualDiskUsage)} transition-all duration-500`}
                  style={{ width: `${Math.min(actualDiskUsage, 100)}%` }}
                />
              </div>
              {diskTotal > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {formatStorage(diskUsed)} / {formatStorage(diskTotal)}
                </p>
              )}
            </div>
          )}
          
          {/* System Metrics */}
          {isOn && (cpuUsage > 0 || memoryUsage > 0) && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {cpuUsage > 0 && (
                <div className="bg-gray-700/30 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Cpu className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">CPU</span>
                  </div>
                  <p className={`text-sm font-medium ${getUsageColor(cpuUsage)}`}>
                    {cpuUsage.toFixed(0)}%
                  </p>
                </div>
              )}
              {memoryUsage > 0 && (
                <div className="bg-gray-700/30 rounded-lg p-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Database className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Memory</span>
                  </div>
                  <p className={`text-sm font-medium ${getUsageColor(memoryUsage)}`}>
                    {memoryUsage.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Additional Info */}
          {isOn && (temperature !== null || networkSpeed !== null) && (
            <div className="flex items-center justify-between text-xs text-gray-400">
              {temperature !== null && (
                <div className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3" />
                  <span>{temperature}°C</span>
                </div>
              )}
              {networkSpeed !== null && (
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  <span>{networkSpeed}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Quick Actions for Off State */}
          {isOff && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleControl('turn_on');
              }}
              className="w-full p-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center justify-center gap-2 mt-3"
            >
              <Power className="w-4 h-4" />
              <span className="text-sm">Wake Up</span>
            </button>
          )}
          
          {/* Status Indicator for Sleeping State */}
          {isSleeping && (
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-2 mt-3">
              <p className="text-xs text-yellow-200 text-center">System in standby mode</p>
            </div>
          )}
          
          {/* Type Label */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider">NAS</span>
            {isOn && uptime && (
              <span className="text-xs text-gray-400">Up {uptime}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* NAS Modal */}
      {showModal && (
        <NASModal
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

export default NASCard;