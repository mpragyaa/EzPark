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
import Profile from './Profile';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { bookingService } from '../services/bookingService';
import { parkingService } from '../services/parkingService';
import { realtimeService } from '../services/realtimeService';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../contexts/BookingContext';
import { mockParkingFacilities } from '../data/mockParkingFacilities';
import { favoritesService } from '../services/favoritesService';
import '../styles/dashboard.css';

export default function UserDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { setSelectedFacility, setSelectedLocation } = useBooking();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Database States
  const [userBookings, setUserBookings] = useState([]);
  const [lots, setLots] = useState([]);
  const [favoriteLots, setFavoriteLots] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Load User Data with Fallback
  const loadDashboardData = async () => {
    const userId = user?.id || 'demo-user';
    try {
      setLoading(true);
      const bookingsData = await bookingService.fetchUserBookings(userId);
      
      let lotsData = [];
      try {
        lotsData = await parkingService.fetchLots();
      } catch (lotsErr) {
        console.warn('[UserDashboard] DB fetchLots failed, using mock data:', lotsErr);
        lotsData = mockParkingFacilities;
      }
      
      // Join/map facility details for local storage bookings
      const processedBookings = bookingsData.map((b) => {
        if (!b.parking_facilities) {
          const facility = lotsData.find((l) => l.id === b.facility_id);
          return {
            ...b,
            parking_facilities: {
              name: facility ? facility.name : 'Demo Facility',
              address: facility ? facility.address : 'Nearby Center',
            },
          };
        }
        return b;
      });

      // Query user favorites
      let favIds = [];
      try {
        const favs = await favoritesService.getFavorites(userId);
        favIds = favs.map(f => f.parking_id);
      } catch (favErr) {
        console.error(favErr);
      }

      const favLots = lotsData.filter(lot => favIds.includes(lot.id)).map(lot => ({
        id: lot.id,
        name: lot.name,
        address: lot.address ?? '',
        city: lot.city ?? '',
        latitude: lot.latitude,
        longitude: lot.longitude,
        totalSlots: lot.total_slots ?? 100,
        availableSlots: bookingService.getLocalFacilityAvailableSlots(lot.id, lot.available_slots),
        pricePerHour: parseFloat(lot.price_per_hour ?? 30),
        rating: lot.rating ?? null,
        hasEVCharging: lot.has_ev_charging ?? false,
        hasCCTV: lot.has_cctv ?? true,
        isCovered: lot.is_covered ?? false,
        isOpen: lot.is_open ?? true,
        distanceKm: 0,
        distance: 0,
        vehicleTypes: lot.has_ev_charging ? ['car', 'ev'] : ['car', 'bike']
      }));

      // Query recent searches from localStorage
      let recents = [];
      try {
        const data = localStorage.getItem('ezpark_recent_searches');
        recents = data ? JSON.parse(data) : [];
      } catch (recErr) {
        console.error(recErr);
      }

      setUserBookings(processedBookings);
      setLots(lotsData);
      setFavoriteLots(favLots);
      setRecentSearches(recents);
    } catch (err) {
      console.error('Error fetching dashboard records:', err);
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
                <BookingCards bookings={userBookings} onCancelSuccess={loadDashboardData} />
                
                {/* ── Dashboard Favorites Panel ── */}
                {favoriteLots.length > 0 && (
                  <div className="dashboard-section-panel">
                    <div className="panel-header">
                      <h3 className="panel-title">⭐ Saved Favorites</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.85rem' }}>
                      {favoriteLots.map((spot) => (
                        <div key={spot.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.85rem 1rem',
                          textAlign: 'left'
                        }}>
                          <div style={{ minWidth: 0, flex: 1, paddingRight: '1rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {spot.name}
                            </h4>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                              {spot.address}, {spot.city}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFacility(spot);
                              navigate('/');
                            }}
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              borderRadius: '4px',
                              padding: '0.35rem 0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Book Space
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Dashboard Recent Searches Panel ── */}
                {recentSearches.length > 0 && (
                  <div className="dashboard-section-panel">
                    <div className="panel-header">
                      <h3 className="panel-title">📍 Recent Searches</h3>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem', marginTop: '0.85rem' }}>
                      {recentSearches.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedLocation({ lat: item.lat, lng: item.lng, label: item.label });
                            navigate('/');
                          }}
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          🔍 {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <RecommendationList
                  onBookLot={(lot) => {
                    const normalSpot = {
                      id: lot.id,
                      name: lot.name,
                      address: lot.address ?? '',
                      city: lot.city ?? '',
                      latitude: lot.latitude,
                      longitude: lot.longitude,
                      totalSlots: lot.total_slots ?? lot.totalSlots ?? 100,
                      availableSlots: lot.available_slots ?? lot.availableSlots ?? 10,
                      pricePerHour: parseFloat(lot.price_per_hour ?? lot.pricePerHour ?? 30),
                      rating: lot.rating ?? null,
                      hasEVCharging: lot.has_ev_charging ?? lot.hasEVCharging ?? false,
                      hasCCTV: lot.has_cctv ?? lot.hasCCTV ?? true,
                      isCovered: lot.is_covered ?? lot.isCovered ?? false,
                      isOpen: lot.is_open ?? lot.isOpen ?? true,
                      distanceKm: 0,
                      distance: 0,
                      vehicleTypes: (lot.has_ev_charging ?? lot.hasEVCharging) ? ['car', 'ev'] : ['car', 'bike']
                    };
                    setSelectedFacility(normalSpot);
                    navigate('/');
                  }}
                />
              </div>

              {/* Right Side: Quick Action shortcuts & live alerts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 <QuickActions onTabChange={setActiveTab} />
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
            <BookingCards bookings={userBookings} onCancelSuccess={loadDashboardData} />
          </motion.div>
        );

      case 'payments':
        return (
          <motion.div
            key="payments-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <div className="dashboard-section-panel">
              <div className="panel-header">
                <h3 className="panel-title">Transactions & Receipts</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.85rem' }}>
                {userBookings.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    No transactions found.
                  </div>
                ) : (
                  userBookings.map((b) => {
                    const isCancelled = b.status === 'Cancelled';
                    const amountPaid = parseFloat(b.total_amount || 0);
                    const paymentId = `PAY-${b.id.substring(0, 8).toUpperCase()}`;

                    const handlePrintReceipt = () => {
                      const printWindow = window.open('', '_blank');
                      const receiptHTML = `
                        <html>
                          <head>
                            <title>Receipt - ${paymentId}</title>
                            <style>
                              body { font-family: sans-serif; padding: 2rem; color: #111; }
                              .invoice-box { max-width: 450px; margin: auto; border: 1px solid #eee; padding: 1.5rem; border-radius: 6px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
                              h2 { text-align: center; color: #3b82f6; margin-bottom: 0.5rem; }
                              p { margin: 0.25rem 0; font-size: 0.85rem; color: #444; }
                              table { width: 100%; border-collapse: collapse; margin-top: 1.25rem; }
                              td { padding: 0.5rem 0; font-size: 0.85rem; border-bottom: 1px dashed #eee; }
                              .total-row { font-weight: bold; border-top: 2px solid #3b82f6; }
                              .qr-placeholder { text-align: center; margin: 1.5rem 0; }
                            </style>
                          </head>
                          <body>
                            <div class="invoice-box">
                              <h2>EZPARK RECEIPT</h2>
                              <p style="text-align: center; font-size: 0.75rem; color: #777;">Thank you for parking with EzPark!</p>
                              <hr style="border: none; border-top: 1px solid #eee; margin: 1rem 0;" />
                              <p><strong>Payment ID:</strong> ${paymentId}</p>
                              <p><strong>Booking Ref:</strong> ${b.id.substring(0, 8).toUpperCase()}</p>
                              <p><strong>Date:</strong> ${new Date(b.created_at || Date.now()).toLocaleDateString()}</p>
                              <hr style="border: none; border-top: 1px solid #eee; margin: 1rem 0;" />
                              <table>
                                <tr>
                                  <td>Parking Facility</td>
                                  <td style="text-align: right;"><strong>${b.parking_facilities?.name || 'EZPARK Facility'}</strong></td>
                                </tr>
                                <tr>
                                  <td>Vehicle Type</td>
                                  <td style="text-align: right;">${b.vehicle_type?.toUpperCase()}</td>
                                </tr>
                                <tr>
                                  <td>Booking Date</td>
                                  <td style="text-align: right;">${b.booking_date}</td>
                                </tr>
                                <tr>
                                  <td>Arrival Window</td>
                                  <td style="text-align: right;">${b.entry_time} - ${b.exit_time}</td>
                                </tr>
                                <tr>
                                  <td>Billing Status</td>
                                  <td style="text-align: right; color: ${isCancelled ? '#ef4444' : '#10b981'};"><strong>${isCancelled ? 'Refunded' : 'Paid'}</strong></td>
                                </tr>
                                <tr class="total-row">
                                  <td>Total Amount</td>
                                  <td style="text-align: right; color: #10b981; font-size: 1.05rem;">₹${amountPaid.toFixed(2)}</td>
                                </tr>
                              </table>
                              <div class="qr-placeholder">
                                <svg width="100" height="100" viewBox="0 0 100 100" style="margin: auto;">
                                  <rect x="5" y="5" width="20" height="20" rx="2" stroke="#000" stroke-width="4" fill="none" />
                                  <rect x="5" y="75" width="20" height="20" rx="2" stroke="#000" stroke-width="4" fill="none" />
                                  <rect x="75" y="5" width="20" height="20" rx="2" stroke="#000" stroke-width="4" fill="none" />
                                  <path d="M35 10 h10 v5 h-10 z M40 20 h5 v10 h-5 z M10 35 h10 v5 h-10 z M15 45 h20 v5 h-20 z M55 35 h10 v5 h-10 z M40 55 h10 v15 h-10 z M55 55 h20 v5 h-20 z M70 75 h15 v10 h-15 z" fill="#000" />
                                </svg>
                                <p style="font-size: 0.7rem; color: #777; margin-top: 0.5rem;">Scan pass at facility gate barrier</p>
                              </div>
                              <button onclick="window.print()" style="width:100%; padding:0.5rem; font-weight:bold; background:#3b82f6; color:#fff; border:none; border-radius:4px; cursor:pointer;">
                                Print Invoice / PDF
                              </button>
                            </div>
                          </body>
                        </html>
                      `;
                      printWindow.document.write(receiptHTML);
                      printWindow.document.close();
                    };

                    return (
                      <div key={b.id} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '1rem',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 750, color: 'var(--text-primary)' }}>
                              {b.parking_facilities?.name || 'EZPARK Facility'}
                            </h4>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.15rem' }}>
                              Tx ID: {paymentId}
                            </span>
                          </div>
                          <span style={{
                            backgroundColor: isCancelled ? 'var(--color-error-glow)' : 'var(--color-success-glow)',
                            color: isCancelled ? 'var(--color-error)' : 'var(--color-success)',
                            padding: '0.15rem 0.45rem',
                            fontSize: '0.65rem',
                            fontWeight: 750,
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {isCancelled ? 'Refunded' : 'Success'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '0.55rem' }}>
                          <div>
                            Method: <strong style={{ color: 'var(--text-primary)' }}>Simulated Gate</strong>
                          </div>
                          <div>
                            Amount: <strong style={{ color: 'var(--color-success)' }}>₹{amountPaid.toFixed(2)}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '0.55rem' }}>
                          <button
                            type="button"
                            onClick={handlePrintReceipt}
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 650,
                              color: 'var(--color-primary)',
                              backgroundColor: 'var(--color-primary-glow)',
                              border: '1px solid rgba(59,130,246,0.2)',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Print Receipt
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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

      case 'profile':
        return (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <Profile />
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
