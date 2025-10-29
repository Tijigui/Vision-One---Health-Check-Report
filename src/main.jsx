import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ToastProvider } from './components/ToastProvider.jsx'
import { I18nProvider } from './components/I18nProvider.jsx'

// Limpeza opcional de cache via querystring (?reset=1)
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search)
  if (params.get('reset') === '1') {
    try { localStorage.clear() } catch {}
    try { sessionStorage.clear() } catch {}
    // remove o parâmetro para evitar repetição
    const url = window.location.origin + window.location.pathname
    window.history.replaceState(null, '', url)
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider defaultLang="pt">
      <ToastProvider>
        <App />
      </ToastProvider>
    </I18nProvider>
  </React.StrictMode>
)
