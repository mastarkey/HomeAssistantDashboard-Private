import { haStorage } from './haStorage';

export interface StorageData<T> {
  data: T;
  version: number;
  timestamp: number;
  source: 'ha' | 'local';
}

export interface StorageOptions {
  version?: number;
  migrate?: (oldData: any, oldVersion: number) => any;
}

export class StorageManager {
  private static instance: StorageManager;
  private loadPromises: Map<string, Promise<any>> = new Map();
  private dataCache: Map<string, StorageData<any>> = new Map();
  private haReady = false;
  private haReadyCallbacks: (() => void)[] = [];

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  constructor() {
    // Listen for HA storage ready
    this.waitForHAStorage();
  }

  private async waitForHAStorage() {
    // Give HA storage time to connect
    const checkInterval = setInterval(() => {
      if (haStorage.isConnected()) {
        clearInterval(checkInterval);
        this.haReady = true;
        console.log('[StorageManager] HA storage ready');
        this.haReadyCallbacks.forEach(cb => cb());
        this.haReadyCallbacks = [];
      }
    }, 100);

    // Timeout after 5 seconds and proceed with localStorage
    setTimeout(() => {
      if (!this.haReady) {
        clearInterval(checkInterval);
        this.haReady = true;
        console.warn('[StorageManager] HA storage timeout, proceeding with localStorage');
        this.haReadyCallbacks.forEach(cb => cb());
        this.haReadyCallbacks = [];
      }
    }, 5000);
  }

  private onHAReady(): Promise<void> {
    if (this.haReady) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      this.haReadyCallbacks.push(resolve);
    });
  }

  async getItem<T>(key: string, defaultValue: T, options: StorageOptions = {}): Promise<T> {
    const version = options.version || 1;

    // Check if we already have a load in progress
    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key)!;
    }

    const loadPromise = this.loadData<T>(key, defaultValue, version, options.migrate);
    this.loadPromises.set(key, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadPromises.delete(key);
    }
  }

  private async loadData<T>(
    key: string, 
    defaultValue: T, 
    currentVersion: number,
    migrate?: (oldData: any, oldVersion: number) => any
  ): Promise<T> {
    // Wait for HA storage to be ready
    await this.onHAReady();

    // Try to load from both sources
    const [haData, localData] = await Promise.all([
      this.loadFromHA(key),
      this.loadFromLocal(key)
    ]);

    // Determine which data to use
    let selectedData: StorageData<T> | null = null;

    if (haData && localData) {
      // Both exist - use the newer one
      if (haData.timestamp >= localData.timestamp) {
        selectedData = haData;
        console.log(`[StorageManager] Using HA data for ${key} (newer)`);
      } else {
        selectedData = localData;
        console.log(`[StorageManager] Using local data for ${key} (newer)`);
        // Sync newer local data to HA
        this.saveToHA(key, localData);
      }
    } else if (haData) {
      selectedData = haData;
      console.log(`[StorageManager] Using HA data for ${key} (only source)`);
      // Sync to local as backup
      this.saveToLocal(key, haData);
    } else if (localData) {
      selectedData = localData;
      console.log(`[StorageManager] Using local data for ${key} (only source)`);
      // Sync to HA if available
      if (this.haReady) {
        this.saveToHA(key, localData);
      }
    }

    // If no data found, create default
    if (!selectedData) {
      console.log(`[StorageManager] No data found for ${key}, using default`);
      selectedData = {
        data: defaultValue,
        version: currentVersion,
        timestamp: Date.now(),
        source: 'local'
      };
    }

    // Handle version migration
    if (selectedData.version < currentVersion && migrate) {
      console.log(`[StorageManager] Migrating ${key} from v${selectedData.version} to v${currentVersion}`);
      selectedData.data = migrate(selectedData.data, selectedData.version);
      selectedData.version = currentVersion;
      selectedData.timestamp = Date.now();
    }

    // Cache the result
    this.dataCache.set(key, selectedData);

    return selectedData.data;
  }

  async setItem<T>(key: string, value: T, version: number = 1): Promise<void> {
    const storageData: StorageData<T> = {
      data: value,
      version,
      timestamp: Date.now(),
      source: this.haReady ? 'ha' : 'local'
    };

    // Update cache
    this.dataCache.set(key, storageData);

    // Save to both storages
    await Promise.all([
      this.saveToHA(key, storageData),
      this.saveToLocal(key, storageData)
    ]);
  }

  private async loadFromHA(key: string): Promise<StorageData<any> | null> {
    try {
      const data = await haStorage.getItem(key);
      if (data && typeof data === 'object' && 'data' in data && 'version' in data) {
        return data as StorageData<any>;
      }
      // Handle legacy data format
      if (data) {
        return {
          data,
          version: 0,
          timestamp: 0,
          source: 'ha'
        };
      }
    } catch (error) {
      console.error(`[StorageManager] Error loading ${key} from HA:`, error);
    }
    return null;
  }

  private async loadFromLocal(key: string): Promise<StorageData<any> | null> {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && 'data' in parsed && 'version' in parsed) {
          return parsed as StorageData<any>;
        }
        // Handle legacy data format
        return {
          data: parsed,
          version: 0,
          timestamp: 0,
          source: 'local'
        };
      }
    } catch (error) {
      console.error(`[StorageManager] Error loading ${key} from localStorage:`, error);
    }
    return null;
  }

  private async saveToHA(key: string, data: StorageData<any>): Promise<void> {
    if (!this.haReady) return;
    
    try {
      await haStorage.setItem(key, data);
    } catch (error) {
      console.error(`[StorageManager] Error saving ${key} to HA:`, error);
    }
  }

  private async saveToLocal(key: string, data: StorageData<any>): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`[StorageManager] Error saving ${key} to localStorage:`, error);
    }
  }

  // Debug method to check storage state
  async debugStorage(key: string): Promise<void> {
    const [haData, localData] = await Promise.all([
      this.loadFromHA(key),
      this.loadFromLocal(key)
    ]);

    console.group(`[StorageManager] Debug info for ${key}`);
    console.log('HA Storage:', haData);
    console.log('Local Storage:', localData);
    console.log('Cached:', this.dataCache.get(key));
    console.log('HA Ready:', this.haReady);
    console.groupEnd();
  }
}

export const storageManager = StorageManager.getInstance();