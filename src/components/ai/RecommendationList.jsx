import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { recommendationService } from '../../services/recommendationService';
import RecommendationCard from './RecommendationCard';

export default function RecommendationList({ onBookLot }) {
  const [preferredBudget, setPreferredBudget] = useState(8.00);
  const [preferredDistance, setPreferredDistance] = useState(1.5);
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Recalculate recommendations in real-time when inputs change
  const computeRecommendations = async () => {
    try {
      setLoading(true);
      const preferences = {
        preferredBudget,
        preferredWalkingDistance: preferredDistance
      };
      const scoredLots = await recommendationService.getRecommendations(preferences);
      setRecommendations(scoredLots);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    computeRecommendations();
  }, [preferredBudget, preferredDistance]);

  return (
    <div className="dashboard-section-panel" style={{ gap: '2rem' }}>
      
      {/* Header and Slider settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
          <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
          <h3 className="panel-title" style={{ margin: 0 }}>AI Smart Recommendations</h3>
        </div>

        {/* Sliders preference controllers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          backgroundColor: 'rgba(255,255,255,0.01)',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: '8px',
          padding: '1rem 1.25rem'
        }}>
          {/* Budget Limit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Preferred Hourly Budget</span>
              <span style={{ color: 'var(--color-primary)' }}>Max ${preferredBudget.toFixed(2)}/hr</span>
            </div>
            <input 
              type="range"
              min="3"
              max="15"
              step="0.5"
              value={preferredBudget}
              onChange={(e) => setPreferredBudget(parseFloat(e.target.value))}
              style={{
                accentColor: 'var(--color-primary)',
                background: 'rgba(255,255,255,0.06)',
                height: '4px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Distance Limit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', fontWeight: 600 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Preferred Walking Distance</span>
              <span style={{ color: 'var(--color-primary)' }}>Max {preferredDistance.toFixed(1)} miles</span>
            </div>
            <input 
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={preferredDistance}
              onChange={(e) => setPreferredDistance(parseFloat(e.target.value))}
              style={{
                accentColor: 'var(--color-primary)',
                background: 'rgba(255,255,255,0.06)',
                height: '4px',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

      </div>

      {/* Scored outputs grid list */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            Calculating AI recommendation parameters...
          </div>
        ) : (
          <motion.div 
            key="list"
            className="bookings-list-flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              width: '100%'
            }}
          >
            {recommendations.length > 0 ? (
              recommendations.map((lot, index) => (
                <RecommendationCard
                  key={lot.id}
                  lot={lot}
                  isTop={index === 0} // Highlight best score
                  onBookClick={onBookLot}
                />
              ))
            ) : (
              <div style={{ gridColumn: 'span 3', padding: '2rem', color: 'var(--text-muted)' }}>
                No active parking facilities met your criteria. Adjust preferences to refresh values.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
