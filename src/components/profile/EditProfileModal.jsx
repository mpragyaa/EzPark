import React, { useState } from 'react';
import { X, Upload, Camera } from 'lucide-react';
import { profileService } from '../../services/profileService';
import { useToast } from '../../contexts/ToastContext';

export default function EditProfileModal({ isOpen, onClose, profile, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Simulate upload - in a real app, you'd upload to Supabase Storage and get a public URL
    // For now, we simulate with a mock or object URL (warning: object URLs don't persist well, but works for offline demo)
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result }));
        showToast('Image attached temporarily. Save to apply.', 'info');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Image upload failed.');
      showToast('Image upload failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await profileService.updateProfile(profile.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        avatar_url: formData.avatar_url
      });
      showToast('Profile updated successfully!', 'success');
      onSaveSuccess();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      showToast('Failed to update profile', 'error');
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
        backgroundColor: 'var(--bg-secondary)', width: '100%', maxWidth: '400px',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
        padding: '2rem', position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Edit Profile</h3>

        {error && (
          <div style={{ backgroundColor: 'var(--color-error-glow)', color: 'var(--color-error)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
             <div style={{
                width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid var(--border-color)'
             }}>
               {formData.avatar_url ? (
                 <img src={formData.avatar_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <Camera size={32} color="var(--text-muted)" />
               )}
             </div>
             <label style={{
               cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 500,
               display: 'flex', alignItems: 'center', gap: '0.4rem'
             }}>
               <Upload size={16} />
               Change Avatar
               <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
             </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Full Name</label>
            <input 
              type="text" 
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              style={{
                padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              style={{
                padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '4px', backgroundColor: 'transparent',
                border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer'
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '4px', backgroundColor: 'var(--color-primary)',
                border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600,
                opacity: isSubmitting ? 0.7 : 1
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
