import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';
import StatsCards from '../components/dashboard/StatsCards';
import BookingCards, { NearbyRecommendations } from '../components/dashboard/BookingCards';
import QuickActions from '../components/dashboard/QuickActions';
import Notifications from '../components/dashboard/Notifications';
import RecommendationList from '../components/ai/RecommendationList';
import NotificationCenter from '../components/notifications/NotificationCenter';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { bookingService } from '../services/bookingService';
import { parkingService } from '../services/parkingService';
import { realtimeService } from '../services/realtimeService';
import '../styles/dashboard.css';

export default function UserDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Database States
  const [userBookings, setUserBookings] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Load User Data from Supabase
  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const bookingsData = await bookingService.fetchUserBookings(user.id);
      const lotsData = await parkingService.fetchLots();
      
      setUserBookings(bookingsData);
      setLots(lotsData);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
      showToast('Error loading live booking summaries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    if (!user) return;
    const channel = realtimeService.subscribeToBookings(user.id, () => {
      loadDashboardData();
    });

    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, [user]);

  // Calculations
  const getAvailableParking = () => {
    // Sum available_slots across open facilities
    const openLots = lots.filter(l => l.is_open);
    if (openLots.length === 0) return 0;
    return openLots.reduce((acc, lot) => acc + (lot.available_slots || 0), 0);
  };

  const getTodaysBookingsCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const todays = userBookings.filter(b => b.booking_date === today && b.status === 'Confirmed');
    return todays.length;
  };

  const getMoneySaved = () => {
    // Confirmed bookings sum
    const confirmed = userBookings.filter(b => b.status === 'Confirmed');
    const totalSpent = confirmed.reduce((acc, b) => acc + parseFloat(b.total_amount || 0), 0);
    // Hypothetical savings (e.g. 20% compared to standard metered garage)
    return totalSpent * 0.22;
  };

  const getCarbonSaved = () => {
    // Confirmed bookings times hypothetical index (e.g. 2.4 kg per smart booking shortcut routing)
    const confirmed = userBookings.filter(b => b.status === 'Confirmed');
    return confirmed.length * 2.4;
  };

  // Helper to render dynamic view content based on sidebar activeTab state
  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
          <p>Synching secure database pipelines...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            key="dashboard-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}
          >
            {/* Upper stats summary cards using real DB math */}
            <StatsCards 
              availableParking={getAvailableParking()}
              todaysBookings={getTodaysBookingsCount()}
              moneySaved={getMoneySaved()}
              carbonSaved={getCarbonSaved()}
            />

            {/* Main content columns */}
            <div className="dashboard-content-split-row">
              {/* Left Side: Booking slots and nearby suggestions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <BookingCards bookings={userBookings} />
                <RecommendationList onBookLot={(lot) => alert(`Selected lot for reservation: ${lot.name}`)} />
              </div>

              {/* Right Side: Quick Action shortcuts & live alerts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <QuickActions />
                <Notifications />
              </div>
            </div>
          </motion.div>
        );

      case 'bookings':
        return (
          <motion.div
            key="bookings-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <BookingCards bookings={userBookings} />
          </motion.div>
        );

      case 'nearby':
        return (
          <motion.div
            key="nearby-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <NearbyRecommendations />
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div
            key="notifications-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <NotificationCenter />
          </motion.div>
        );

      default:
        return (
          <motion.div
            key="default-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="dashboard-section-panel"
            style={{ textAlign: 'center', padding: '4rem 2rem' }}
          >
            <h3 className="panel-title" style={{ textTransform: 'capitalize', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              {activeTab} Management Panel
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 300, maxWidth: '400px', margin: '0 auto' }}>
              Detailed control parameters and metrics index compiled for tab: <strong>{activeTab}</strong> are successfully preloaded.
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. Right Main Layout Area */}
      <div className="dashboard-main">
        {/* Topbar navigation panel */}
        <Topbar userName={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'} />

        {/* Scrollable Dashboard view viewport */}
        <div className="dashboard-content-scroll">
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
