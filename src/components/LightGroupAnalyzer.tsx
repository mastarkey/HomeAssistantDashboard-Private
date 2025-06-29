import React, { useMemo } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';
import { Lightbulb, Users, X } from 'lucide-react';

interface LightGroupAnalyzerProps {
  onClose: () => void;
}

const LightGroupAnalyzer: React.FC<LightGroupAnalyzerProps> = ({ onClose }) => {
  const { entities } = useHomeAssistant();

  const lightAnalysis = useMemo(() => {
    const groups: Array<{
      entityId: string;
      name: string;
      memberCount: number;
      members: string[];
    }> = [];
    
    const individualLights: Array<{
      entityId: string;
      name: string;
      manufacturer?: string;
      model?: string;
    }> = [];

    // Analyze all light entities
    Object.entries(entities).forEach(([entityId, entity]) => {
      if (!entityId.startsWith('light.')) return;

      const attributes = entity.attributes || {};
      const friendlyName = attributes.friendly_name || entityId;
      
      // Check if this is a light group by looking for entity_id attribute
      if (attributes.entity_id && Array.isArray(attributes.entity_id) && attributes.entity_id.length > 0) {
        groups.push({
          entityId,
          name: friendlyName,
          memberCount: attributes.entity_id.length,
          members: attributes.entity_id
        });
      } else {
        individualLights.push({
          entityId,
          name: friendlyName,
          manufacturer: attributes.manufacturer,
          model: attributes.model
        });
      }
    });

    // Sort by name
    groups.sort((a, b) => a.name.localeCompare(b.name));
    individualLights.sort((a, b) => a.name.localeCompare(b.name));

    return { groups, individualLights };
  }, [entities]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-semibold text-white">Light Groups vs Individual Lights</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Light Groups */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                Light Groups ({lightAnalysis.groups.length})
              </h3>
              
              {lightAnalysis.groups.length === 0 ? (
                <p className="text-gray-400">No light groups found</p>
              ) : (
                <div className="space-y-4">
                  {lightAnalysis.groups.map((group) => (
                    <div key={group.entityId} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{group.name}</h4>
                          <p className="text-xs text-gray-400 font-mono">{group.entityId}</p>
                        </div>
                        <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-sm">
                          {group.memberCount} lights
                        </span>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Members:</p>
                        <div className="space-y-1">
                          {group.members.map((memberId) => {
                            const memberEntity = entities[memberId];
                            const memberName = memberEntity?.attributes?.friendly_name || memberId;
                            return (
                              <div key={memberId} className="flex items-center gap-2 text-sm">
                                <Lightbulb className="w-3 h-3 text-yellow-400" />
                                <span className="text-gray-300">{memberName}</span>
                                <span className="text-xs text-gray-500 font-mono">({memberId})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Individual Lights */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Individual Lights ({lightAnalysis.individualLights.length})
              </h3>
              
              {lightAnalysis.individualLights.length === 0 ? (
                <p className="text-gray-400">No individual lights found</p>
              ) : (
                <div className="space-y-2">
                  {lightAnalysis.individualLights.map((light) => (
                    <div key={light.entityId} className="bg-gray-800/50 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-white text-sm font-medium">{light.name}</h4>
                          <p className="text-xs text-gray-400 font-mono">{light.entityId}</p>
                          {(light.manufacturer || light.model) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {[light.manufacturer, light.model].filter(Boolean).join(' - ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-8 bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-400">{lightAnalysis.groups.length}</p>
                <p className="text-sm text-gray-400">Light Groups</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">{lightAnalysis.individualLights.length}</p>
                <p className="text-sm text-gray-400">Individual Lights</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {lightAnalysis.groups.reduce((sum, group) => sum + group.memberCount, 0)}
                </p>
                <p className="text-sm text-gray-400">Total Grouped Lights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LightGroupAnalyzer;