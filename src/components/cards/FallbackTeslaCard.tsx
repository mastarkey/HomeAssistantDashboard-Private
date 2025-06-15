import React from 'react';
import { Car, Zap } from 'lucide-react';

interface FallbackTeslaCardProps {
  entityId: string;
}

const FallbackTeslaCard: React.FC<FallbackTeslaCardProps> = ({ entityId }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-4 hover:bg-gray-800 transition-all duration-150 group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-white font-medium">Tesla Wall Connector</span>
        <div className="text-green-400">
          <Car className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-sm text-gray-300">Entity: {entityId}</span>
      </div>
      
      <div className="mt-4">
        <p className="text-xs text-gray-500">Entity registered but data unavailable</p>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider">EV CHARGER</span>
      </div>
    </div>
  );
};

export default FallbackTeslaCard;