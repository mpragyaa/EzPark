import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/hero.css';

export default function Hero() {
  // Parent container stagger configuration
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15
      }
    }
  };

  // Text and CTA button slide-fade-up transition
  const fadeUpVariants = {
    hidden: { 
      y: 35, 
      opacity: 0 
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] // Apple-like smooth decel ease
      }
    }
  };

  // Right-side platform scale-in configuration
  const rightVisualVariants = {
    hidden: { 
      scale: 0.82, 
      opacity: 0 
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.4
      }
    }
  };

  return (
    <section className="hero-container">
      {/* Background Visual Spotlights & Overlays */}
      <div className="hero-spotlight" />
      <div className="hero-ambient-glow" />
      <div className="hero-grid" />

      {/* Main Content Layout */}
      <div className="hero-content">
        
        {/* Left Side: Staggered Content */}
        <motion.div 
          className="hero-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Small premium badge */}
          <motion.div className="hero-badge" variants={fadeUpVariants}>
            <span className="hero-badge-dot" />
            <span className="hero-badge-text">AI-Powered Smart Parking</span>
          </motion.div>

          {/* Large headline */}
          <motion.h1 className="hero-headline" variants={fadeUpVariants}>
            <span className="hero-headline-dim">Parking.</span>
            <span className="hero-headline-accent">Reimagined.</span>
          </motion.h1>

          {/* Short premium subtitle */}
          <motion.p className="hero-subtitle" variants={fadeUpVariants}>
            Experience intelligent parking with real-time availability, 
            AI-powered guidance, and a seamless digital interface designed 
            for luxury and convenience.
          </motion.p>

          {/* Two CTA buttons */}
          <motion.div className="hero-ctas" variants={fadeUpVariants}>
            <motion.button 
              className="btn-primary"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore Platform
            </motion.button>
            <motion.button 
              className="btn-secondary"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Side: Glass Platform visualization */}
        <motion.div 
          className="hero-right"
          variants={rightVisualVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Bobbing wrapper to simulate floating in mid-air */}
          <motion.div 
            className="platform-wrapper"
            animate={{ y: [0, -12, 0] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="platform-stage">
              {/* Layered Glass Platforms */}
              <div className="platform-layer layer-base" />
              <div className="platform-layer layer-middle" />
              <div className="platform-layer layer-top" />

              {/* Glowing Rings */}
              <div className="glow-ring ring-outer" />
              <div className="glow-ring ring-inner" />

              {/* Holographic vertical light beam */}
              <div className="hologram-beam" />

              {/* Floating particles */}
              <div className="floating-particles">
                <div className="particle" />
                <div className="particle" />
                <div className="particle" />
                <div className="particle" />
                <div className="particle" />
              </div>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
