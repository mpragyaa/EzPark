import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../../styles/hero.css';

export default function Hero() {
  const [occupancy, setOccupancy] = useState(64);
  const [slots, setSlots] = useState([
    { id: 1, status: 'available' },
    { id: 2, status: 'occupied' },
    { id: 3, status: 'reserved' },
    { id: 4, status: 'available' },
    { id: 5, status: 'occupied' },
    { id: 6, status: 'available' },
    { id: 7, status: 'occupied' },
    { id: 8, status: 'available' },
    { id: 9, status: 'available' },
    { id: 10, status: 'reserved' },
    { id: 11, status: 'occupied' },
    { id: 12, status: 'available' }
  ]);

  // Periodic occupancy and slot state animation updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time sensors updates
      setSlots(prev => prev.map(s => {
        const rand = Math.random();
        if (rand > 0.8) {
          const nextStatus = rand > 0.9 ? 'reserved' : (rand > 0.85 ? 'occupied' : 'available');
          return { ...s, status: nextStatus };
        }
        return s;
      }));

      setOccupancy(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(50, Math.min(90, prev + delta));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Parent container stagger configuration
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  // Text and CTA button slide-fade-up transition
  const fadeUpVariants = {
    hidden: { 
      y: 20, 
      opacity: 0 
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  // Right-side platform scale-in configuration
  const rightVisualVariants = {
    hidden: { 
      scale: 0.95, 
      opacity: 0 
    },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 1,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.2
      }
    }
  };

  const handleScrollToSearch = () => {
    const el = document.querySelector('.map-section-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-container">
      {/* Background Visual Spotlights & Overlays (Minimal & Calm) */}
      <div className="hero-spotlight" />
      <div className="hero-grid" />

      {/* Main Content Grid */}
      <div className="hero-content">
        
        {/* Left Column: Staggered Content */}
        <motion.div 
          className="hero-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Small premium badge */}
          <motion.div className="hero-badge" variants={fadeUpVariants}>
            <span className="hero-badge-dot" />
            <span className="hero-badge-text">EZPARK • Operations Console</span>
          </motion.div>

          {/* Large headline */}
          <motion.h1 className="hero-headline" variants={fadeUpVariants}>
            <span className="hero-headline-dim">Reserve Your Space</span>
            <span className="hero-headline-accent">Before You Arrive.</span>
          </motion.h1>

          {/* Short premium subtitle */}
          <motion.p className="hero-subtitle" variants={fadeUpVariants}>
            Experience intelligent organized parking across malls, airports, and universities 
            with real-time multi-floor availability, EV slot monitoring, and AI predictive occupancy analytics.
          </motion.p>

          {/* Single CTA button */}
          <motion.div className="hero-ctas" variants={fadeUpVariants}>
            <motion.button 
              className="btn-primary"
              onClick={handleScrollToSearch}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Explore Platform
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Side: Interactive SaaS Dashboard Visualization */}
        <motion.div 
          className="hero-right"
          variants={rightVisualVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          <div className="abstract-vis-container">
            {/* Header section with live states */}
            <div className="vis-header">
              <div className="vis-title-row">
                <span className="vis-dot" />
                <span className="vis-title">SENSORS ONLINE</span>
              </div>
              <div className="vis-stats-row">
                <div className="vis-stat-item">
                  <span className="vis-stat-label">Occupancy</span>
                  <span className="vis-stat-val">{occupancy}%</span>
                </div>
                <div className="vis-stat-item">
                  <span className="vis-stat-label">Active floor</span>
                  <span className="vis-stat-val">L1</span>
                </div>
              </div>
            </div>

            {/* Live slot status visualization grid */}
            <div className="vis-grid">
              {slots.map(s => (
                <div key={s.id} className={`vis-slot ${s.status}`}>
                  {s.id}
                </div>
              ))}
            </div>

            {/* AI route check wireframe graph */}
            <div className="vis-graph-box">
              <div className="vis-graph-line" />
              <div className="vis-graph-node start" />
              <div className="vis-graph-node end" />
              <div style={{ position: 'absolute', bottom: '0.45rem', left: '10%', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                OPTIMIZING AI GUIDANCE ROUTE...
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
