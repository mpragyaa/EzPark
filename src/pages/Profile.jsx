import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { profileService } from '../services/profileService';

import ProfileCard from '../components/profile/ProfileCard';
import EditProfileModal from '../components/profile/EditProfileModal';
import VehicleCard from '../components/profile/VehicleCard';
import VehicleModal from '../components/profile/VehicleModal';
import FavoritesList from '../components/profile/FavoritesList';
import RecentSearches from '../components/profile/RecentSearches';

export default function Profile() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [vehicleModalState, setVehicleModalState] = useState({ isOpen: false, vehicle: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProfileData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [profileData, vehiclesData] = await Promise.all([
        profileService.getProfile(user.id),
        profileService.getVehicles(user.id)
      ]);
      setProfile(profileData);
      setVehicles(vehiclesData);
    } catch (err) {
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      setIsSubmitting(true);
      await profileService.deleteVehicle(vehicleId);
      showToast('Vehicle deleted successfully', 'success');
      loadProfileData();
    } catch (err) {
      showToast('Failed to delete vehicle', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefaultVehicle = async (vehicleId) => {
    try {
      setIsSubmitting(true);
      await profileService.setDefaultVehicle(user.id, vehicleId);
      showToast('Default vehicle updated', 'success');
      loadProfileData();
    } catch (err) {
      showToast('Failed to set default vehicle', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* ── Profile Section ── */}
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Personal Information</h3>
        <ProfileCard profile={profile} onEdit={() => setIsEditProfileOpen(true)} />
      </div>

      {/* ── Vehicles Section ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>My Vehicles</h3>
          <button
            onClick={() => setVehicleModalState({ isOpen: true, vehicle: null })}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: 'var(--color-primary)', color: '#fff',
              border: 'none', padding: '0.5rem 1rem', borderRadius: '4px',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="dashboard-section-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <p>No vehicles added yet. Add a vehicle for a seamless parking experience.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {vehicles.map(v => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onEdit={(vehicle) => setVehicleModalState({ isOpen: true, vehicle })}
                onDelete={handleDeleteVehicle}
                onSetDefault={handleSetDefaultVehicle}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1rem' }}>
        {/* ── Favorites Section ── */}
        <div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>My Favorites</h3>
          <FavoritesList />
        </div>

        {/* ── Recent Searches Section ── */}
        <div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.25rem' }}>Recent Searches</h3>
          <RecentSearches />
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={profile}
        onSaveSuccess={() => {
          setIsEditProfileOpen(false);
          loadProfileData();
        }}
      />

      <VehicleModal
        isOpen={vehicleModalState.isOpen}
        onClose={() => setVehicleModalState({ isOpen: false, vehicle: null })}
        vehicle={vehicleModalState.vehicle}
        userId={user?.id}
        onSaveSuccess={() => {
          setVehicleModalState({ isOpen: false, vehicle: null });
          loadProfileData();
        }}
      />
    </div>
  );
}
