import React, { useState } from 'react';
import { 
  X, 
  Lightbulb, 
  Thermometer, 
  Shield, 
  Tv, 
  Power, 
  Activity, 
  Camera,
  Lock,
  Blinds,
  Fan,
  Wifi,
  Zap,
  Cloud,
  Cpu,
  Music,
  Video,
  Smartphone,
  Speaker,
  Radio
} from 'lucide-react';

interface AddCategoryModalProps {
  onClose: () => void;
  onAdd: (name: string, icon: string, domains: string[]) => void;
  existingCategories: Array<{ id: string; name: string }>;
}

const categoryIcons = [
  { id: 'lightbulb', icon: <Lightbulb className="w-6 h-6" />, name: 'Lighting' },
  { id: 'thermometer', icon: <Thermometer className="w-6 h-6" />, name: 'Climate' },
  { id: 'shield', icon: <Shield className="w-6 h-6" />, name: 'Security' },
  { id: 'tv', icon: <Tv className="w-6 h-6" />, name: 'Entertainment' },
  { id: 'power', icon: <Power className="w-6 h-6" />, name: 'Power' },
  { id: 'activity', icon: <Activity className="w-6 h-6" />, name: 'Sensors' },
  { id: 'camera', icon: <Camera className="w-6 h-6" />, name: 'Cameras' },
  { id: 'lock', icon: <Lock className="w-6 h-6" />, name: 'Locks' },
  { id: 'blinds', icon: <Blinds className="w-6 h-6" />, name: 'Covers' },
  { id: 'fan', icon: <Fan className="w-6 h-6" />, name: 'Fans' },
  { id: 'wifi', icon: <Wifi className="w-6 h-6" />, name: 'Network' },
  { id: 'zap', icon: <Zap className="w-6 h-6" />, name: 'Energy' },
  { id: 'cloud', icon: <Cloud className="w-6 h-6" />, name: 'Weather' },
  { id: 'cpu', icon: <Cpu className="w-6 h-6" />, name: 'Automation' },
  { id: 'music', icon: <Music className="w-6 h-6" />, name: 'Audio' },
  { id: 'video', icon: <Video className="w-6 h-6" />, name: 'Video' },
  { id: 'smartphone', icon: <Smartphone className="w-6 h-6" />, name: 'Mobile' },
  { id: 'speaker', icon: <Speaker className="w-6 h-6" />, name: 'Speakers' },
  { id: 'radio', icon: <Radio className="w-6 h-6" />, name: 'Radio' },
];

const commonDomains = [
  { id: 'light', name: 'Lights', checked: false },
  { id: 'switch', name: 'Switches', checked: false },
  { id: 'sensor', name: 'Sensors', checked: false },
  { id: 'binary_sensor', name: 'Binary Sensors', checked: false },
  { id: 'climate', name: 'Climate', checked: false },
  { id: 'media_player', name: 'Media Players', checked: false },
  { id: 'camera', name: 'Cameras', checked: false },
  { id: 'lock', name: 'Locks', checked: false },
  { id: 'cover', name: 'Covers', checked: false },
  { id: 'fan', name: 'Fans', checked: false },
  { id: 'vacuum', name: 'Vacuums', checked: false },
  { id: 'water_heater', name: 'Water Heaters', checked: false },
  { id: 'device_tracker', name: 'Device Trackers', checked: false },
  { id: 'person', name: 'Persons', checked: false },
  { id: 'alarm_control_panel', name: 'Alarms', checked: false },
  { id: 'automation', name: 'Automations', checked: false },
  { id: 'scene', name: 'Scenes', checked: false },
  { id: 'script', name: 'Scripts', checked: false },
];

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onAdd, existingCategories }) => {
  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('lightbulb');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [customDomain, setCustomDomain] = useState('');
  const [error, setError] = useState('');

  const handleDomainToggle = (domainId: string) => {
    setSelectedDomains(prev => 
      prev.includes(domainId) 
        ? prev.filter(d => d !== domainId)
        : [...prev, domainId]
    );
  };

  const handleAddCustomDomain = () => {
    if (customDomain.trim() && !selectedDomains.includes(customDomain.trim())) {
      setSelectedDomains(prev => [...prev, customDomain.trim()]);
      setCustomDomain('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    if (selectedDomains.length === 0) {
      setError('Select at least one domain');
      return;
    }

    // Check if category already exists
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '_');
    if (existingCategories.some(cat => cat.id === categoryId)) {
      setError('A category with this name already exists');
      return;
    }

    onAdd(categoryName.trim(), selectedIcon, selectedDomains);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Add New Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category Name
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Smart Appliances"
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
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {categoryIcons.map((icon) => (
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

          {/* Domain Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Domains
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {commonDomains.map((domain) => (
                <label
                  key={domain.id}
                  className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedDomains.includes(domain.id)}
                    onChange={() => handleDomainToggle(domain.id)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300">{domain.name}</span>
                </label>
              ))}
            </div>

            {/* Custom Domain Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDomain();
                  }
                }}
                placeholder="Add custom domain (e.g., water_heater)"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors text-sm"
              />
              <button
                type="button"
                onClick={handleAddCustomDomain}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preview */}
          {categoryName && selectedDomains.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Preview:</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-purple-400">
                  {categoryIcons.find(i => i.id === selectedIcon)?.icon}
                </div>
                <span className="text-white font-medium">{categoryName}</span>
              </div>
              <p className="text-xs text-gray-500">
                Domains: {selectedDomains.join(', ')}
              </p>
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
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;