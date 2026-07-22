import { parkingService } from './parkingService';
import { calculateFacilityScore, DEFAULT_WEIGHTS } from '../utils/scoring';

export const recommendationService = {
  /**
   * Compiles parking facility listings scored and sorted by AI algorithms.
   * @param {Object} preferences - Inputs (destination, vehicle type, budget, walking distance)
   * @param {Object} weights - Optional custom weights overriding default coefficients
   */
  async getRecommendations(preferences, weights = DEFAULT_WEIGHTS) {
    try {
      const facilitiesData = await parkingService.fetchLots();
      
      // Map and score all active facilities
      const scoredFacilities = facilitiesData
        .map((facility, idx) => {
          // Fallbacks for data structures from DB
          const price = parseFloat(facility.price_per_hour);
          const availableSlots = parseInt(facility.available_slots);
          const totalSlots = parseInt(facility.total_slots);
          
          // Generate a mock rating & distance based on index (simulating geofencing)
          const facilityRating = 4.0 + (idx * 0.15) % 1.0;
          const facilityDistance = 0.25 + idx * 0.3; // distance in miles

          const facilityObj = {
            ...facility,
            pricePerHour: price,
            availableSlots,
            totalSlots,
            rating: facilityRating,
            distance: facilityDistance,
            historicalOccupancy: 50 + (idx * 8) % 40 // simulate historical occupancy
          };

          const scoringResult = calculateFacilityScore(facilityObj, preferences, weights);

          return {
            ...facilityObj,
            aiScore: scoringResult.score,
            recommendationReason: scoringResult.reason,
            subscores: scoringResult.subscores
          };
        })
        // Sort descending: highest AI score first
        .sort((a, b) => b.aiScore - a.aiScore);

      // Return top 3 recommendations
      return scoredFacilities.slice(0, 3);
    } catch (err) {
      console.error('Error generating AI recommendations:', err);
      throw err;
    }
  }
};
