import { useState } from 'react';
import { X, MoveRight, Home } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface BulkMoveModalProps {
  selectedDevices: string[];
  entities: Record<string, any>;
  rooms: Array<{ id: string; name: string }>;
  onClose: () => void;
  onMove: (entityIds: string[], roomId: string) => void;
  getEffectiveName: (entityId: string, defaultName?: string) => string;
}

export function BulkMoveModal({
  selectedDevices,
  entities,
  rooms,
  onClose,
  onMove,
  getEffectiveName,
}: BulkMoveModalProps) {
  const [targetRoom, setTargetRoom] = useState('');
  const { showToast } = useToast();

  const handleMove = () => {
    if (!targetRoom) {
      showToast('Please select a target room', 'warning');
      return;
    }

    onMove(selectedDevices, targetRoom);
    showToast(
      `Successfully moved ${selectedDevices.length} device${selectedDevices.length > 1 ? 's' : ''} to ${
        rooms.find(r => r.id === targetRoom)?.name || targetRoom
      }`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Move Multiple Devices</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-400 mb-4">
            Moving {selectedDevices.length} device{selectedDevices.length > 1 ? 's' : ''}
          </p>

          {/* Selected Devices List */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Selected Devices:</h3>
            <div className="bg-gray-800 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {selectedDevices.map(entityId => {
                  const entity = entities[entityId];
                  const name = getEffectiveName(entityId, entity?.attributes?.friendly_name);
                  return (
                    <span
                      key={entityId}
                      className="bg-gray-700 text-gray-200 px-2 py-1 rounded text-sm"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Target Room Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Move to Room:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setTargetRoom(room.id)}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${
                      targetRoom === room.id
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                    }
                  `}
                >
                  <Home className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">{room.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={!targetRoom}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2
              ${
                targetRoom
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <MoveRight className="w-4 h-4" />
            Move Devices
          </button>
        </div>
      </div>
    </div>
  );
}