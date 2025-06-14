import React, { useState } from 'react';
import { X, Lightbulb, Power, Thermometer, Lock, Camera, Speaker, Tv, Fan, DoorOpen, Droplets, Wind, Shield, Activity } from 'lucide-react';

interface AddDeviceModalProps {
  onClose: () => void;
  onAdd: (device: {
    name: string;
    type: string;
    room: string;
    state: string;
    attributes: Record<string, any>;
  }) => void;
  rooms: Array<{ id: string; name: string }>;
}

const deviceTypes = [
  { id: 'light', name: 'Light', icon: <Lightbulb className="w-6 h-6" />, defaultState: 'off' },
  { id: 'switch', name: 'Switch', icon: <Power className="w-6 h-6" />, defaultState: 'off' },
  { id: 'climate', name: 'Thermostat', icon: <Thermometer className="w-6 h-6" />, defaultState: 'off' },
  { id: 'lock', name: 'Lock', icon: <Lock className="w-6 h-6" />, defaultState: 'locked' },
  { id: 'camera', name: 'Camera', icon: <Camera className="w-6 h-6" />, defaultState: 'idle' },
  { id: 'media_player', name: 'Media Player', icon: <Speaker className="w-6 h-6" />, defaultState: 'off' },
  { id: 'tv', name: 'TV', icon: <Tv className="w-6 h-6" />, defaultState: 'off' },
  { id: 'fan', name: 'Fan', icon: <Fan className="w-6 h-6" />, defaultState: 'off' },
  { id: 'cover', name: 'Blinds/Curtains', icon: <DoorOpen className="w-6 h-6" />, defaultState: 'closed' },
  { id: 'sensor', name: 'Sensor', icon: <Activity className="w-6 h-6" />, defaultState: '0' },
  { id: 'binary_sensor', name: 'Motion Sensor', icon: <Shield className="w-6 h-6" />, defaultState: 'off' },
  { id: 'humidity', name: 'Humidity Sensor', icon: <Droplets className="w-6 h-6" />, defaultState: '50' },
  { id: 'temperature', name: 'Temperature Sensor', icon: <Wind className="w-6 h-6" />, defaultState: '20' },
];

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ onClose, onAdd, rooms }) => {
  const [deviceName, setDeviceName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Type-specific attributes
  const [brightness, setBrightness] = useState(100);
  const [temperature, setTemperature] = useState(20);
  const [targetTemp, setTargetTemp] = useState(22);
  const [volume, setVolume] = useState(50);
  const [position, setPosition] = useState(0);
  const [sensorValue, setSensorValue] = useState('0');
  const [sensorUnit, setSensorUnit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceName || !selectedType || !selectedRoom) {
      return;
    }

    const selectedDevice = deviceTypes.find(d => d.id === selectedType);
    if (!selectedDevice) return;

    let attributes: Record<string, any> = {
      friendly_name: deviceName,
    };

    // Add type-specific attributes
    switch (selectedType) {
      case 'light':
        attributes.brightness = brightness;
        attributes.supported_features = 1; // brightness support
        break;
      case 'climate':
        attributes.temperature = temperature;
        attributes.target_temp_high = targetTemp;
        attributes.target_temp_low = targetTemp - 2;
        attributes.current_temperature = temperature;
        attributes.hvac_modes = ['off', 'heat', 'cool', 'auto'];
        attributes.supported_features = 1 | 2; // target temp support
        break;
      case 'media_player':
        attributes.volume_level = volume / 100;
        attributes.supported_features = 4 | 16 | 32 | 64 | 128; // volume, prev, next, turn on/off
        if (selectedDevice.name === 'TV') {
          attributes.device_class = 'tv';
        }
        break;
      case 'cover':
        attributes.current_position = position;
        attributes.supported_features = 3; // open/close/position
        break;
      case 'sensor':
      case 'temperature':
      case 'humidity':
        attributes.unit_of_measurement = sensorUnit || 
          (selectedType === 'temperature' ? '°C' : 
           selectedType === 'humidity' ? '%' : '');
        break;
    }

    onAdd({
      name: deviceName,
      type: selectedType === 'tv' ? 'media_player' : selectedType,
      room: selectedRoom,
      state: selectedType === 'sensor' || selectedType === 'temperature' || selectedType === 'humidity' 
        ? sensorValue 
        : selectedDevice.defaultState,
      attributes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-semibold text-white">Add New Device</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Device Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Device Name
            </label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="e.g., Living Room Light"
              required
            />
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Device Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {deviceTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                    selectedType === type.id
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {type.icon}
                  <span className="text-xs">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room
            </label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              required
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type-specific options */}
          {selectedType && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg">
                  {/* Light options */}
                  {selectedType === 'light' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default Brightness
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-400">{brightness}%</span>
                    </div>
                  )}

                  {/* Climate options */}
                  {selectedType === 'climate' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Current Temperature
                        </label>
                        <input
                          type="number"
                          value={temperature}
                          onChange={(e) => setTemperature(Number(e.target.value))}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          min="0"
                          max="40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Target Temperature
                        </label>
                        <input
                          type="number"
                          value={targetTemp}
                          onChange={(e) => setTargetTemp(Number(e.target.value))}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          min="0"
                          max="40"
                        />
                      </div>
                    </>
                  )}

                  {/* Media Player options */}
                  {selectedType === 'media_player' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default Volume
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-400">{volume}%</span>
                    </div>
                  )}

                  {/* Cover options */}
                  {selectedType === 'cover' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Default Position
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={position}
                        onChange={(e) => setPosition(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-400">{position}% open</span>
                    </div>
                  )}

                  {/* Sensor options */}
                  {(selectedType === 'sensor' || selectedType === 'temperature' || selectedType === 'humidity') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Initial Value
                        </label>
                        <input
                          type="text"
                          value={sensorValue}
                          onChange={(e) => setSensorValue(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                          placeholder="0"
                        />
                      </div>
                      {selectedType === 'sensor' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Unit of Measurement
                          </label>
                          <input
                            type="text"
                            value={sensorUnit}
                            onChange={(e) => setSensorUnit(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            placeholder="e.g., kWh, lux, dB"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!deviceName || !selectedType || !selectedRoom}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeviceModal;