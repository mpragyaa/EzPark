import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { profileService } from '../../services/profileService';
import { useToast } from '../../contexts/ToastContext';

export default function VehicleModal({ isOpen, onClose, vehicle, userId, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    vehicle_name: '',
    registration_number: '',
    manufacturer: '',
    color: '',
    vehicle_type: 'Car'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_name: vehicle.vehicle_name || '',
        registration_number: vehicle.registration_number || '',
        manufacturer: vehicle.manufacturer || '',
        color: vehicle.color || '',
        vehicle_type: vehicle.vehicle_type || 'Car'
      });
    } else {
      setFormData({
        vehicle_name: '', registration_number: '', manufacturer: '', color: '', vehicle_type: 'Car'
      });
    }
    setError(null);
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (vehicle) {
        await profileService.updateVehicle(vehicle.id, formData);
        showToast('Vehicle updated successfully', 'success');
      } else {
        await profileService.addVehicle(userId, formData);
        showToast('Vehicle added successfully', 'success');
      }
      onSaveSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save vehicle');
      showToast(err.message || 'Failed to save vehicle', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', 
      justifyContent: 'center', zIndex: 1000
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: '450px',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
        padding: '2rem', position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
          {vehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
        </h3>

        {error && (
          <div style={{ backgroundColor: 'var(--color-error-glow)', color: 'var(--color-error)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Vehicle Type</label>
              <select 
                name="vehicle_type" value={formData.vehicle_type} onChange={handleChange}
                style={{
                  padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none'
                }}
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="EV">EV</option>
                <option value="SUV">SUV</option>
              </select>
            </div>
            
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Registration Number*</label>
              <input 
                type="text" name="registration_number" value={formData.registration_number} onChange={handleChange} required
                placeholder="e.g. MH 12 AB 1234"
                style={{
                  padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Vehicle Nickname</label>
            <input 
              type="text" name="vehicle_name" value={formData.vehicle_name} onChange={handleChange}
              placeholder="e.g. My Daily Driver"
              style={{
                padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Make / Manufacturer</label>
              <input 
                type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange}
                placeholder="e.g. Honda"
                style={{
                  padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Color</label>
              <input 
                type="text" name="color" value={formData.color} onChange={handleChange}
                placeholder="e.g. White"
                style={{
                  padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button" onClick={onClose} disabled={isSubmitting}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '4px', backgroundColor: 'transparent',
                border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '4px', backgroundColor: 'var(--color-primary)',
                border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600,
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Saving...' : (vehicle ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
