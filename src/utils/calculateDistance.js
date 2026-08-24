/**
 * calculateDistance.js
 *
 * Pure utility — Haversine Formula implementation for EzPark.
 * Calculates the great-circle distance between two lat/lng points on Earth.
 *
 * @param {number} lat1 - Latitude of point A (degrees)
 * @param {number} lng1 - Longitude of point A (degrees)
 * @param {number} lat2 - Latitude of point B (degrees)
 * @param {number} lng2 - Longitude of point B (degrees)
 * @returns {number} Distance in kilometres (rounded to 2 decimal places)
 */

const EARTH_RADIUS_KM = 6371;

export function calculateDistance(lat1, lng1, lat2, lng2) {
  // Convert degrees to radians
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS_KM * c;

  return Math.round(distanceKm * 100) / 100; // 2 decimal places
}
