import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, CircleDollarSign, Leaf } from 'lucide-react';

// Custom Animated Counter component for that premium dynamic feel
function AnimatedCounter({ value, duration = 1200 }) {
  const isCurrency = typeof value === 'string' && value.startsWith('$');
  const isKg = typeof value === 'string' && value.endsWith(' kg');
  
  // Clean value to parse decimal floats
  const numericVal = parseFloat(
    value.toString().replace('$', '').replace(' kg', '')
  );

  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentVal = progress * numericVal;
      
      setCount(currentVal);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [numericVal, duration]);

  // Formatter helper
  const renderValue = () => {
    if (isNaN(count)) return value;
    if (isCurrency) return `$${count.toFixed(2)}`;
    if (isKg) return `${count.toFixed(1)} kg`;
    return Math.floor(count);
  };

  return <span>{renderValue()}</span>;
}

export default function StatsCards({ 
  availableParking = 14, 
  todaysBookings = 2, 
  moneySaved = 118.50, 
  carbonSaved = 48.2 
}) {
  const cardData = [
    {
      label: 'Available Spaces',
      value: availableParking,
      icon: MapPin,
      colorClass: 'blue'
    },
    {
      label: "Today's Bookings",
      value: todaysBookings,
      icon: Calendar,
      colorClass: 'violet'
    },
    {
      label: 'Money Saved',
      value: `$${moneySaved}`,
      icon: CircleDollarSign,
      colorClass: 'green'
    },
    {
      label: 'Carbon Saved',
      value: `${carbonSaved} kg`,
      icon: Leaf,
      colorClass: 'red'
    }
  ];

  // Stagger wrapper variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <motion.div 
      className="stats-cards-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cardData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div 
            key={idx} 
            className="stats-card-item"
            variants={itemVariants}
          >
            <div className="stats-card-info">
              <span className="stats-card-label">{card.label}</span>
              <h3 className="stats-card-value">
                <AnimatedCounter value={card.value} />
              </h3>
            </div>
            <div className={`stats-card-icon ${card.colorClass}`}>
              <Icon size={22} />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
