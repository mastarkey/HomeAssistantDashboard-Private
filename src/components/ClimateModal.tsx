import React, { useState, useEffect, useMemo } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Power, 
  Minus, 
  Plus,
  Flame,
  Snowflake,
  Wind,
  Sun,
  Fan
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ClimateModalProps {
  entityId: string;
  entity: any;
  onClose: () => void;
}

interface HistoryData {
  state: string;
  attributes: any;
  last_changed: string;
}

const ClimateModal: React.FC<ClimateModalProps> = ({ entityId, entity, onClose }) => {
  const { callService, connection } = useHomeAssistant();
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const friendlyName = entity.attributes?.friendly_name || entityId;
  const state = entity.state;
  const attributes = entity.attributes || {};
  
  const currentTemp = attributes.current_temperature;
  const targetTemp = attributes.temperature;
  const humidity = attributes.current_humidity;
  const hvacMode = state;
  const fanMode = attributes.fan_mode;
  const fanModes = attributes.fan_modes || [];
  const hvacModes = attributes.hvac_modes || ['off', 'heat', 'cool', 'auto'];

  // Fetch history data
  useEffect(() => {
    const fetchHistory = async () => {
      if (!connection) return;
      
      try {
        setLoadingHistory(true);
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        
        const historyData = await connection.sendMessagePromise({
          type: 'history/history_during_period',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          entity_ids: [entityId],
          minimal_response: false,
          no_attributes: false,
        });
        
        if (historyData && Array.isArray(historyData)) {
          // History data is returned as { entityId: historyArray }
          const entityHistory = historyData.find((item: any) => item && typeof item === 'object' && entityId in item);
          if (entityHistory && entityHistory[entityId]) {
            setHistory(entityHistory[entityId]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    
    fetchHistory();
  }, [connection, entityId]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const temps = history
      .filter(h => h.attributes?.current_temperature !== undefined)
      .map(h => ({
        time: new Date(h.last_changed),
        temp: h.attributes.current_temperature,
        target: h.attributes.temperature
      }));

    const labels = temps.map(t => {
      const hours = t.time.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:00 ${ampm}`;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Current Temperature',
          data: temps.map(t => t.temp),
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Target Temperature',
          data: temps.map(t => t.target),
          borderColor: 'rgb(251, 191, 36)',
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          borderDash: [5, 5],
          tension: 0.4,
          fill: false,
        }
      ]
    };
  }, [history]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgb(156, 163, 175)',
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function(tickValue: string | number) {
            return `${tickValue}°`;
          }
        }
      }
    }
  };

  const adjustTemperature = async (increment: number) => {
    if (!targetTemp || isAdjusting) return;
    
    setIsAdjusting(true);
    try {
      const newTemp = targetTemp + increment;
      await callService('climate', 'set_temperature', {
        entity_id: entityId,
        temperature: newTemp
      });
    } catch (error) {
      console.error('Failed to adjust temperature:', error);
    } finally {
      setTimeout(() => setIsAdjusting(false), 300);
    }
  };

  const setHvacMode = async (mode: string) => {
    try {
      await callService('climate', 'set_hvac_mode', {
        entity_id: entityId,
        hvac_mode: mode
      });
    } catch (error) {
      console.error('Failed to set HVAC mode:', error);
    }
  };

  const setFanMode = async (mode: string) => {
    try {
      await callService('climate', 'set_fan_mode', {
        entity_id: entityId,
        fan_mode: mode
      });
    } catch (error) {
      console.error('Failed to set fan mode:', error);
    }
  };


  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'heat': return <Flame className="w-5 h-5" />;
      case 'cool': return <Snowflake className="w-5 h-5" />;
      case 'heat_cool': 
      case 'auto': return <Sun className="w-5 h-5" />;
      case 'fan_only': return <Wind className="w-5 h-5" />;
      case 'off': return <Power className="w-5 h-5" />;
      default: return <Thermometer className="w-5 h-5" />;
    }
  };

  // Get recent events from history
  const recentEvents = useMemo(() => {
    return history
      .filter((h, i) => {
        if (i === 0) return true;
        const prev = history[i - 1];
        return h.state !== prev.state || 
               h.attributes?.temperature !== prev.attributes?.temperature;
      })
      .slice(-5)
      .reverse();
  }, [history]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white mb-2"
              >
                ← {friendlyName}
              </button>
              <h2 className="text-2xl font-bold text-white">{friendlyName}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Main Controls */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temperature Control */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-4xl font-bold text-white">
                      {currentTemp !== undefined ? `${Math.round(currentTemp)}°` : '--°'}
                    </div>
                    <div className="text-sm text-gray-400">Current Temperature</div>
                  </div>
                  {humidity !== undefined && (
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Droplets className="w-5 h-5" />
                        <span className="text-xl">{humidity}%</span>
                      </div>
                      <div className="text-sm text-gray-500">Humidity</div>
                    </div>
                  )}
                </div>

                {hvacMode !== 'off' && (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => adjustTemperature(-1)}
                      disabled={isAdjusting}
                      className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-6 h-6 text-white" />
                    </button>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-white">
                        {targetTemp !== undefined ? `${Math.round(targetTemp)}°` : '--°'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">Target</div>
                    </div>
                    <button
                      onClick={() => adjustTemperature(1)}
                      disabled={isAdjusting}
                      className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-6 h-6 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Controls */}
              <div className="bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Mode</h3>
                <div className="grid grid-cols-3 gap-2">
                  {hvacModes.map((mode: string) => (
                    <button
                      key={mode}
                      onClick={() => setHvacMode(mode)}
                      className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                        hvacMode === mode
                          ? mode === 'off' 
                            ? 'bg-gray-600 text-white'
                            : 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {getModeIcon(mode)}
                      <span className="text-xs capitalize">{mode}</span>
                    </button>
                  ))}
                </div>

                {fanModes.length > 0 && (
                  <>
                    <h3 className="text-lg font-medium text-white mb-4 mt-6">Fan</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {fanModes.map((mode: string) => (
                        <button
                          key={mode}
                          onClick={() => setFanMode(mode)}
                          className={`p-3 rounded-lg transition-colors ${
                            fanMode === mode
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                          }`}
                        >
                          <span className="text-xs capitalize">{mode}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* History Chart */}
          <div className="p-6 border-t border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">History</h3>
            {loadingHistory ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-400">Loading history...</div>
              </div>
            ) : (
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>

          {/* Logbook */}
          <div className="p-6 border-t border-gray-800">
            <h3 className="text-lg font-medium text-white mb-4">Logbook</h3>
            <div className="space-y-3">
              {recentEvents.map((event, index) => {
                const date = new Date(event.last_changed);
                const timeAgo = getTimeAgo(date);
                
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                    <div className="flex-1">
                      <div className="text-white">
                        {event.state === 'off' 
                          ? 'Turned off'
                          : `Changed to ${event.state}`}
                        {event.attributes?.temperature && (
                          <span className="text-gray-400">
                            {' '}• Target: {event.attributes.temperature}°
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {date.toLocaleTimeString()} - {timeAgo}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get relative time
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default ClimateModal;