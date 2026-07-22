import React from 'react';
import { motion } from 'framer-motion';

export default function Stats({ 
  totalLots = 6, 
  availableSlots = 52, 
  todayRevenue = 1420.00, 
  todayBookings = 48, 
  activeUsers = 192, 
  occupancyPercent = 68 
}) {
  const statsData = [
    { label: 'Total Facilities', value: totalLots.toString() },
    { label: 'Available Slots', value: availableSlots.toString() },
    { label: "Today's Revenue", value: `$${todayRevenue.toFixed(2)}` },
    { label: "Today's Bookings", value: todayBookings.toString() },
    { label: 'Active Users', value: activeUsers.toString() },
    { label: 'Occupancy %', value: `${occupancyPercent.toFixed(0)}%` }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      className="admin-stats-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {statsData.map((stat, idx) => (
        <motion.div 
          key={idx} 
          className="admin-stat-card"
          variants={cardVariants}
          whileHover={{ y: -2 }}
        >
          <span className="admin-stat-label">{stat.label}</span>
          <h3 className="admin-stat-value">{stat.value}</h3>
        </motion.div>
      ))}
    </motion.div>
  );
}
