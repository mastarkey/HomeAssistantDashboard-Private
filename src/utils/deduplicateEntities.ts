// Utility to deduplicate entities that represent the same device
import { getDeviceForEntity, type Device } from './deviceRegistry';

export interface EntityGroup {
  primaryEntity: [string, any];
  relatedEntities: [string, any][];
  displayName: string;
}

// Normalize entity names for comparison
function normalizeEntityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\-\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if two entities likely represent the same device
function areEntitiesSimilar(name1: string, name2: string): boolean {
  const normalized1 = normalizeEntityName(name1);
  const normalized2 = normalizeEntityName(name2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // Check if one contains the other (for cases like "bedroom closet" vs "bedroom closet light")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    // But exclude if they're completely different types
    const excludeWords = ['battery', 'energy', 'power', 'temperature', 'humidity', 'motion', 'door', 'window'];
    const hasExcludeWord1 = excludeWords.some(word => normalized1.includes(word));
    const hasExcludeWord2 = excludeWords.some(word => normalized2.includes(word));
    
    // If one has exclude word and other doesn't, they're different
    if (hasExcludeWord1 !== hasExcludeWord2) return false;
    
    return true;
  }
  
  return false;
}

// Group entities by similarity
export function groupSimilarEntities(
  entities: [string, any][],
  devices?: Device[] | null,
  allEntities?: Record<string, any>
): EntityGroup[] {
  const groups: EntityGroup[] = [];
  const processedIndices = new Set<number>();
  const deviceGrouped = new Set<string>(); // Track which devices we've already grouped
  
  entities.forEach((entity, index) => {
    if (processedIndices.has(index)) return;
    
    const [entityId, entityData] = entity;
    const friendlyName = entityData.attributes?.friendly_name || entityId;
    const domain = entityId.split('.')[0];
    
    // If we have device registry, group by device first
    if (devices && allEntities) {
      const device = getDeviceForEntity(entityId, allEntities, devices);
      if (device && !deviceGrouped.has(device.id)) {
        deviceGrouped.add(device.id);
        
        // Get all entities for this device that are in our input list
        const deviceEntities = entities.filter(([id], idx) => {
          if (processedIndices.has(idx)) return false;
          const entityDevice = getDeviceForEntity(id, allEntities, devices);
          return entityDevice?.id === device.id;
        });
        
        if (deviceEntities.length > 0) {
          // Mark all these entities as processed
          deviceEntities.forEach(([id]) => {
            const idx = entities.findIndex(([eid]) => eid === id);
            if (idx !== -1) processedIndices.add(idx);
          });
          
          // Determine primary entity for the device
          let primaryEntity = entity;
          const priorityDomains = ['camera', 'media_player', 'light', 'switch', 'climate', 'cover'];
          
          const sortedDeviceEntities = deviceEntities.sort(([aId], [bId]) => {
            const aDomain = aId.split('.')[0];
            const bDomain = bId.split('.')[0];
            const aPriority = priorityDomains.indexOf(aDomain);
            const bPriority = priorityDomains.indexOf(bDomain);
            
            if (aPriority === -1 && bPriority === -1) return 0;
            if (aPriority === -1) return 1;
            if (bPriority === -1) return -1;
            
            return aPriority - bPriority;
          });
          
          if (sortedDeviceEntities.length > 0) {
            primaryEntity = sortedDeviceEntities[0];
          }
          
          groups.push({
            primaryEntity,
            relatedEntities: deviceEntities.filter(e => e !== primaryEntity),
            displayName: primaryEntity[1].attributes?.friendly_name || primaryEntity[0]
          });
          
          return;
        }
      }
    }
    
    // Find all similar entities
    const similarEntities: [string, any][] = [];
    
    entities.forEach((otherEntity, otherIndex) => {
      if (index === otherIndex || processedIndices.has(otherIndex)) return;
      
      const [otherId, otherData] = otherEntity;
      const otherName = otherData.attributes?.friendly_name || otherId;
      const otherDomain = otherId.split('.')[0];
      
      // Skip if different domains (unless it's a scene/automation)
      if (domain !== otherDomain && !['scene', 'automation', 'script'].includes(otherDomain)) return;
      
      if (areEntitiesSimilar(friendlyName, otherName)) {
        similarEntities.push(otherEntity);
        processedIndices.add(otherIndex);
      }
    });
    
    // Determine primary entity (prefer lights/switches over sensors/scenes)
    let primaryEntity = entity;
    const priorityDomains = ['light', 'switch', 'climate', 'cover', 'media_player'];
    
    if (!priorityDomains.includes(domain)) {
      const priorityEntity = similarEntities.find(([id]) => 
        priorityDomains.includes(id.split('.')[0])
      );
      if (priorityEntity) {
        primaryEntity = priorityEntity;
        similarEntities.splice(similarEntities.indexOf(priorityEntity), 1);
        similarEntities.push(entity);
      }
    }
    
    groups.push({
      primaryEntity,
      relatedEntities: similarEntities,
      displayName: primaryEntity[1].attributes?.friendly_name || primaryEntity[0]
    });
    
    processedIndices.add(index);
  });
  
  return groups;
}

// Get deduplicated entities (only primary ones from each group)
export function deduplicateEntities(
  entities: [string, any][],
  devices?: Device[] | null,
  allEntities?: Record<string, any>
): [string, any][] {
  const groups = groupSimilarEntities(entities, devices, allEntities);
  return groups.map(group => group.primaryEntity);
}