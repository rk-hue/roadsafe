import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import { AppProvider } from './context/AppContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

// Create React root
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);

// ✅ Register the service worker to enable PWA features
// This allows the app to work offline and be installable on mobile
serviceWorkerRegistration.register();

// Optional: measure performance
reportWebVitals();
