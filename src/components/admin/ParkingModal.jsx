import React, { useState, useEffect } from 'react';

export default function ParkingModal({ isOpen, onClose, onSave, lot }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [price, setPrice] = useState(4.00);
  const [hasEV, setHasEV] = useState(false);
  const [hasCCTV, setHasCCTV] = useState(false);
  const [isCovered, setIsCovered] = useState(false);
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('22:00');

  // Load values when editing
  useEffect(() => {
    if (lot) {
      setName(lot.name || '');
      setAddress(lot.address || '');
      setCity(lot.city || '');
      setLatitude(lot.latitude || '');
      setLongitude(lot.longitude || '');
      setCapacity(lot.totalSlots || 50);
      setPrice(lot.pricePerHour || 4.00);
      setHasEV(lot.hasEVCharging || false);
      setHasCCTV(lot.hasCCTV || false);
      setIsCovered(lot.isCovered || false);
      setOpenTime(lot.openTime || '06:00');
      setCloseTime(lot.closeTime || '22:00');
    } else {
      // Reset to defaults
      setName('');
      setAddress('');
      setCity('');
      setLatitude('');
      setLongitude('');
      setCapacity(50);
      setPrice(4.00);
      setHasEV(false);
      setHasCCTV(false);
      setIsCovered(false);
      setOpenTime('06:00');
      setCloseTime('22:00');
    }
  }, [lot, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const compiledLotData = {
      id: lot ? lot.id : `spot-${Date.now()}`,
      name,
      address,
      city,
      latitude: parseFloat(latitude) || 37.7749,
      longitude: parseFloat(longitude) || -122.4194,
      totalSlots: parseInt(capacity) || 50,
      availableSlots: lot ? Math.min(lot.availableSlots, parseInt(capacity)) : parseInt(capacity),
      pricePerHour: parseFloat(price) || 4.00,
      hasEVCharging: hasEV,
      hasCCTV,
      isCovered,
      openTime,
      closeTime,
      isOpen: true
    };

    onSave(compiledLotData);
  };

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-content">
        <h3 className="admin-modal-title">
          {lot ? 'Edit Parking Facility' : 'Add New Parking Facility'}
        </h3>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          {/* Parking Name */}
          <div className="form-group">
            <label className="auth-input-label">Facility Name</label>
            <input
              type="text"
              className="auth-input-field"
              placeholder="e.g. Skyline Mall East Wing Deck"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="auth-input-label">Address</label>
            <input
              type="text"
              className="auth-input-field"
              placeholder="e.g. 101 Orbit Avenue"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          {/* City & Coordinates */}
          <div className="admin-form-grid-3">
            <div className="form-group">
              <label className="auth-input-label">City</label>
              <input
                type="text"
                className="auth-input-field"
                placeholder="e.g. San Francisco"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="auth-input-label">Latitude</label>
              <input
                type="number"
                step="0.0001"
                className="auth-input-field"
                placeholder="37.7749"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="auth-input-label">Longitude</label>
              <input
                type="number"
                step="0.0001"
                className="auth-input-field"
                placeholder="-122.4194"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Capacity & Price */}
          <div className="admin-form-grid-2">
            <div className="form-group">
              <label className="auth-input-label">Capacity (Total Slots)</label>
              <input
                type="number"
                className="auth-input-field"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="auth-input-label">Price per Hour ($)</label>
              <input
                type="number"
                step="0.10"
                className="auth-input-field"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Checkbox Amenities */}
          <div className="admin-checkbox-row">
            <label className="auth-checkbox-container">
              <input
                type="checkbox"
                checked={hasEV}
                onChange={(e) => setHasEV(e.target.checked)}
              />
              <span>EV Charging Station</span>
            </label>
            <label className="auth-checkbox-container">
              <input
                type="checkbox"
                checked={hasCCTV}
                onChange={(e) => setHasCCTV(e.target.checked)}
              />
              <span>CCTV Security Active</span>
            </label>
            <label className="auth-checkbox-container">
              <input
                type="checkbox"
                checked={isCovered}
                onChange={(e) => setIsCovered(e.target.checked)}
              />
              <span>Covered Parking</span>
            </label>
          </div>

          {/* Operational Hours */}
          <div className="admin-form-grid-2">
            <div className="form-group">
              <label className="auth-input-label">Opening Time</label>
              <input
                type="time"
                className="auth-input-field"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="auth-input-label">Closing Time</label>
              <input
                type="time"
                className="auth-input-field"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="admin-modal-actions">
            <button type="button" className="btn-admin-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-admin-save">
              Save Facility
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
