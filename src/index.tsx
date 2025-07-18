import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.tsx'; // This imports your main component

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);