import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/admin/Sidebar';
import Topbar from '../components/admin/Topbar';
import Stats from '../components/admin/Stats';
import ParkingTable from '../components/admin/ParkingTable';
import ParkingModal from '../components/admin/ParkingModal';
import BookingsTable from '../components/admin/BookingsTable';
import UsersTable from '../components/admin/UsersTable';
import HealthStatus from '../components/monitoring/HealthStatus';
import SystemAnalytics from '../components/analytics/SystemAnalytics';
import ActivityLogs from '../components/admin/ActivityLogs';
import NotificationCenter from '../components/notifications/NotificationCenter';
import { parkingService } from '../services/parkingService';
import { bookingService } from '../services/bookingService';
import { userService } from '../services/userService';
import { activityService } from '../services/activityService';
import { realtimeService } from '../services/realtimeService';
import { useToast } from '../contexts/ToastContext';
import { exportToCSV } from '../utils/csvExport';
import '../styles/admin.css';

export default function AdminDashboard() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Database States
  const [lots, setLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global search & filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLotForEdit, setSelectedLotForEdit] = useState(null);

  // Fetch admin directory lists from Supabase
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const lotsData = await parkingService.fetchLots();
      const bookingsData = await bookingService.fetchAllBookings();
      const usersData = await userService.fetchUsers();
      
      // Adapt lots schema fields (snake_case to camelCase)
      const adaptedLots = lotsData.map(lot => ({
        id: lot.id,
        name: lot.name,
        address: lot.address,
        city: lot.city,
        latitude: lot.latitude,
        longitude: lot.longitude,
        totalSlots: lot.total_slots,
        availableSlots: lot.available_slots,
        pricePerHour: parseFloat(lot.price_per_hour),
        hasEVCharging: lot.has_ev_charging,
        hasCCTV: lot.has_cctv,
        isCovered: lot.is_covered,
        openTime: lot.open_time,
        closeTime: lot.close_time,
        isOpen: lot.is_open,
        isActive: lot.is_active,
        isVerified: lot.is_verified,
        googleMapsUrl: lot.google_maps_url
      }));
      setLots(adaptedLots);

      // Map bookings log list
      const adaptedBookings = bookingsData.map(b => ({
        id: b.id,
        customerName: `${b.users?.first_name || ''} ${b.users?.last_name || ''}`.trim() || 'User',
        parkingLot: b.parking_facilities?.name || 'EZPARK Facility',
        vehicleType: b.vehicle_type,
        date: b.booking_date,
        time: `${b.entry_time} - ${b.exit_time}`,
        status: b.status,
        paymentStatus: b.status === 'Confirmed' ? 'Paid' : 'Refunded',
        amount: parseFloat(b.total_amount || 0),
        slot_id: b.slot_id
      }));
      setBookings(adaptedBookings);

      // Map users customer list
      const adaptedUsers = usersData.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone_number || '+1 (555) 000-0000',
        bookingsCount: u.bookingsCount || 0,
        status: u.role === 'admin' ? 'Admin' : 'Active'
      }));
      setUsers(adaptedUsers);

    } catch (err) {
      console.error('Error fetching admin database pipelines:', err);
      showToast('Error syncing system console logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();

    // Subscribe to all booking alterations in realtime
    const channel = realtimeService.subscribeToBookings(null, () => {
      loadAdminData();
    });

    return () => {
      realtimeService.unsubscribe(channel);
    };
  }, []);

  // --- Parking Operations ---
  const handleOpenAddModal = () => {
    setSelectedLotForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lot) => {
    setSelectedLotForEdit(lot);
    setIsModalOpen(true);
  };

  const handleSaveLot = async (savedLot) => {
    // Adapt lot state back to database snake_case keys
    const dbLotData = {
      name: savedLot.name,
      address: savedLot.address,
      city: savedLot.city,
      latitude: savedLot.latitude,
      longitude: savedLot.longitude,
      total_slots: savedLot.totalSlots,
      available_slots: savedLot.availableSlots,
      price_per_hour: savedLot.pricePerHour,
      has_ev_charging: savedLot.hasEVCharging,
      has_cctv: savedLot.hasCCTV,
      is_covered: savedLot.isCovered,
      open_time: savedLot.openTime,
      close_time: savedLot.closeTime,
      is_open: savedLot.isOpen,
      is_active: savedLot.isActive,
      is_verified: savedLot.isVerified,
      google_maps_url: savedLot.googleMapsUrl
    };

    try {
      if (selectedLotForEdit) {
        // Edit mode
        await parkingService.updateLot(savedLot.id, dbLotData);
        await activityService.logActivity(
          'Admin Operator',
          'Updated Pricing',
          savedLot.name,
          `$${selectedLotForEdit.pricePerHour}/hr`,
          `$${savedLot.pricePerHour}/hr`
        );
        showToast('Facility details updated.', 'success');
      } else {
        // Add mode
        await parkingService.createLot(dbLotData);
        await activityService.logActivity(
          'Admin Operator',
          'Created Parking Lot',
          savedLot.name,
          null,
          `Capacity: ${savedLot.totalSlots} slots, Price: $${savedLot.pricePerHour}/hr`
        );
        showToast('New facility registered successfully.', 'success');
      }
      setIsModalOpen(false);
      loadAdminData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save parking facility data.', 'error');
    }
  };

  const handleDeleteLot = async (id) => {
    const target = lots.find(item => item.id === id);
    if (!target) return;

    if (window.confirm('Are you sure you want to remove this parking facility from database?')) {
      try {
        await parkingService.deleteLot(id);
        await activityService.logActivity(
          'Admin Operator',
          'Deleted Parking Lot',
          target.name,
          `Capacity: ${target.totalSlots}`,
          null
        );
        showToast('Facility deleted.', 'success');
        loadAdminData();
      } catch (err) {
        console.error(err);
        showToast('Failed to delete parking lot.', 'error');
      }
    }
  };

  const handleViewLot = (lot) => {
    alert(`Facility Details:\n\nName: ${lot.name}\nCity: ${lot.city}\nAddress: ${lot.address}\nCapacity: ${lot.totalSlots} spaces\nPrice: $${lot.pricePerHour}/hr`);
  };

  // --- Booking Operations ---
  const handleViewBooking = (booking) => {
    alert(`Receipt Pass Details:\n\nID: ${booking.id}\nCustomer: ${booking.customerName}\nLot: ${booking.parkingLot}\nDate: ${booking.date}\nTime: ${booking.time}\nAmount Paid: $${booking.amount.toFixed(2)}`);
  };

  const handleCancelBooking = async (id) => {
    const target = bookings.find(b => b.id === id);
    if (!target) return;
    
    if (window.confirm('Are you sure you want to cancel this booking and release the space?')) {
      try {
        await bookingService.cancelBooking(id, target.slot_id);
        await activityService.logActivity(
          'Admin Operator',
          'Deleted Booking',
          `Booking ID: ${id}`,
          'Status: Confirmed',
          'Status: Cancelled'
        );
        showToast('Booking cancelled & slot released.', 'success');
        loadAdminData();
      } catch (err) {
        console.error(err);
        showToast('Error cancelling booking.', 'error');
      }
    }
  };

  // --- User Operations ---
  const handleToggleUserStatus = async (id) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    
    const targetNextRole = target.status === 'Admin' ? 'user' : 'admin';
    if (window.confirm(`Update role status of customer ${target.name} to: ${targetNextRole}?`)) {
      try {
        await userService.updateUserRole(id, targetNextRole);
        await activityService.logActivity(
          'Admin Operator',
          'Updated User Role',
          `User: ${target.name}`,
          `Role: ${target.status === 'Admin' ? 'admin' : 'user'}`,
          `Role: ${targetNextRole}`
        );
        showToast('User status modified successfully.', 'success');
        loadAdminData();
      } catch (err) {
        console.error(err);
        showToast('Error changing user role.', 'error');
      }
    }
  };

  const handleDeleteUser = async (id) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    if (window.confirm('Are you sure you want to delete this customer account profile?')) {
      try {
        await userService.deleteUser(id);
        await activityService.logActivity(
          'Admin Operator',
          'Deleted User Profile',
          target.name,
          `Email: ${target.email}`,
          null
        );
        showToast('User profile removed from system.', 'success');
        loadAdminData();
      } catch (err) {
        console.error(err);
        showToast('Error removing user account.', 'error');
      }
    }
  };

  // --- Stats Calculations ---
  const getStatsMetrics = () => {
    const totalLots = lots.length;
    const availableSlots = lots.reduce((acc, l) => acc + l.availableSlots, 0);
    const capacityTotal = lots.reduce((acc, l) => acc + l.totalSlots, 0);
    const activeUsersCount = users.filter(u => u.status === 'Active' || u.status === 'Admin').length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayBookingsArr = bookings.filter(b => b.date === today);
    const todayRevenue = todayBookingsArr.filter(b => b.status === 'Confirmed').reduce((acc, b) => acc + b.amount, 0);
    
    const occupiedSlots = capacityTotal - availableSlots;
    const occupancyPercent = capacityTotal > 0 ? (occupiedSlots / capacityTotal) * 100 : 0;

    return {
      totalLots,
      availableSlots,
      todayRevenue,
      todayBookings: todayBookingsArr.length,
      activeUsers: activeUsersCount,
      occupancyPercent
    };
  };

  // --- Filtering computations ---
  const getFilteredLots = () => {
    return lots.filter((lot) => {
      const matchesSearch = lot.name.toLowerCase().includes(searchQuery.toLowerCase()) || lot.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = cityFilter === 'All' || lot.city === cityFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Open' ? lot.isOpen : !lot.isOpen);
      return matchesSearch && matchesCity && matchesStatus;
    });
  };

  const getFilteredBookings = () => {
    return bookings.filter((b) => {
      const matchesSearch = b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || b.parkingLot.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const getFilteredUsers = () => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  // Render sub-tabs content
  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
          <p>Syncing secure console pipelines...</p>
        </div>
      );
    }

    const metrics = getStatsMetrics();

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div
            key="admin-dashboard-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
          >
            <Stats 
              totalLots={metrics.totalLots}
              availableSlots={metrics.availableSlots}
              todayRevenue={metrics.todayRevenue}
              todayBookings={metrics.todayBookings}
              activeUsers={metrics.activeUsers}
              occupancyPercent={metrics.occupancyPercent}
            />
            <ParkingTable
              lots={getFilteredLots().slice(0, 3)}
              onAddClick={handleOpenAddModal}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteLot}
              onView={handleViewLot}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <BookingsTable
                bookings={bookings.slice(0, 2)}
                onView={handleViewBooking}
                onCancel={handleCancelBooking}
              />
              <UsersTable
                users={users.slice(0, 2)}
                onToggleStatus={handleToggleUserStatus}
                onDelete={handleDeleteUser}
              />
            </div>
          </motion.div>
        );

      case 'parking-lots':
        return (
          <motion.div
            key="admin-parking-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="table-panel-header">
              <div className="table-filters-row">
                <input
                  type="text"
                  className="topbar-search-input"
                  style={{ width: '220px', backgroundColor: 'var(--bg-secondary)' }}
                  placeholder="Search facility by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                  className="admin-select-filter"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                >
                  <option value="All">All Cities</option>
                  <option value="San Francisco">San Francisco</option>
                  <option value="Los Angeles">Los Angeles</option>
                </select>
                <select 
                  className="admin-select-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
                <button
                  type="button"
                  className="btn-add-entity"
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  onClick={() => exportToCSV(lots, 'facilities_list')}
                >
                  Export CSV
                </button>
              </div>
            </div>
            <ParkingTable
              lots={getFilteredLots()}
              onAddClick={handleOpenAddModal}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteLot}
              onView={handleViewLot}
            />
          </motion.div>
        );

      case 'bookings':
        return (
          <motion.div
            key="admin-bookings-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="table-panel-header">
              <div className="table-filters-row">
                <input
                  type="text"
                  className="topbar-search-input"
                  style={{ width: '220px', backgroundColor: 'var(--bg-secondary)' }}
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                  className="admin-select-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <button
                  type="button"
                  className="btn-add-entity"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => exportToCSV(getFilteredBookings(), 'bookings_list')}
                >
                  Export CSV
                </button>
              </div>
            </div>
            <BookingsTable
              bookings={getFilteredBookings()}
              onView={handleViewBooking}
              onCancel={handleCancelBooking}
            />
          </motion.div>
        );

      case 'users':
        return (
          <motion.div
            key="admin-users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="table-panel-header">
              <div className="table-filters-row">
                <input
                  type="text"
                  className="topbar-search-input"
                  style={{ width: '220px', backgroundColor: 'var(--bg-secondary)' }}
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select 
                  className="admin-select-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <button
                  type="button"
                  className="btn-add-entity"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                  onClick={() => exportToCSV(getFilteredUsers(), 'users_list')}
                >
                  Export CSV
                </button>
              </div>
            </div>
            <UsersTable
              users={getFilteredUsers()}
              onToggleStatus={handleToggleUserStatus}
              onDelete={handleDeleteUser}
            />
          </motion.div>
        );

      case 'revenue':
      case 'analytics':
        return (
          <motion.div
            key="admin-analytics-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <SystemAnalytics />
          </motion.div>
        );

      case 'activity-logs':
        return (
          <motion.div
            key="admin-activity-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ActivityLogs />
          </motion.div>
        );

      case 'system-health':
        return (
          <motion.div
            key="admin-health-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <HealthStatus />
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div
            key="admin-notif-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <NotificationCenter />
          </motion.div>
        );

      default:
        return (
          <motion.div
            key="admin-default-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="admin-table-container"
            style={{ textAlign: 'center', padding: '4rem 2rem' }}
          >
            <h3 className="panel-title" style={{ textTransform: 'capitalize', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Operator Tab: {activeTab}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>
              Live integration pending database schemas mapping indices.
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className="admin-container">
      {/* 1. Sidebar Panel */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => {
        setSearchQuery('');
        setCityFilter('All');
        setStatusFilter('All');
        setActiveTab(tab);
      }} />

      {/* 2. Main content viewport */}
      <div className="admin-main">
        {/* Topbar layout */}
        <Topbar />

        {/* Scrollable content body */}
        <div className="admin-content-scroll">
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Add/Edit Parking Lot Modal Dialog */}
      <ParkingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLot}
        lot={selectedLotForEdit}
      />
    </div>
  );
}
