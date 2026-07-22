import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // Automatically dismiss after 4 seconds
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const removeToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Alert overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 3000,
              backgroundColor: 'var(--bg-secondary)',
              border: `1px solid ${toast.type === 'error' ? 'var(--color-error)' : 'var(--color-success)'}`,
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: '380px'
            }}
          >
            {/* Icon */}
            {toast.type === 'error' ? (
              <AlertTriangle size={18} style={{ color: 'var(--color-error)' }} />
            ) : (
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
            )}

            {/* Message */}
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', flexGrow: 1 }}>
              {toast.message}
            </span>

            {/* Dismiss */}
            <button 
              type="button" 
              onClick={removeToast}
              style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider');
  }
  return context;
}
