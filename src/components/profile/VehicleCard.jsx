import React from 'react';
import { Car, Bike, Zap, Truck, Edit2, Trash2, CheckCircle } from 'lucide-react';

export default function VehicleCard({ vehicle, onEdit, onDelete, onSetDefault, isSubmitting }) {
  
  const getVehicleIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'bike': return <Bike size={24} color="var(--color-primary)" />;
      case 'ev': return <Zap size={24} color="#10b981" />;
      case 'suv': return <Truck size={24} color="var(--color-primary)" />;
      case 'car':
      default: return <Car size={24} color="var(--color-primary)" />;
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      border: vehicle.is_default ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '1.5rem',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {vehicle.is_default && (
        <div style={{
          position: 'absolute', top: '-10px', right: '15px',
          backgroundColor: 'var(--color-primary)', color: '#fff',
          padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '0.3rem'
        }}>
          <CheckCircle size={12} /> Default
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '50px', height: '50px', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {getVehicleIcon(vehicle.vehicle_type)}
        </div>
        <div>
          <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
            {vehicle.vehicle_name || 'My Vehicle'}
          </h4>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {vehicle.manufacturer || 'Unknown Make'} • {vehicle.color || 'Unknown Color'}
          </span>
        </div>
      </div>

      <div style={{
        backgroundColor: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '4px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Reg No.</span>
        <strong style={{ color: 'var(--text-primary)', letterSpacing: '1px' }}>{vehicle.registration_number}</strong>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        {!vehicle.is_default && (
          <button
            onClick={() => onSetDefault(vehicle.id)}
            disabled={isSubmitting}
            style={{
              flex: 1, padding: '0.5rem', backgroundColor: 'transparent',
              border: '1px solid var(--color-primary)', color: 'var(--color-primary)',
              borderRadius: '4px', cursor: 'pointer', fontWeight: 600,
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            Set Default
          </button>
        )}
        
        <button
          onClick={() => onEdit(vehicle)}
          disabled={isSubmitting}
          style={{
            flex: vehicle.is_default ? 1 : 'none',
            padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)',
            border: 'none', color: 'var(--text-primary)',
            borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          aria-label="Edit Vehicle"
        >
          <Edit2 size={16} />
        </button>
        
        <button
          onClick={() => {
            if (window.confirm('Delete this vehicle?')) onDelete(vehicle.id);
          }}
          disabled={isSubmitting}
          style={{
            padding: '0.5rem', backgroundColor: 'var(--color-error-glow)',
            border: 'none', color: 'var(--color-error)',
            borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          aria-label="Delete Vehicle"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
