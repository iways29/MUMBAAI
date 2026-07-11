import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/inter';
import './index.css';
import App from './App.tsx'; // This imports your main component

// "ResizeObserver loop completed with undelivered notifications" is benign
// browser noise (ReactFlow panels resizing during the chat↔canvas width
// transition). Browsers ignore it; only CRA's dev overlay escalates it into a
// blocking full-screen error. Swallow just this one.
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);