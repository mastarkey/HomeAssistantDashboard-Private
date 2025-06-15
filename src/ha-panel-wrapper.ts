// Home Assistant Panel Wrapper for React Dashboard
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Define the custom element for Home Assistant
class ReactDashboardPanel extends HTMLElement {
  private _hass: any;
  private _narrow: boolean = false;
  private _route: any;
  private _panel: any;
  private _reactRoot?: ReactDOM.Root;

  set hass(hass: any) {
    this._hass = hass;
    this._updateReactApp();
  }

  set narrow(narrow: boolean) {
    this._narrow = narrow;
    this._updateReactApp();
  }

  set route(route: any) {
    this._route = route;
    this._updateReactApp();
  }

  set panel(panel: any) {
    this._panel = panel;
    this._updateReactApp();
  }

  connectedCallback() {
    console.log('React Dashboard Panel: Connected');
    this._renderReactApp();
  }

  disconnectedCallback() {
    if (this._reactRoot) {
      this._reactRoot.unmount();
    }
  }

  private _renderReactApp() {
    console.log('React Dashboard Panel: Rendering app');
    // Create a shadow root to isolate styles
    const shadow = this.attachShadow({ mode: 'open' });
    
    // Create a container for React
    const container = document.createElement('div');
    container.style.height = '100%';
    container.style.width = '100%';
    shadow.appendChild(container);

    // Create a link element to load the CSS
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = '/local/react-dashboard/react-dashboard-panel.css';
    shadow.appendChild(linkElement);
    
    // Also add a style element for any inline styles if needed
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      :host {
        display: block;
        height: 100vh;
        width: 100%;
      }
    `;
    shadow.appendChild(styleElement);

    // Set up props for React app
    window.__REACT_DASHBOARD_PROPS__ = {
      hass: this._hass,
      narrow: this._narrow,
      route: this._route,
      panel: this._panel,
    };

    // Render React app
    this._reactRoot = ReactDOM.createRoot(container);
    this._reactRoot.render(
      React.createElement(React.StrictMode, null,
        React.createElement(App)
      )
    );
  }

  private _updateReactApp() {
    if (!this._hass) return;

    // Update the global props
    window.__REACT_DASHBOARD_PROPS__ = {
      hass: this._hass,
      narrow: this._narrow,
      route: this._route,
      panel: this._panel,
    };

    // Dispatch custom event for React to listen to
    window.dispatchEvent(new CustomEvent('hass-update', { 
      detail: this._hass 
    }));
  }
}

// Register the custom element
customElements.define('react-dashboard-panel', ReactDashboardPanel);

// Export for Home Assistant to load
export { ReactDashboardPanel };