import React, { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = 'info', action = null) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, msg, type, action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };
  const api = useMemo(() => ({ toast: add }), []);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="msg">{t.msg}</span>
            {t.action ? (
              <button className="btn small" onClick={() => { try { t.action.onClick?.(); } catch {} }}>
                {t.action.label || 'OK'}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}