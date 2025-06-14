import React, { useState, useEffect } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { X, Maximize2, Volume2, VolumeX, Info, Shield, Activity, RefreshCw, Clock } from 'lucide-react';
import { getRelatedEntities } from '../utils/deviceFiltering';
import { getDeviceForEntity, getEntitiesForDevice } from '../utils/deviceRegistry';
import CameraImage from './CameraImage';

interface CameraModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
  initialRefreshKey?: number;
}

const CameraModal: React.FC<CameraModalProps> = ({ entityId, entity, onClose, initialRefreshKey = 0 }) => {
  const { callService, entities, config, devices } = useHomeAssistant();
  const [isMuted, setIsMuted] = useState(true);
  const [refreshKey, setRefreshKey] = useState(initialRefreshKey);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  const entityPicture = entity.attributes?.entity_picture;
  
  // Get camera manufacturer and model info from various possible sources
  let brand = 'Unknown';
  let model = 'Unknown Model';
  let firmwareVersion = 'Unknown';
  let macAddress = 'Unknown';
  let serialNumber = 'Unknown';
  
  // First try device registry for most accurate info
  const device = devices && entities ? getDeviceForEntity(entityId, entities, devices) : null;
  if (device) {
    brand = device.manufacturer || brand;
    model = device.model || model;
    firmwareVersion = device.sw_version || firmwareVersion;
    serialNumber = device.serial_number || serialNumber;
    // Get MAC from device connections
    const macConnection = device.connections.find(([type]) => type === 'mac');
    if (macConnection) {
      macAddress = macConnection[1];
    }
  }
  
  // Try to extract from attribution for UniFi cameras if not found in device registry
  if (attributes.attribution && (brand === 'Unknown' || model === 'Unknown Model')) {
    const attribution = attributes.attribution;
    // Extract model from "G4 DoorBell Pro Package" format
    const modelMatch = attribution.match(/^([^(]+)/);
    if (modelMatch && model === 'Unknown Model') {
      model = modelMatch[1].trim();
    }
    // Extract brand from "by Ubiquiti" format
    const brandMatch = attribution.match(/by\s+(.+)$/);
    if (brandMatch && brand === 'Unknown') {
      brand = brandMatch[1].trim();
    }
  }
  
  // Override with direct attributes if available
  brand = attributes.brand || attributes.manufacturer || brand;
  model = attributes.model_name || attributes.model || model;
  firmwareVersion = attributes.firmware_version || attributes.sw_version || firmwareVersion;
  macAddress = attributes.mac_address || attributes.mac || macAddress;
  
  
  // Get all related entities (sensors, switches, etc.)
  let relatedEntities: [string, any][] = [];
  
  // If we have device registry, use it for more accurate related entity detection
  if (device && entities) {
    relatedEntities = getEntitiesForDevice(device.id, entities)
      .filter(([id]) => id !== entityId); // Filter out the camera itself
  } else {
    // Fallback to pattern matching
    relatedEntities = getRelatedEntities(entityId, entities || {});
  }
  
  // Separate sensors from other entities
  const sensors = relatedEntities.filter(([id]) => 
    id.includes('sensor') || id.includes('binary_sensor') || id.includes('_detected')
  );
  
  const controls = relatedEntities.filter(([id]) => 
    id.includes('switch') || id.includes('select') || id.includes('number')
  );
  
  // Format last updated time
  const lastUpdated = entity.last_updated || entity.last_changed;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(Date.now());
    // Reset refresh animation after a short delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Handle auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, 10000); // Refresh every 10 seconds
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);
  
  const getSensorIcon = (_sensorId: string, sensorName: string) => {
    const name = sensorName.toLowerCase();
    if (name.includes('motion')) return '🚶';
    if (name.includes('person')) return '👤';
    if (name.includes('animal')) return '🐾';
    if (name.includes('vehicle') || name.includes('car')) return '🚗';
    if (name.includes('package')) return '📦';
    if (name.includes('sound') || name.includes('speaking')) return '🔊';
    if (name.includes('baby')) return '👶';
    if (name.includes('smoke')) return '🚨';
    if (name.includes('glass')) return '🔨';
    if (name.includes('doorbell')) return '🔔';
    return '📍';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-semibold text-white">{friendlyName}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-400">
                {state === 'recording' ? '🔴 Recording' : '● Live'}
              </p>
              {autoRefresh && (
                <p className="text-sm text-green-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Auto-refresh ON
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-100px)]">
          {/* Camera Feed */}
          <div className="lg:w-2/3 p-6">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <CameraImage
                entityId={entityId}
                entityPicture={entityPicture}
                hassUrl={config?.hassUrl || ''}
                alt={friendlyName}
                className="w-full h-full object-contain"
                refreshKey={refreshKey}
              />
              
              {/* Overlay Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </button>
                  <button
                    onClick={handleRefresh}
                    className={`p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh camera feed"
                  >
                    <RefreshCw className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`p-2 backdrop-blur rounded-lg transition-colors ${
                      autoRefresh ? 'bg-green-600/50 hover:bg-green-600/70' : 'bg-black/50 hover:bg-black/70'
                    }`}
                    title={autoRefresh ? "Auto-refresh is ON (10s)" : "Enable auto-refresh"}
                  >
                    <Clock className="w-5 h-5 text-white" />
                  </button>
                </div>
                <button className="p-2 bg-black/50 backdrop-blur rounded-lg hover:bg-black/70 transition-colors">
                  <Maximize2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            {/* Device Info */}
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Device Info
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Model:</span>
                  <span className="ml-2 text-white">{brand} {model}</span>
                </div>
                <div>
                  <span className="text-gray-400">Firmware:</span>
                  <span className="ml-2 text-white">{firmwareVersion}</span>
                </div>
                <div>
                  <span className="text-gray-400">MAC:</span>
                  <span className="ml-2 text-white font-mono text-xs">{macAddress}</span>
                </div>
                {serialNumber !== 'Unknown' && (
                  <div>
                    <span className="text-gray-400">Serial:</span>
                    <span className="ml-2 text-white font-mono text-xs">{serialNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400">Last Updated:</span>
                  <span className="ml-2 text-white">{formatDate(lastUpdated)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3 border-l border-gray-800 overflow-y-auto">
            {/* Controls */}
            {controls.length > 0 && (
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-lg font-medium text-white mb-4">Controls</h3>
                <div className="space-y-3">
                  {controls.map(([controlId, control]: [string, any]) => {
                    const controlName = control.attributes?.friendly_name || controlId;
                    const isOn = control.state === 'on';
                    
                    return (
                      <div key={controlId} className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{controlName}</span>
                        <button
                          onClick={() => {
                            const domain = controlId.split('.')[0];
                            callService(domain, isOn ? 'turn_off' : 'turn_on', {
                              entity_id: controlId
                            });
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isOn ? 'bg-purple-600' : 'bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isOn ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sensors */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sensors
              </h3>
              <div className="space-y-2">
                {sensors.length > 0 ? (
                  sensors.map(([sensorId, sensor]: [string, any]) => {
                    const sensorName = sensor.attributes?.friendly_name || sensorId;
                    const sensorState = sensor.state;
                    const icon = getSensorIcon(sensorId, sensorName);
                    
                    return (
                      <div key={sensorId} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icon}</span>
                          <span className="text-sm text-gray-300">{sensorName}</span>
                        </div>
                        <span className={`text-sm font-medium ${
                          sensorState === 'on' || sensorState === 'detected' 
                            ? 'text-yellow-400' 
                            : sensorState === 'unavailable' 
                            ? 'text-gray-600'
                            : 'text-gray-400'
                        }`}>
                          {sensorState === 'on' ? 'Detected' : 
                           sensorState === 'off' ? 'Clear' : 
                           sensorState}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No sensors detected</p>
                )}
              </div>
            </div>

            {/* Logbook */}
            <div className="p-6 border-t border-gray-800">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500">Activity log would appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;