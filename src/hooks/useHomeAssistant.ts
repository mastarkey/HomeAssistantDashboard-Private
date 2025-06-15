import { useState, useEffect } from 'react';
import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  subscribeConfig,
  callService,
} from 'home-assistant-js-websocket';
import type { Connection, Auth, MessageBase } from 'home-assistant-js-websocket';
import { haStorage } from '../services/haStorage';

interface HomeAssistantState {
  connection: Connection | null;
  entities: any | null;
  config: any | null;
  devices: any | null;
  areas: any | null;
  connected: boolean;
  error: string | null;
  auth: Auth | null;
}

export const useHomeAssistant = () => {
  const [state, setState] = useState<HomeAssistantState>({
    connection: null,
    entities: null,
    config: null,
    devices: null,
    areas: null,
    connected: false,
    error: null,
    auth: null,
  });

  useEffect(() => {
    let unsubscribeEntities: (() => void) | null = null;
    let unsubscribeConfig: (() => void) | null = null;

    const connect = async () => {
      try {
        let auth: Auth;
        
        // Check if we're running in Home Assistant panel
        let hassUrl = 'http://192.168.1.7:8123';
        
        try {
          // Try to detect if we're in an iframe
          if (window.parent !== window && window.parent.location.origin) {
            hassUrl = window.parent.location.origin;
          }
        } catch (e) {
          // Cross-origin error, use default URL
        }
        
        // We have a long-lived token, so use it directly
        const token = localStorage.getItem('ha_access_token') || 
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzMzMzYjM3ZWUyYjk0ODRmOWQ3ODk5ZGVhYzY4MTM4MCIsImlhdCI6MTc0OTg2MTU0MSwiZXhwIjoyMDY1MjIxNTQxfQ.juV15QOsu_jgW87tABrc7doVr97teA8jfihFDCWPDsw';
        
        if (!token) {
          throw new Error('No access token found. Please set ha_access_token in localStorage.');
        }
        
        // Always use long-lived token auth to avoid iframe issues
        auth = createLongLivedTokenAuth(hassUrl, token);

        const connection = await createConnection({ auth });

        // Connect haStorage to the Home Assistant connection
        haStorage.setConnection(connection);

        // Subscribe to entities
        unsubscribeEntities = subscribeEntities(connection, (entities) => {
          setState((prev) => ({ ...prev, entities }));
        });

        // Subscribe to config
        unsubscribeConfig = subscribeConfig(connection, (config) => {
          setState((prev) => ({ ...prev, config }));
        });

        // Fetch device registry
        try {
          const deviceMessage: MessageBase = {
            type: 'config/device_registry/list',
          };
          const devices = await connection.sendMessagePromise(deviceMessage);
          setState((prev) => ({ ...prev, devices }));
        } catch (error) {
          // Failed to fetch device registry
        }

        // Fetch area registry
        try {
          const areaMessage: MessageBase = {
            type: 'config/area_registry/list',
          };
          const areas = await connection.sendMessagePromise(areaMessage);
          setState((prev) => ({ ...prev, areas }));
        } catch (error) {
          // Failed to fetch area registry
        }

        setState((prev) => ({
          ...prev,
          connection,
          connected: true,
          error: null,
          auth,
          config: { ...prev.config, hassUrl },
        }));

      } catch (error) {
        // Failed to connect to Home Assistant
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          connected: false,
        }));
      }
    };

    connect();

    return () => {
      if (unsubscribeEntities) unsubscribeEntities();
      if (unsubscribeConfig) unsubscribeConfig();
      if (state.connection) {
        state.connection.close();
      }
    };
  }, []);

  // Add callService method to the return object
  const callServiceMethod = async (domain: string, service: string, serviceData?: any) => {
    if (!state.connection) {
      throw new Error('No connection to Home Assistant');
    }
    return callService(state.connection, domain, service, serviceData);
  };

  return {
    ...state,
    callService: callServiceMethod,
  };
};