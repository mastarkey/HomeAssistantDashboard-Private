import React, { useState } from 'react';
import { AlertCircle, Plus, X, Zap, Home } from 'lucide-react';
import type { DeviceGroup } from '../utils/deviceGrouping';

interface NewDeviceNotificationProps {
  newDevices: DeviceGroup[];
  onAddDevice: () => void;
  onDismiss: () => void;
}

const NewDeviceNotification: React.FC<NewDeviceNotificationProps> = ({
  newDevices,
  onAddDevice,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (newDevices.length === 0) return null;

  const deviceCount = newDevices.length;
  const entityCount = newDevices.reduce((sum, device) => sum + device.entities.length, 0);

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-40 animate-slide-up">
      <div className="bg-purple-900/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-purple-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg animate-pulse">
              <AlertCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">
                {deviceCount} New {deviceCount === 1 ? 'Device' : 'Devices'} Found!
              </h3>
              <p className="text-sm text-purple-200 mt-0.5">
                {entityCount} {entityCount === 1 ? 'entity' : 'entities'} discovered
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-purple-800/50 rounded-lg transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4 text-purple-300" />
          </button>
        </div>

        {/* Device List Preview */}
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1"
          >
            {isExpanded ? 'Hide' : 'Show'} devices
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
              {newDevices.map(device => (
                <div
                  key={device.deviceId}
                  className="bg-purple-800/30 rounded-lg p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-white font-medium">{device.deviceName}</span>
                    </div>
                    <span className="text-xs text-purple-300">
                      {device.entities.length} {device.entities.length === 1 ? 'entity' : 'entities'}
                    </span>
                  </div>
                  {device.manufacturer && (
                    <p className="text-xs text-purple-300 ml-6 mt-1">
                      {device.manufacturer} {device.model || ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onAddDevice}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg 
                     flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add to Dashboard
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-purple-800/50 hover:bg-purple-800 text-purple-200 
                     rounded-lg transition-colors"
          >
            Later
          </button>
        </div>

        {/* Auto-discovery note */}
        <p className="text-xs text-purple-300 mt-3 text-center">
          <Home className="w-3 h-3 inline mr-1" />
          Devices are automatically discovered from Home Assistant
        </p>
      </div>
    </div>
  );
};

export default NewDeviceNotification;