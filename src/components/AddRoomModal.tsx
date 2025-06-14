import React, { useState } from 'react';
import { 
  X, 
  Home, 
  Bed, 
  Bath, 
  UtensilsCrossed, 
  Sofa, 
  Car, 
  DoorOpen,
  TreePine,
  Briefcase,
  Gamepad2,
  Baby,
  Dumbbell,
  BookOpen,
  Wrench,
  Sun
} from 'lucide-react';

interface AddRoomModalProps {
  onClose: () => void;
  onAdd: (name: string, icon?: string) => void;
  existingRooms: Array<{ id: string; name: string }>;
}

const roomIcons = [
  { id: 'home', icon: <Home className="w-6 h-6" />, name: 'Home' },
  { id: 'bed', icon: <Bed className="w-6 h-6" />, name: 'Bedroom' },
  { id: 'bath', icon: <Bath className="w-6 h-6" />, name: 'Bathroom' },
  { id: 'utensils', icon: <UtensilsCrossed className="w-6 h-6" />, name: 'Kitchen' },
  { id: 'sofa', icon: <Sofa className="w-6 h-6" />, name: 'Living Room' },
  { id: 'car', icon: <Car className="w-6 h-6" />, name: 'Garage' },
  { id: 'door', icon: <DoorOpen className="w-6 h-6" />, name: 'Entry' },
  { id: 'tree', icon: <TreePine className="w-6 h-6" />, name: 'Outdoor' },
  { id: 'briefcase', icon: <Briefcase className="w-6 h-6" />, name: 'Office' },
  { id: 'gamepad', icon: <Gamepad2 className="w-6 h-6" />, name: 'Game Room' },
  { id: 'baby', icon: <Baby className="w-6 h-6" />, name: 'Nursery' },
  { id: 'dumbbell', icon: <Dumbbell className="w-6 h-6" />, name: 'Gym' },
  { id: 'book', icon: <BookOpen className="w-6 h-6" />, name: 'Library' },
  { id: 'wrench', icon: <Wrench className="w-6 h-6" />, name: 'Utility' },
  { id: 'sun', icon: <Sun className="w-6 h-6" />, name: 'Sunroom' },
];

const AddRoomModal: React.FC<AddRoomModalProps> = ({ onClose, onAdd, existingRooms }) => {
  const [roomName, setRoomName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('home');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    // Check if room already exists
    const roomId = roomName.toLowerCase().replace(/\s+/g, '_');
    if (existingRooms.some(room => room.id === roomId)) {
      setError('A room with this name already exists');
      return;
    }

    onAdd(roomName.trim(), selectedIcon);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Guest Bedroom"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Choose an Icon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {roomIcons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setSelectedIcon(icon.id)}
                  className={`p-3 rounded-lg transition-all ${
                    selectedIcon === icon.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={icon.name}
                >
                  {icon.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {roomName && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Preview:</p>
              <div className="flex items-center gap-3">
                <div className="text-purple-400">
                  {roomIcons.find(i => i.id === selectedIcon)?.icon}
                </div>
                <span className="text-white font-medium">{roomName}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomModal;