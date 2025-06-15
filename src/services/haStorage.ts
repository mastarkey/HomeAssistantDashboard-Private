import { Connection } from 'home-assistant-js-websocket';

// Storage keys for dashboard configuration
const STORAGE_KEYS = {
  CUSTOM_ROOMS: 'react_dashboard_custom_rooms',
  DELETED_ROOMS: 'react_dashboard_deleted_rooms',
  CUSTOM_CATEGORIES: 'react_dashboard_custom_categories',
  CUSTOM_ENTITIES: 'react_dashboard_custom_entities',
  ENTITY_OVERRIDES: 'react_dashboard_entity_overrides',
  CARD_ORDER: 'react_dashboard_card_order',
  HIDDEN_ROOMS: 'react_dashboard_hidden_rooms',
};

export class HAStorage {
  private connection: Connection | null = null;
  private storageCollection = 'react_dashboard';
  private cache: Map<string, any> = new Map();
  private isLoaded = false;

  setConnection(connection: Connection) {
    this.connection = connection;
    this.loadAllData();
  }

  // Load all storage data from Home Assistant
  private async loadAllData(): Promise<void> {
    if (!this.connection || this.isLoaded) return;

    try {
      // Loading data from Home Assistant...
      
      // Use Home Assistant's storage collection API
      const result = await this.connection.sendMessagePromise({
        type: 'frontend/get_user_data',
        key: this.storageCollection,
      }) as any;

      if (result && result.value) {
        // Parse the stored data
        Object.entries(result.value).forEach(([key, value]) => {
          this.cache.set(key, value);
        });
        // Loaded data from HA storage
      }
      
      this.isLoaded = true;
    } catch (error) {
      // Error loading data from HA
      // Continue with localStorage fallback
    }
  }

  // Store data in Home Assistant
  async setItem(key: string, value: any): Promise<void> {
    // Always update cache
    this.cache.set(key, value);

    // Also save to localStorage as immediate backup
    localStorage.setItem(key, JSON.stringify(value));

    if (!this.connection) {
      // No connection, data saved to localStorage only
      return;
    }

    try {
      // Get all current data
      const allData: Record<string, any> = {};
      this.cache.forEach((v, k) => {
        allData[k] = v;
      });

      // Save all data to Home Assistant
      await this.connection.sendMessagePromise({
        type: 'frontend/set_user_data',
        key: this.storageCollection,
        value: allData,
      });

      // Saved data to Home Assistant
    } catch (error) {
      // Error saving to HA
      // Data is still in localStorage as fallback
    }
  }

  // Retrieve data from cache or localStorage
  async getItem(key: string): Promise<any> {
    // Wait for initial load if needed
    if (this.connection && !this.isLoaded) {
      await this.loadAllData();
    }

    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache.set(key, parsed); // Update cache
        return parsed;
      }
    } catch (e) {
      // Error reading from localStorage
    }

    return null;
  }

  // Remove data
  async removeItem(key: string): Promise<void> {
    this.cache.delete(key);
    localStorage.removeItem(key);

    if (this.connection) {
      try {
        // Get all current data
        const allData: Record<string, any> = {};
        this.cache.forEach((v, k) => {
          allData[k] = v;
        });

        // Save updated data to Home Assistant
        await this.connection.sendMessagePromise({
          type: 'frontend/set_user_data',
          key: this.storageCollection,
          value: allData,
        });
      } catch (error) {
        // Error removing from HA
      }
    }
  }

  // Clear all data
  async clear(): Promise<void> {
    this.cache.clear();
    
    // Clear localStorage items
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    if (this.connection) {
      try {
        await this.connection.sendMessagePromise({
          type: 'frontend/set_user_data',
          key: this.storageCollection,
          value: {},
        });
      } catch (error) {
        // Error clearing HA storage
      }
    }
  }
}

// Singleton instance
export const haStorage = new HAStorage();

// Export storage keys for use in hooks
export { STORAGE_KEYS };