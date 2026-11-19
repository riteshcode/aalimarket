import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './styles/admin.css';

// Chrome may offer "install" before any screen has mounted — keep the event for our install buttons
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__aaliInstallPrompt = e;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
