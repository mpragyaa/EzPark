// Default weights configuration for facility recommendations
export const DEFAULT_WEIGHTS = {
  distance: 0.30,
  price: 0.20,
  availability: 0.25,
  rating: 0.15,
  historicalOccupancy: 0.10
};

/**
 * Calculates a parking facility recommendation score (0-100) based on user preferences and weights.
 * @param {Object} facility - Parking facility record.
 * @param {Object} preferences - User inputs (preferred budget, preferred distance, etc.).
 * @param {Object} weights - Score weighting coefficients.
 */
export function calculateFacilityScore(facility, preferences, weights = DEFAULT_WEIGHTS) {
  // Normalize parameters
  const distance = parseFloat(facility.distance || 0.5);
  const price = parseFloat(facility.pricePerHour || facility.price_per_hour || 4);
  const availableSlots = parseInt(facility.availableSlots || facility.available_slots || 0);
  const totalSlots = parseInt(facility.totalSlots || facility.total_slots || 50);
  
  // Rating fallback (default 4.2 stars if none exists)
  const rating = parseFloat(facility.rating || 4.2);
  
  // Historical occupancy mock calculation (facility-specific or defaults)
  const historicalOccupancy = parseFloat(facility.historicalOccupancy || 65); // percentage

  const maxDist = parseFloat(preferences.preferredWalkingDistance || 2.0); // in miles
  const maxPrice = parseFloat(preferences.preferredBudget || 12.00); // price limit

  // Normalizations (0.0 to 1.0)
  const sDist = Math.max(0, 1 - (distance / maxDist));
  const sPrice = Math.max(0, 1 - (price / maxPrice));
  const sAvail = totalSlots > 0 ? Math.min(1, availableSlots / totalSlots) : 0;
  const sRating = Math.min(1, rating / 5.0);
  const sHist = Math.max(0, 1 - (historicalOccupancy / 100.0));

  // Cumulative weighted score
  const finalScore = (
    sDist * weights.distance +
    sPrice * weights.price +
    sAvail * weights.availability +
    sRating * weights.rating +
    sHist * weights.historicalOccupancy
  ) * 100;

  // Determine logical textual recommendation reasons
  let reason = 'Best balance of distance and price';
  
  // If distance is super close and availability is solid
  if (sDist > sPrice && sAvail > 0.4) {
    reason = 'Closest with high availability';
  } 
  // If price subscore is high and offers better savings
  else if (sPrice > sDist && sPrice > 0.6) {
    reason = 'Cheapest option nearby';
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(finalScore))),
    reason,
    subscores: {
      distance: sDist,
      price: sPrice,
      availability: sAvail,
      rating: sRating,
      historical: sHist
    }
  };
}
