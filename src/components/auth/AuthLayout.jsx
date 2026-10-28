import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/auth.css';

export default function AuthLayout({ children }) {
  return (
    <main className="auth-layout">
      {/* Glassmorphic Animated Login/Signup card wrapper */}
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </main>
  );
}
