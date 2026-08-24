import React from 'react';
import ParkingCard from './ParkingCard';
import PlacesSearch from './PlacesSearch';
import { SEARCH_RADII_KM } from '../../services/parkingSearchService';
import { useBooking } from '../../contexts/BookingContext';

export default function ParkingList({
  spots,
  selectedParkingId,
  onCardClick,
  searchQuery,
  onSearchChange,
  onLocationSelect,
  priceLimit,
  onPriceChange,
  selectedVehicle,
  onVehicleChange,
  showAvailableOnly,
  onToggleAvailable,
  // Proximity props
  selectedLocation,
  searchRadius,
  onRadiusChange,
  // Favorites props
  favorites = [],
  onToggleFavorite,
}) {
  const {
    date,
    setDate,
    time,
    setTime,
    duration,
    setDuration,
  } = useBooking();
  // ── Derived state for empty-state message ─────────────────────────────────
  const emptyMessage = selectedLocation
    ? `No parking facilities found within ${searchRadius} km of "${selectedLocation.label}".`
    : 'No matching facilities found.';

  return (
    <div className="map-sidebar">

      {/* Header */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">Nearby Facilities</h2>
        <p className="sidebar-subtitle">AI-assisted smart location router</p>
      </div>

      {/* Location + facility search with autocomplete */}
      <PlacesSearch
        value={searchQuery}
        onChange={onSearchChange}
        onLocationSelect={onLocationSelect}
        placeholder="Search location or facility…"
      />

      {/* Proximity context: shown after a location is selected */}
      {selectedLocation && (
        <div className="proximity-context">
          <span className="proximity-icon">📍</span>
          <span className="proximity-label" title={selectedLocation.label}>
            {selectedLocation.label}
          </span>
          <span className="proximity-count">
            {spots.length} {spots.length === 1 ? 'facility' : 'facilities'}
          </span>
        </div>
      )}

      {/* Interactive Filters Drawer */}
      <div className="filters-panel">

        {/* Date & Time Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="filter-header-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label className="filter-header-label">Arrival Time</label>
            <input
              type="time"
              className="form-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
          </div>
        </div>

        {/* Estimated Duration Slider */}
        <div className="filter-row">
          <div className="filter-header-label">
            <span>Duration</span>
            <span className="filter-value-indicator">{duration} {duration === 1 ? 'hour' : 'hours'}</span>
          </div>
          <input
            type="range"
            className="filter-slider"
            min="1"
            max="12"
            step="1"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>

        {/* Search Radius — only shown when a location is selected */}
        {selectedLocation && (
          <div className="filter-row">
            <div className="filter-header-label">
              <span>Search Radius</span>
              <span className="filter-value-indicator">{searchRadius} km</span>
            </div>
            <div className="radius-btn-row">
              {SEARCH_RADII_KM.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`radius-btn${searchRadius === r ? ' active' : ''}`}
                  onClick={() => onRadiusChange(r)}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>
        )}

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
            <span className="filter-value-indicator">₹{priceLimit}/hr</span>
          </div>
          <input
            type="range"
            className="filter-slider"
            min="10"
            max="200"
            step="10"
            value={priceLimit}
            onChange={(e) => onPriceChange(Number(e.target.value))}
          />
        </div>

        {/* Checkbox availability toggle */}
        <label className="filter-toggle-row">
          <span>Available Spaces Only</span>
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={(e) => onToggleAvailable(e.target.checked)}
          />
        </label>

      </div>

      {/* Cards List */}
      <div className="sidebar-list">
        {spots.length > 0 ? (
          spots.map((spot) => (
            <ParkingCard
              key={spot.id}
              spot={spot}
              isSelected={selectedParkingId === spot.id}
              onClick={() => onCardClick(spot.id)}
              showDistance={Boolean(selectedLocation)}
              isFavorite={favorites.includes(spot.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        ) : (
          <div className="sidebar-empty-state">
            <span className="sidebar-empty-icon">🅿️</span>
            <p className="sidebar-empty-msg">{emptyMessage}</p>
          </div>
        )}
      </div>

    </div>
  );
}
