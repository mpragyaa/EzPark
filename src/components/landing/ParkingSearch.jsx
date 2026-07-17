import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/parking-search.css';

// Sample parking data
const SAMPLE_PARKING_SPOTS = [
  {
    id: 'spot-1',
    name: 'Aether Premium Plaza',
    distance: '0.2 miles away',
    price: 4.50,
    availableSlots: 14,
    hasEVCharging: true,
    securityStatus: '24/7 Patrol & CCTV',
    rating: 4.9,
    vehicleTypes: ['car', 'ev']
  },
  {
    id: 'spot-2',
    name: 'Vortex Cyberport Garage',
    distance: '0.5 miles away',
    price: 6.00,
    availableSlots: 3,
    hasEVCharging: true,
    securityStatus: 'Biometric Entrance',
    rating: 4.8,
    vehicleTypes: ['car', 'ev', 'bike']
  },
  {
    id: 'spot-3',
    name: 'Lumina Smart Hub',
    distance: '0.8 miles away',
    price: 3.50,
    availableSlots: 22,
    hasEVCharging: false,
    securityStatus: 'CCTV Active',
    rating: 4.6,
    vehicleTypes: ['car', 'bike']
  },
  {
    id: 'spot-4',
    name: 'Nexus Underground Vault',
    distance: '1.2 miles away',
    price: 8.00,
    availableSlots: 5,
    hasEVCharging: true,
    securityStatus: 'Armed Guards',
    rating: 5.0,
    vehicleTypes: ['car', 'ev']
  }
];

export default function ParkingSearch() {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(false);

    // Simulate luxury AI scanning delay
    setTimeout(() => {
      // Filter by vehicle type
      const results = SAMPLE_PARKING_SPOTS.filter(spot => 
        spot.vehicleTypes.includes(vehicleType)
      );
      setFilteredResults(results);
      setIsSearching(false);
      setHasSearched(true);
    }, 1200);
  };

  // Stagger container animation
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  // Card slide-up animation
  const cardVariants = {
    hidden: { y: 25, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section className="search-section-container">
      {/* Title Header */}
      <div className="search-section-header">
        <h2 className="search-section-title">Find Parking in Seconds</h2>
        <p className="search-section-subtitle">
          Search nearby parking spaces with real-time availability and AI-powered recommendations.
        </p>
      </div>

      {/* Interactive Grid */}
      <div className="search-section-grid">
        
        {/* Left Column: Form Panel */}
        <form className="search-form-card" onSubmit={handleSearchSubmit}>
          
          {/* Destination */}
          <div className="form-group">
            <label className="form-label">Destination</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Enter destination..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          {/* Date & Time Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Arrival Time</label>
              <input 
                type="time" 
                className="form-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Vehicle Type Row Selector */}
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <div className="vehicle-selector-row">
              <button
                type="button"
                className={`vehicle-btn ${vehicleType === 'car' ? 'active' : ''}`}
                onClick={() => setVehicleType('car')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
                <span>Car</span>
              </button>
              <button
                type="button"
                className={`vehicle-btn ${vehicleType === 'bike' ? 'active' : ''}`}
                onClick={() => setVehicleType('bike')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5.5" cy="17.5" r="2.5" />
                  <circle cx="18.5" cy="17.5" r="2.5" />
                  <path d="M15 6h1a2 2 0 0 1 2 2v2" />
                  <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                </svg>
                <span>Bike</span>
              </button>
              <button
                type="button"
                className={`vehicle-btn ${vehicleType === 'ev' ? 'active' : ''}`}
                onClick={() => setVehicleType('ev')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <path d="M12 7l-3 5h6l-3 5" />
                </svg>
                <span>EV</span>
              </button>
            </div>
          </div>

          {/* Search Action CTA */}
          <motion.button 
            type="submit" 
            className="btn-submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span>Scanning Spaces...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Find Parking</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Right Column: Live Interactive Results Display */}
        <div className="results-container">
          <AnimatePresence mode="wait">
            
            {/* 1. Loading/Scanning State */}
            {isSearching && (
              <motion.div 
                key="scanning"
                className="results-empty-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="empty-state-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'pulse-glow 1.5s infinite alternate' }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="empty-state-text">Querying Satellite Sensors</div>
                <div className="empty-state-desc">
                  Analyzing current occupancy levels and fetching AI recommendations...
                </div>
              </motion.div>
            )}

            {/* 2. Initial Empty State (before search) */}
            {!hasSearched && !isSearching && (
              <motion.div 
                key="empty"
                className="results-empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="empty-state-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="empty-state-text">Enter Destination details</div>
                <div className="empty-state-desc">
                  Your personalized parking spaces dashboard will compile recommendations here.
                </div>
              </motion.div>
            )}

            {/* 3. Search Results State */}
            {hasSearched && !isSearching && (
              <motion.div
                key="results"
                className="results-list"
                variants={listVariants}
                initial="hidden"
                animate="show"
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {filteredResults.length > 0 ? (
                  filteredResults.map((spot) => (
                    <motion.div
                      key={spot.id}
                      className="parking-card"
                      variants={cardVariants}
                      whileHover={{ scale: 1.015 }}
                    >
                      {/* Card Details */}
                      <div className="card-info">
                        <div className="card-title-row">
                          <h3 className="card-title">{spot.name}</h3>
                          <div className="card-rating-container">
                            <span className="rating-star">★</span>
                            <span>{spot.rating}</span>
                          </div>
                        </div>

                        <div className="card-meta-row">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polygon points="12 8 8 12 12 16 16 12 12 8" />
                            </svg>
                            {spot.distance}
                          </span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                            {spot.securityStatus}
                          </span>
                        </div>

                        <div className="card-badges">
                          {spot.hasEVCharging && (
                            <span className="badge badge-ev">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                              EV Ready
                            </span>
                          )}
                          <span className="badge badge-security">Secure Space</span>
                        </div>
                      </div>

                      {/* Card Stats */}
                      <div className="card-stats">
                        <div className="card-price">
                          ${spot.price.toFixed(2)}<span>/hr</span>
                        </div>
                        <div className={`card-slots-count ${spot.availableSlots <= 5 ? 'limited' : ''}`}>
                          {spot.availableSlots} slots left
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="results-empty-state">
                    <div className="empty-state-text">No spaces found</div>
                    <div className="empty-state-desc">
                      Try selecting a different vehicle type or search query to load alternative recommendations.
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Spin Keyframes Injection */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
