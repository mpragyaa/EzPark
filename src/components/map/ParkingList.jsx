import React from 'react';
import ParkingCard from './ParkingCard';

export default function ParkingList({
  spots,
  selectedParkingId,
  onCardClick,
  searchQuery,
  onSearchChange,
  priceLimit,
  onPriceChange,
  distanceLimit,
  onDistanceChange,
  selectedVehicle,
  onVehicleChange,
  showAvailableOnly,
  onToggleAvailable
}) {
  return (
    <div className="map-sidebar">
      
      {/* Header title area */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">Nearby Parking</h2>
        <p className="sidebar-subtitle">AI-assisted smart location router</p>
      </div>

      {/* Real-time search input */}
      <div className="search-wrapper">
        <input
          type="text"
          className="search-input-field"
          placeholder="Search location name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Interactive Filters Drawer Box */}
      <div className="filters-panel">
        
        {/* Vehicle Segment Tabs */}
        <div className="filter-row">
          <label className="filter-header-label">Vehicle Compatibility</label>
          <div className="vehicle-selector-row" style={{ marginTop: '0.2rem' }}>
            <button
              type="button"
              className={`vehicle-btn ${selectedVehicle === 'car' ? 'active' : ''}`}
              style={{ padding: '0.45rem', fontSize: '0.75rem' }}
              onClick={() => onVehicleChange(selectedVehicle === 'car' ? 'all' : 'car')}
            >
              <span>Car</span>
            </button>
            <button
              type="button"
              className={`vehicle-btn ${selectedVehicle === 'bike' ? 'active' : ''}`}
              style={{ padding: '0.45rem', fontSize: '0.75rem' }}
              onClick={() => onVehicleChange(selectedVehicle === 'bike' ? 'all' : 'bike')}
            >
              <span>Bike</span>
            </button>
            <button
              type="button"
              className={`vehicle-btn ${selectedVehicle === 'ev' ? 'active' : ''}`}
              style={{ padding: '0.45rem', fontSize: '0.75rem' }}
              onClick={() => onVehicleChange(selectedVehicle === 'ev' ? 'all' : 'ev')}
            >
              <span>EV</span>
            </button>
          </div>
        </div>

        {/* Max Hourly Price Slider */}
        <div className="filter-row">
          <div className="filter-header-label">
            <span>Max Price</span>
            <span className="filter-value-indicator">${priceLimit.toFixed(2)}/hr</span>
          </div>
          <input
            type="range"
            className="filter-slider"
            min="3.00"
            max="8.00"
            step="0.50"
            value={priceLimit}
            onChange={(e) => onPriceChange(Number(e.target.value))}
          />
        </div>

        {/* Max Distance Slider */}
        <div className="filter-row">
          <div className="filter-header-label">
            <span>Max Distance</span>
            <span className="filter-value-indicator">{distanceLimit.toFixed(1)} mi</span>
          </div>
          <input
            type="range"
            className="filter-slider"
            min="0.5"
            max="2.0"
            step="0.1"
            value={distanceLimit}
            onChange={(e) => onDistanceChange(Number(e.target.value))}
          />
        </div>

        {/* Checkbox availability toggles */}
        <label className="filter-toggle-row">
          <span>Available Spaces Only</span>
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={(e) => onToggleAvailable(e.target.checked)}
          />
        </label>

      </div>

      {/* Cards List wrapper */}
      <div className="sidebar-list">
        {spots.length > 0 ? (
          spots.map((spot) => (
            <ParkingCard
              key={spot.id}
              spot={spot}
              isSelected={selectedParkingId === spot.id}
              onClick={() => onCardClick(spot.id)}
            />
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            border: '1px dashed rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            No matching spaces found.
          </div>
        )}
      </div>

    </div>
  );
}
