import { useState, useEffect } from 'react';
import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  subscribeConfig,
  callService,
  type HassEntities,
  type HassConfig,
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

// Interface for Home Assistant panel props
interface HAPanelProps {
  hass?: {
    connection: Connection;
    states: HassEntities;
    config: HassConfig;
    callService: (domain: string, service: string, serviceData?: any) => Promise<void>;
    [key: string]: any;
  };
  narrow?: boolean;
  route?: any;
  panel?: any;
}

// Check if we're running as a native HA panel
declare global {
  interface Window {
    hassConnection?: Connection;
    __REACT_DASHBOARD_PROPS__?: HAPanelProps;
  }
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
        let connection: Connection;
        let auth: Auth | null = null;
        
        // Check if we're running inside Home Assistant
        const isInIframe = window.parent !== window;
        const isHomeAssistant = isInIframe && window.location.pathname.includes('react-dashboard-iframe');
        
        // Wait for panel props if we're in Home Assistant
        if (isHomeAssistant) {
          console.log('[HA Integration] Waiting for Home Assistant data...');
          
          // Listen for HASS updates
          const handleHassUpdate = (event: CustomEvent) => {
            console.log('[HA Integration] Received HASS update');
            const hass = event.detail;
            
            setState((prev) => ({
              ...prev,
              entities: hass.states,
              config: hass.config,
              connection: hass.connection,
              connected: true,
              error: null,
              auth: null,
            }));
            
            // Set connection for haStorage
            if (hass.connection) {
              haStorage.setConnection(hass.connection);
            }
          };
          
          window.addEventListener('hass-update', handleHassUpdate as any);
          
          // Request HASS data from parent
          window.parent.postMessage({ type: 'ready-for-hass' }, '*');
          
          return () => {
            window.removeEventListener('hass-update', handleHassUpdate as any);
          };
        }
        
        const panelProps = window.__REACT_DASHBOARD_PROPS__;
        
        if (panelProps?.hass) {
          console.log('[Native HA Panel] Using provided Home Assistant data');
          
          // We have panel props, use them
            setState((prev) => ({
              ...prev,
              entities: panelProps.hass!.states,
              config: panelProps.hass!.config,
              connection: panelProps.hass!.connection,
              connected: true,
              error: null,
              auth: null,
            }));
            
            // Set connection for haStorage
            const hassConnection = panelProps.hass!.connection || {
              sendMessagePromise: async (message: any) => {
                console.log('[Native HA Panel] Mock sendMessagePromise:', message);
                if (message.type === 'frontend/get_user_data') {
                  return { value: null };
                }
                return {};
              }
            } as any;
            
            haStorage.setConnection(hassConnection);
            
            // Set the connection for fetching registries
            connection = hassConnection;
            
            // Don't subscribe to entities (hass-update will handle that)
            // But continue to fetch device and area registries below
        } else {
          // No panel props - create our own connection
          console.log(isInIframe ? '[Iframe Mode] Creating WebSocket connection' : '[Standalone Mode] Creating WebSocket connection');
          
          let hassUrl = 'http://192.168.1.7:8123';
          
          try {
            // Try to detect if we're in an iframe
            if (isInIframe) {
              // First try to get the URL from the iframe src
              const currentUrl = new URL(window.location.href);
              const baseUrl = currentUrl.origin;
              if (baseUrl && baseUrl !== 'null') {
                hassUrl = baseUrl;
                console.log('[Iframe Mode] Using iframe origin URL:', hassUrl);
              } else {
                // Try parent window origin
                try {
                  if (window.parent.location.origin) {
                    hassUrl = window.parent.location.origin;
                    console.log('[Iframe Mode] Using parent origin URL:', hassUrl);
                  }
                } catch (e) {
                  // Cross-origin error, use default URL
                  console.log('[Iframe Mode] Cross-origin error, using default URL:', hassUrl);
                }
              }
            }
          } catch (e) {
            // Error getting URL, use default
            console.error('[Iframe Mode] Error detecting URL:', e);
          }
          
          // We have a long-lived token, so use it directly
          const token = localStorage.getItem('ha_access_token') || 
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIzMzMzYjM3ZWUyYjk0ODRmOWQ3ODk5ZGVhYzY4MTM4MCIsImlhdCI6MTc0OTg2MTU0MSwiZXhwIjoyMDY1MjIxNTQxfQ.juV15QOsu_jgW87tABrc7doVr97teA8jfihFDCWPDsw';
          
          if (!token) {
            throw new Error('No access token found. Please set ha_access_token in localStorage.');
          }
          
          // Always use long-lived token auth to avoid iframe issues
          auth = createLongLivedTokenAuth(hassUrl, token);
          connection = await createConnection({ auth });

          // Connect haStorage to the Home Assistant connection
          haStorage.setConnection(connection);

          // Subscribe to entities
          unsubscribeEntities = subscribeEntities(connection, (entities) => {
            // DEBUG: Log Tesla entities
            const teslaEntities = Object.entries(entities).filter(([id]) => 
              id.toLowerCase().includes('tesla')
            );
            if (teslaEntities.length > 0) {
              console.log('[DEBUG] Tesla entities from Home Assistant:', teslaEntities.map(([id, e]) => ({
                id,
                state: (e as any).state,
                friendlyName: (e as any).attributes?.friendly_name
              })));
            }
            setState((prev) => ({ ...prev, entities }));
          });

          // Subscribe to config
          unsubscribeConfig = subscribeConfig(connection, (config) => {
            setState((prev) => ({ ...prev, config }));
          });

          setState((prev) => ({
            ...prev,
            connection,
            connected: true,
            error: null,
            auth,
            config: { ...prev.config, hassUrl },
          }));
        }

        // Fetch device and area registries (for both native and standalone modes)
        try {
          const deviceMessage: MessageBase = {
            type: 'config/device_registry/list',
          };
          const devices = await connection.sendMessagePromise(deviceMessage);
          setState((prev) => ({ ...prev, devices }));
        } catch (error) {
          console.warn('Failed to fetch device registry:', error);
        }

        try {
          const areaMessage: MessageBase = {
            type: 'config/area_registry/list',
          };
          const areas = await connection.sendMessagePromise(areaMessage);
          setState((prev) => ({ ...prev, areas }));
        } catch (error) {
          console.warn('Failed to fetch area registry:', error);
        }

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
    // Check if we're in native mode and have the hass object
    const panelProps = window.__REACT_DASHBOARD_PROPS__;
    if (panelProps?.hass?.callService) {
      return panelProps.hass.callService(domain, service, serviceData);
    }
    
    // Fallback to using our connection
    if (!state.connection) {
      throw new Error('No connection to Home Assistant');
    }
    return callService(state.connection, domain, service, serviceData);
  };

  // Listen for HA panel updates in native mode and iframe messages
  useEffect(() => {
    const handleHassUpdate = (event: CustomEvent) => {
      const hass = event.detail;
      if (hass) {
        setState((prev) => ({
          ...prev,
          entities: hass.states,
          config: hass.config,
        }));
      }
    };

    // Handle postMessage from parent window (iframe mode)
    const handleMessage = (event: MessageEvent) => {
      console.log('[useHomeAssistant] Received message:', event.data);
      
      if (event.data?.type === 'hass-update' && event.data?.hass) {
        console.log('[useHomeAssistant] Processing HASS data from parent window');
        setState((prev) => ({
          ...prev,
          entities: event.data.hass.states,
          config: event.data.hass.config,
          connected: true,
          error: null,
        }));
      }
    };

    window.addEventListener('hass-update', handleHassUpdate as any);
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('hass-update', handleHassUpdate as any);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return {
    ...state,
    callService: callServiceMethod,
  };
};