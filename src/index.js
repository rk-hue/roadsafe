import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app';
import { AppProvider } from './context/AppContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register();

reportWebVitals();
