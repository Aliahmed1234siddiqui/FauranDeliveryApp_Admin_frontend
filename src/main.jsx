import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/app/app';

import '@/styles/index.css';

// Stamp the theme before first paint so dark-mode users never see a light flash.
try {
  const saved = localStorage.getItem('fauran_theme');
  document.documentElement.dataset.theme =
    saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch {
  document.documentElement.dataset.theme = 'light';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
