import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/features.css';

const features = [
  {
    title: 'Find Nearby Parking',
    description: 'Quickly discover relevant parking around your location.',
    icon: '🗺️'
  },
  {
    title: 'Real-Time Availability',
    description: 'See available spaces for EzPark-managed parking locations.',
    icon: '🟢'
  },
  {
    title: 'Easy Booking',
    description: 'Reserve a parking space without unnecessary steps.',
    icon: '🎟️'
  },
  {
    title: 'Secure Payments',
    description: 'Complete bookings securely through the existing Razorpay integration.',
    icon: '🔒'
  }
];

export default function Features() {
  return (
    <section id="features" className="features-section">
      <div className="features-header">
        <h2 className="features-title">
          Why Choose <span className="features-title-accent">EzPark</span>
        </h2>
      </div>
      
      <div className="features-grid">
        {features.map((feature, index) => (
          <motion.div 
            key={index} 
            className="feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
          >
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
