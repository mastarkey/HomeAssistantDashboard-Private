import React, { useEffect, useState } from 'react';

export const IframeDebug: React.FC = () => {
  interface DebugInfo {
    isInIframe: boolean;
    currentUrl: string;
    origin: string;
    pathname: string;
    referrer: string;
    hasParentAccess: boolean;
    parentOrigin: string | null;
    parentError?: string;
    haToken: boolean;
    lastMessage?: {
      origin: string;
      data: any;
      timestamp: string;
    };
  }
  
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({} as DebugInfo);
  
  useEffect(() => {
    const info: DebugInfo = {
      isInIframe: window.parent !== window,
      currentUrl: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      referrer: document.referrer,
      hasParentAccess: false,
      parentOrigin: null,
      haToken: !!localStorage.getItem('ha_access_token')
    };
    
    // Try to access parent window
    try {
      if (window.parent !== window) {
        info.hasParentAccess = true;
        info.parentOrigin = window.parent.location.origin;
      }
    } catch (e) {
      info.parentError = 'Cross-origin access blocked';
    }
    
    setDebugInfo(info);
    
    // Listen for messages from parent
    const handleMessage = (event: MessageEvent) => {
      console.log('[IframeDebug] Received message:', event);
      setDebugInfo((prev: DebugInfo) => ({
        ...prev,
        lastMessage: {
          origin: event.origin,
          data: event.data,
          timestamp: new Date().toISOString()
        }
      }));
    };
    
    window.addEventListener('message', handleMessage);
    
    // Send a test message to parent
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'iframe-ready', source: 'react-dashboard' }, '*');
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  if (!debugInfo.isInIframe) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Iframe Debug Info</h3>
      <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};