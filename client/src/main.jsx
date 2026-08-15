import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// کش قدیمی را پاک کن تا لینک عمومی نسخهٔ تازه را نشان بدهد
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      reg.update().catch(() => {});
    });
  });
  caches.keys().then((keys) => {
    keys
      .filter((k) => /workbox|makan|precache/i.test(k))
      .forEach((k) => caches.delete(k));
  }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
