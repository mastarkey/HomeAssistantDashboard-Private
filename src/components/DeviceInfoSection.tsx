import React, { useState } from 'react';
import { Info, Tag, MapPin, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import type { Device } from '../utils/deviceRegistry';

interface DeviceInfoSectionProps {
  entityId: string;
  entity: any;
  device?: Device | null;
  areas?: Array<{ area_id: string; name: string }>;
  onCategoryAssign?: (categoryId: string) => void;
  categories?: Array<{ id: string; name: string }>;
}

export const DeviceInfoSection: React.FC<DeviceInfoSectionProps> = ({
  entityId,
  entity,
  device,
  areas,
  onCategoryAssign,
  categories = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const attributes = entity.attributes || {};
  const domain = entityId.split('.')[0];
  
  // Find area name
  const areaName = areas?.find(a => a.area_id === device?.area_id)?.name || 'Not assigned';
  
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (onCategoryAssign) {
      onCategoryAssign(categoryId);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur rounded-xl p-4 mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Device Information</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Entity Information */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Details</h4>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Entity ID:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-300 font-mono text-xs">{entityId}</span>
                <button
                  onClick={() => copyToClipboard(entityId, 'entityId')}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {copiedField === 'entityId' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <div>
                <span className="text-gray-500">Domain:</span>
              </div>
              <div>
                <span className="text-gray-300">{domain}</span>
              </div>

              <div>
                <span className="text-gray-500">State:</span>
              </div>
              <div>
                <span className="text-gray-300">{entity.state}</span>
              </div>

              {attributes.friendly_name && (
                <>
                  <div>
                    <span className="text-gray-500">Name:</span>
                  </div>
                  <div>
                    <span className="text-gray-300">{attributes.friendly_name}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Device Information */}
          {device && (
            <div className="space-y-2 pt-3 border-t border-gray-800">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Device Details</h4>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Device ID:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 font-mono text-xs truncate">{device.id}</span>
                  <button
                    onClick={() => copyToClipboard(device.id, 'deviceId')}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {copiedField === 'deviceId' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {device.name && (
                  <>
                    <div>
                      <span className="text-gray-500">Device Name:</span>
                    </div>
                    <div>
                      <span className="text-gray-300">{device.name}</span>
                    </div>
                  </>
                )}

                {device.manufacturer && (
                  <>
                    <div>
                      <span className="text-gray-500">Manufacturer:</span>
                    </div>
                    <div>
                      <span className="text-gray-300">{device.manufacturer}</span>
                    </div>
                  </>
                )}

                {device.model && (
                  <>
                    <div>
                      <span className="text-gray-500">Model:</span>
                    </div>
                    <div>
                      <span className="text-gray-300">{device.model}</span>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-gray-500">Area:</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300">{areaName}</span>
                </div>

                {device.sw_version && (
                  <>
                    <div>
                      <span className="text-gray-500">Firmware:</span>
                    </div>
                    <div>
                      <span className="text-gray-300">{device.sw_version}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Device Identifiers */}
              {device.identifiers && device.identifiers.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-1">Identifiers:</p>
                  <div className="space-y-1">
                    {device.identifiers.map(([domain, id], idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{domain}:</span>
                        <span className="text-xs text-gray-400 font-mono">{id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Attributes */}
          {Object.keys(attributes).length > 1 && (
            <div className="space-y-2 pt-3 border-t border-gray-800">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Attributes</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.entries(attributes)
                  .filter(([key]) => key !== 'friendly_name')
                  .map(([key, value]) => (
                    <div key={key} className="flex items-start gap-2 text-xs">
                      <span className="text-gray-500 min-w-[100px]">{key}:</span>
                      <span className="text-gray-400 break-all">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Category Assignment */}
          {categories.length > 0 && onCategoryAssign && (
            <div className="space-y-2 pt-3 border-t border-gray-800">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-3 h-3" />
                Assign to Category
              </h4>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-gray-800 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};