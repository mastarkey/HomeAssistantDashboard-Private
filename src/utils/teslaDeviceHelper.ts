// Helper functions specifically for Tesla Wall Connector devices

export function getTeslaWallConnectorEntities(entities: Record<string, any>): [string, any][] {
  return Object.entries(entities).filter(([entityId]) => 
    entityId.toLowerCase().includes('tesla_wall_connector')
  );
}

export function groupTeslaWallConnectorEntities(entities: Record<string, any>): {
  primary: [string, any] | null;
  all: [string, any][];
} {
  const teslaEntities = getTeslaWallConnectorEntities(entities);
  
  if (teslaEntities.length === 0) {
    return { primary: null, all: [] };
  }
  
  // Find the best primary entity (prefer switch, then sensor)
  let primary = teslaEntities.find(([id]) => id.startsWith('switch.'));
  if (!primary) {
    primary = teslaEntities.find(([id]) => id.startsWith('sensor.'));
  }
  if (!primary) {
    primary = teslaEntities[0];
  }
  
  return {
    primary,
    all: teslaEntities
  };
}

export function isTeslaWallConnectorEntity(entityId: string): boolean {
  return entityId.toLowerCase().includes('tesla_wall_connector');
}