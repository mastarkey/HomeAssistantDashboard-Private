import React, { useState } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  X, 
  Server,
  HardDrive,
  Cpu,
  Thermometer,
  Wifi,
  Power,
  Activity,
  Database,
  Info,
  Edit2,
  Trash2,
  AlertCircle,
  Shield,
  Clock,
  Download,
  Upload,
  Folder,
  Users
} from 'lucide-react';
import { getRelatedEntities } from '../utils/deviceFiltering';
import EditDeviceModal from './EditDeviceModal';
import { useCustomEntities } from '../hooks/useCustomEntities';
import { useEntityOverrides } from '../hooks/useEntityOverrides';

interface NASModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
  onEntityUpdate?: (entityId: string, updates: any) => void;
  rooms?: Array<{ id: string; name: string }>;
  isCustom?: boolean;
}

const NASModal: React.FC<NASModalProps> = ({ entityId, entity, onClose, onEntityUpdate, rooms = [], isCustom = false }) => {
  const { callService, entities } = useHomeAssistant();
  const { deleteCustomEntity } = useCustomEntities();
  const { setEntityOverride } = useEntityOverrides();
  const [isControlling, setIsControlling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'storage' | 'performance' | 'network'>('overview');
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  // Common NAS states
  const isOn = state === 'on' || state === 'online' || state === 'running';
  const isOff = state === 'off' || state === 'offline';
  const isSleeping = state === 'sleeping' || state === 'standby';
  const isUnknown = state === 'unknown' || state === 'unavailable';
  
  // Get device info
  const model = attributes.model || attributes.model_name || 'Unknown Model';
  const manufacturer = attributes.manufacturer || 'Unknown';
  const firmware = attributes.firmware || attributes.sw_version || 'Unknown';
  const serialNumber = attributes.serial_number || attributes.serial || null;
  
  // Find related entities
  const relatedEntities = getRelatedEntities(entityId, entities || {});
  
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
  const diskFreeSensor = findRelatedEntity(/_(disk_free|volume_free|storage_free)$/);
  const diskTotalSensor = findRelatedEntity(/_(disk_total|volume_total|storage_total)$/);
  
  const diskUsage = diskUsageSensor?.state ? parseFloat(diskUsageSensor.state) : 
                   attributes.disk_usage || attributes.volume_usage || 0;
  const diskUsed = diskUsedSensor?.state ? parseFloat(diskUsedSensor.state) : 
                  attributes.disk_used || attributes.volume_used || 0;
  const diskFree = diskFreeSensor?.state ? parseFloat(diskFreeSensor.state) : 
                  attributes.disk_free || attributes.volume_free || 0;
  const diskTotal = diskTotalSensor?.state ? parseFloat(diskTotalSensor.state) : 
                   attributes.disk_total || attributes.volume_total || 0;
  
  // System metrics
  const cpuSensor = findRelatedEntity(/_(cpu|processor)(_usage|_load)?$/);
  const memorySensor = findRelatedEntity(/_(memory|ram)(_usage)?$/);
  const memoryUsedSensor = findRelatedEntity(/_(memory|ram)_used$/);
  const memoryTotalSensor = findRelatedEntity(/_(memory|ram)_total$/);
  const temperatureSensor = findRelatedEntity(/_(temperature|temp)$/);
  const uptimeSensor = findRelatedEntity(/_uptime$/);
  
  const cpuUsage = cpuSensor?.state ? parseFloat(cpuSensor.state) : 
                  attributes.cpu_usage || attributes.cpu_load || 0;
  const memoryUsage = memorySensor?.state ? parseFloat(memorySensor.state) : 
                     attributes.memory_usage || attributes.ram_usage || 0;
  const memoryUsed = memoryUsedSensor?.state ? parseFloat(memoryUsedSensor.state) : 
                    attributes.memory_used || 0;
  const memoryTotal = memoryTotalSensor?.state ? parseFloat(memoryTotalSensor.state) : 
                     attributes.memory_total || 0;
  const temperature = temperatureSensor?.state ? parseFloat(temperatureSensor.state) : 
                     attributes.temperature || null;
  const uptime = uptimeSensor?.state || attributes.uptime || null;
  
  // Network metrics
  const downloadSensor = findRelatedEntity(/_(download|rx)(_speed|_rate)?$/);
  const uploadSensor = findRelatedEntity(/_(upload|tx)(_speed|_rate)?$/);
  const networkStatusSensor = findRelatedEntity(/_network(_status)?$/);
  
  const downloadSpeed = downloadSensor?.state || attributes.download_speed || null;
  const uploadSpeed = uploadSensor?.state || attributes.upload_speed || null;
  const networkStatus = networkStatusSensor?.state || attributes.network_status || 'connected';
  
  // Additional metrics
  const activeSessions = attributes.active_sessions || attributes.sessions || 0;
  const connectedDevices = attributes.connected_devices || attributes.clients || 0;
  const sharedFolders = attributes.shared_folders || attributes.shares || 0;
  const runningServices = attributes.running_services || attributes.services || 0;
  
  // Calculate disk usage percentage
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
    if (isOn) return 'text-green-400';
    if (isSleeping) return 'text-yellow-400';
    if (isOff) return 'text-gray-600';
    if (isUnknown) return 'text-red-600';
    return 'text-gray-400';
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
      return `${(gb / 1000).toFixed(2)} TB`;
    }
    return `${gb.toFixed(1)} GB`;
  };
  
  const formatMemory = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <div className={`${getStateColor()}`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{friendlyName}</h2>
              <p className="text-sm text-gray-400 mt-1">{getStateText()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['overview', 'storage', 'performance', 'network'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'text-white border-b-2 border-purple-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-180px)]">
          {/* Main Content */}
          <div className="lg:w-2/3 p-6 overflow-y-auto">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* System Status */}
                <div className="bg-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Status
                  </h3>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-400">Storage</span>
                      </div>
                      <p className={`text-xl font-bold ${getUsageColor(actualDiskUsage)}`}>
                        {actualDiskUsage.toFixed(0)}%
                      </p>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-400">CPU</span>
                      </div>
                      <p className={`text-xl font-bold ${getUsageColor(cpuUsage)}`}>
                        {cpuUsage.toFixed(0)}%
                      </p>
                    </div>
                    
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Memory</span>
                      </div>
                      <p className={`text-xl font-bold ${getUsageColor(memoryUsage)}`}>
                        {memoryUsage.toFixed(0)}%
                      </p>
                    </div>
                    
                    {temperature !== null && (
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Thermometer className="w-4 h-4 text-orange-400" />
                          <span className="text-sm text-gray-400">Temp</span>
                        </div>
                        <p className={`text-xl font-bold ${temperature > 70 ? 'text-red-400' : 'text-white'}`}>
                          {temperature}°C
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {uptime && (
                    <div className="mt-4 p-3 bg-gray-700/30 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Uptime</span>
                      </div>
                      <span className="text-white">{uptime}</span>
                    </div>
                  )}
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeSessions > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Sessions</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{activeSessions}</p>
                    </div>
                  )}
                  
                  {connectedDevices > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Wifi className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Devices</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{connectedDevices}</p>
                    </div>
                  )}
                  
                  {sharedFolders > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Folder className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Shares</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{sharedFolders}</p>
                    </div>
                  )}
                  
                  {runningServices > 0 && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Services</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{runningServices}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Storage Details
                  </h3>
                  
                  {/* Main Volume */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Main Volume</span>
                      <span className={`font-medium ${getUsageColor(actualDiskUsage)}`}>
                        {actualDiskUsage.toFixed(1)}% Used
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full ${getUsageBarColor(actualDiskUsage)} transition-all duration-500`}
                        style={{ width: `${Math.min(actualDiskUsage, 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Used:</span>
                        <span className="ml-2 text-white">{formatStorage(diskUsed)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Free:</span>
                        <span className="ml-2 text-white">{formatStorage(diskFree)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total:</span>
                        <span className="ml-2 text-white">{formatStorage(diskTotal)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Storage Health Warning */}
                  {actualDiskUsage >= 85 && (
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-200 font-medium">Low Storage Space</p>
                          <p className="text-xs text-red-300/70 mt-1">
                            Consider freeing up space or expanding storage capacity
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Performance
                  </h3>
                  
                  {/* CPU Usage */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        CPU Usage
                      </span>
                      <span className={`font-medium ${getUsageColor(cpuUsage)}`}>
                        {cpuUsage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getUsageBarColor(cpuUsage)} transition-all duration-500`}
                        style={{ width: `${Math.min(cpuUsage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Memory Usage */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Memory Usage
                      </span>
                      <span className={`font-medium ${getUsageColor(memoryUsage)}`}>
                        {memoryUsage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full ${getUsageBarColor(memoryUsage)} transition-all duration-500`}
                        style={{ width: `${Math.min(memoryUsage, 100)}%` }}
                      />
                    </div>
                    {memoryTotal > 0 && (
                      <p className="text-sm text-gray-400">
                        {formatMemory(memoryUsed)} / {formatMemory(memoryTotal)}
                      </p>
                    )}
                  </div>
                  
                  {/* Temperature */}
                  {temperature !== null && (
                    <div className="p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium flex items-center gap-2">
                          <Thermometer className="w-4 h-4" />
                          System Temperature
                        </span>
                        <span className={`text-xl font-bold ${temperature > 70 ? 'text-red-400' : temperature > 60 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {temperature}°C
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Network Tab */}
            {activeTab === 'network' && (
              <div className="space-y-6">
                <div className="bg-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Wifi className="w-5 h-5" />
                    Network Status
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {downloadSpeed && (
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-400">Download</span>
                        </div>
                        <p className="text-xl font-bold text-white">{downloadSpeed}</p>
                      </div>
                    )}
                    
                    {uploadSpeed && (
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Upload className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-400">Upload</span>
                        </div>
                        <p className="text-xl font-bold text-white">{uploadSpeed}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                    <p className="text-sm text-gray-400">Network Status</p>
                    <p className="text-white mt-1 capitalize">{networkStatus}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Device Info */}
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Device Info
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Manufacturer:</span>
                  <span className="ml-2 text-white">{manufacturer}</span>
                </div>
                <div>
                  <span className="text-gray-400">Model:</span>
                  <span className="ml-2 text-white">{model}</span>
                </div>
                <div>
                  <span className="text-gray-400">Firmware:</span>
                  <span className="ml-2 text-white">{firmware}</span>
                </div>
                {serialNumber && (
                  <div>
                    <span className="text-gray-400">Serial:</span>
                    <span className="ml-2 text-white">{serialNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 border-l border-gray-800 overflow-y-auto">
            {/* Quick Actions */}
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {isOff && (
                  <button
                    onClick={() => handleControl('turn_on')}
                    className="w-full p-3 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-2"
                    disabled={isControlling}
                  >
                    <Power className="w-4 h-4" />
                    <span>Wake Up</span>
                  </button>
                )}
                
                {(isOn || isSleeping) && (
                  <button
                    onClick={() => handleControl('turn_off')}
                    className="w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center gap-2"
                    disabled={isControlling}
                  >
                    <Power className="w-4 h-4" />
                    <span>Shutdown</span>
                  </button>
                )}
                
                {isOn && (
                  <button
                    onClick={() => handleControl('sleep')}
                    className="w-full p-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors flex items-center justify-center gap-2"
                    disabled={isControlling}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Sleep</span>
                  </button>
                )}
              </div>
              
              {/* Edit/Delete Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
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
                  className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">{isCustom ? 'Delete' : 'Hide'}</span>
                </button>
              </div>
            </div>
            
            {/* Related Entities */}
            {relatedEntities.length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-white mb-4">Related Sensors</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {relatedEntities.map(([relatedId, relatedEntity]: [string, any]) => {
                    const relatedName = relatedEntity.attributes?.friendly_name || relatedId;
                    const relatedState = relatedEntity.state;
                    const unit = relatedEntity.attributes?.unit_of_measurement || '';
                    
                    return (
                      <div key={relatedId} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300 truncate flex-1 mr-2">{relatedName}</span>
                        <span className="text-sm text-gray-500 flex-shrink-0">
                          {relatedState} {unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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

export default NASModal;