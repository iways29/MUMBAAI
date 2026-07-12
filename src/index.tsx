import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import App from './App.tsx'; // This imports your main component

// "ResizeObserver loop completed with undelivered notifications" fires when an
// observer callback triggers another layout in the same frame — ReactFlow's
// container does exactly that during the chat↔canvas width transition, and
// CRA's dev overlay escalates the (benign, browser-ignored) message into a
// blocking full-screen error. Deferring observer callbacks to the next
// animation frame prevents the loop condition at the source.
const NativeResizeObserver = window.ResizeObserver;
if (NativeResizeObserver) {
  window.ResizeObserver = class extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        requestAnimationFrame(() => callback(entries, observer));
      });
    }
  };
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);