import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/global.css';
import { OpenAPI } from '@/lib/client/core/OpenAPI';
import { STORAGE_KEYS } from '@/lib/api';

// ─── Wire OpenAPI generated client with runtime auth ─────────────────────────
// TOKEN resolves the current access token for each request.
OpenAPI.TOKEN = async () =>
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ?? '';

// HEADERS resolves company context headers for each request.
OpenAPI.HEADERS = async () => ({
  'X-Company-Code': localStorage.getItem(STORAGE_KEYS.COMPANY_CODE) ?? '',
  'X-Company-Id': localStorage.getItem(STORAGE_KEYS.COMPANY_ID) ?? '',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
