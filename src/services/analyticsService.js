import { supabase } from './supabase';

export const analyticsService = {
  // Fetch overall analytics dataset (resolves with mock charts data structures ready for Recharts)
  async getDashboardAnalytics() {
    return {
      revenueTrends: [
        { name: 'Mon', revenue: 240, bookings: 12 },
        { name: 'Tue', revenue: 380, bookings: 19 },
        { name: 'Wed', revenue: 420, bookings: 21 },
        { name: 'Thu', revenue: 310, bookings: 15 },
        { name: 'Fri', revenue: 590, bookings: 29 },
        { name: 'Sat', revenue: 840, bookings: 42 },
        { name: 'Sun', revenue: 620, bookings: 31 }
      ],
      peakHours: [
        { hour: '06:00', occupancy: 20 },
        { hour: '08:00', occupancy: 75 },
        { hour: '10:00', occupancy: 92 },
        { hour: '12:00', occupancy: 85 },
        { hour: '14:00', occupancy: 88 },
        { hour: '16:00', occupancy: 70 },
        { hour: '18:00', occupancy: 95 },
        { hour: '20:00', occupancy: 60 },
        { hour: '22:00', occupancy: 30 }
      ],
      popularLots: [
        { name: 'Aether Plaza', value: 45 },
        { name: 'Vortex Garage', value: 30 },
        { name: 'Lumina Hub', value: 25 }
      ],
      occupancyTrends: [
        { day: 'Mon', averageOccupancy: 58 },
        { day: 'Tue', averageOccupancy: 64 },
        { day: 'Wed', averageOccupancy: 70 },
        { day: 'Thu', averageOccupancy: 66 },
        { day: 'Fri', averageOccupancy: 82 },
        { day: 'Sat', averageOccupancy: 90 },
        { day: 'Sun', averageOccupancy: 72 }
      ],
      cancellationsRatio: [
        { status: 'Completed', count: 184 },
        { status: 'Cancelled', count: 18 }
      ]
    };
  }
};
