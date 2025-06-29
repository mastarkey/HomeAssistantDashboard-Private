import { useState } from 'react';
import { storageManager } from '../services/storageManager';
import { STORAGE_KEYS } from '../services/haStorage';
import { useEntityOverrides } from '../hooks/useEntityOverrides';

export function StorageDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { debugOverrides } = useEntityOverrides();

  const runDebug = async () => {
    let info = '=== Storage Debug Info ===\n\n';
    
    // Check each storage key
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      info += `\n--- ${name} ---\n`;
      try {
        await storageManager.debugStorage(key);
        // The debug info will be in console
        info += 'Check browser console for details\n';
      } catch (e) {
        info += `Error: ${e}\n`;
      }
    }

    // Run entity overrides debug
    await debugOverrides();
    
    info += '\n\nCheck browser console for detailed output';
    setDebugInfo(info);
  };

  const exportStorage = async () => {
    const data: Record<string, any> = {};
    
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      try {
        const value = await storageManager.getItem(key, null);
        if (value !== null) {
          data[name] = value;
        }
      } catch (e) {
        data[name] = { error: String(e) };
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-storage-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearStorage = async () => {
    if (!confirm('Are you sure you want to clear all storage? This cannot be undone.')) {
      return;
    }

    for (const key of Object.values(STORAGE_KEYS)) {
      localStorage.removeItem(key);
    }
    
    window.location.reload();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '5px 10px',
          backgroundColor: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 9999,
          opacity: 0.5,
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
      >
        Debug Storage
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '400px',
        maxHeight: '80vh',
        backgroundColor: '#1a1a1a',
        color: 'white',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '15px',
        zIndex: 9999,
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Storage Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button
          onClick={runDebug}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Run Debug
        </button>
        <button
          onClick={exportStorage}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export Storage
        </button>
        <button
          onClick={clearStorage}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Storage
        </button>
      </div>

      {debugInfo && (
        <pre
          style={{
            backgroundColor: '#2a2a2a',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {debugInfo}
        </pre>
      )}

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
        <p>Tips:</p>
        <ul style={{ marginLeft: '20px' }}>
          <li>Check browser console for detailed logs</li>
          <li>Export storage to see all data</li>
          <li>Clear storage if data is corrupted</li>
          <li>Storage uses both HA and localStorage</li>
        </ul>
      </div>
    </div>
  );
}