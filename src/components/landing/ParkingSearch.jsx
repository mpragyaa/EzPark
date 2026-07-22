import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parkingService } from '../../services/parkingService';
import '../../styles/parking-search.css';

export default function ParkingSearch() {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [rawParkingLots, setRawParkingLots] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);

  // Fetch parking facilities from Supabase on mount
  useEffect(() => {
    const loadLots = async () => {
      try {
        const data = await parkingService.fetchLots();
        // Add dynamic mock distance since it's computed relative to client search
        const mappedData = data.map((lot, idx) => ({
          ...lot,
          distance: `${(0.2 + idx * 0.3).toFixed(1)} miles away`
        }));
        setRawParkingLots(mappedData);
      } catch (err) {
        console.error('Error fetching Supabase facilities:', err);
      }
    };
    loadLots();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(false);

    setTimeout(() => {
      // Filter the live database records by vehicle type
      const results = rawParkingLots.filter(spot => {
        if (vehicleType === 'ev') return spot.has_ev_charging;
        return true; // Match standard cars / bikes
      });

      setFilteredResults(results);
      setIsSearching(false);
      setHasSearched(true);
    }, 1200);
  };

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

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
        <h2 className="search-section-title">Find Organized Parking Facilities</h2>
        <p className="search-section-subtitle">
          Search nearby facilities with real-time floor availability and AI occupancy predictions.
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
              placeholder="Mall, Airport, Hospital, Event..."
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
                key="car"
                type="button"
                className={`vehicle-btn ${vehicleType === 'car' ? 'active' : ''}`}
                onClick={() => setVehicleType('car')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
                <span>Car</span>
              </button>
              <button
                key="bike"
                type="button"
                className={`vehicle-btn ${vehicleType === 'bike' ? 'active' : ''}`}
                onClick={() => setVehicleType('bike')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="5.5" cy="17.5" r="2.5" />
                  <circle cx="18.5" cy="17.5" r="2.5" />
                  <path d="M15 6h1a2 2 0 0 1 2 2v2" />
                  <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                </svg>
                <span>Bike</span>
              </button>
              <button
                key="ev"
                type="button"
                className={`vehicle-btn ${vehicleType === 'ev' ? 'active' : ''}`}
                onClick={() => setVehicleType('ev')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <span>Scanning Facilities...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search Facilities</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Right Column: Live Interactive Results Display */}
        <div className="results-container">
          <AnimatePresence mode="wait">
            
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
                <div className="empty-state-text">Querying Facility Occupancies</div>
                <div className="empty-state-desc">
                  Analyzing current occupancy levels and fetching AI recommendations...
                </div>
              </motion.div>
            )}

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
                  Your personalized parking facilities dashboard will compile recommendations here.
                </div>
              </motion.div>
            )}

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
                      <div className="card-info">
                        <div className="card-title-row">
                          <h3 className="card-title">{spot.name}</h3>
                          <div className="card-rating-container">
                            <span className="rating-star">★</span>
                            <span>4.8</span>
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
                            {spot.has_cctv ? 'CCTV Active' : 'Patrolled'}
                          </span>
                        </div>

                        <div className="card-badges">
                          {spot.has_ev_charging && (
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

                      <div className="card-stats">
                        <div className="card-price">
                          ${parseFloat(spot.price_per_hour).toFixed(2)}<span>/hr</span>
                        </div>
                        <div className={`card-slots-count ${spot.available_slots <= 5 ? 'limited' : ''}`}>
                          {spot.available_slots} spaces left
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="results-empty-state">
                    <div className="empty-state-text">No facilities found</div>
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
