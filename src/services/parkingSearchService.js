/**
 * parkingSearchService.js
 *
 * Reusable service for proximity-based parking facility search.
 * All functions are pure (no React, no side effects) so they can be unit-tested
 * and used in any context — including future Supabase integration.
 *
 * The data contract for a "facility" object (normalised by ParkingMap):
 *   { id, name, address, city, latitude, longitude,
 *     totalSlots, availableSlots, pricePerHour, rating,
 *     hasEVCharging, hasCCTV, isCovered, isOpen, vehicleTypes }
 *
 * After processing, each facility gains a `distanceKm` field.
 */

import { calculateDistance } from '../utils/calculateDistance';

// ─── Configurable search radii (km) ──────────────────────────────────────────
export const SEARCH_RADII_KM = [1, 2, 5, 10];
export const DEFAULT_RADIUS_KM = 2;

// ─── filterByRadius ───────────────────────────────────────────────────────────
/**
 * Attach a real `distanceKm` to every facility and keep only those within the
 * given radius from the reference point.
 *
 * @param {object[]} facilities  — normalised facility objects
 * @param {number}   originLat  — reference latitude  (e.g. selected location)
 * @param {number}   originLng  — reference longitude
 * @param {number}   radiusKm   — include facilities within this many km
 * @returns {object[]} facilities with `distanceKm` attached, filtered to radius
 */
export function filterByRadius(facilities, originLat, originLng, radiusKm = DEFAULT_RADIUS_KM) {
  return facilities
    .map((facility) => ({
      ...facility,
      distanceKm: calculateDistance(
        originLat,
        originLng,
        facility.latitude,
        facility.longitude
      ),
    }))
    .filter((facility) => facility.distanceKm <= radiusKm);
}

// ─── sortFacilities ───────────────────────────────────────────────────────────
/**
 * Sort facilities by:
 *   1. Shortest distance (ascending)
 *   2. Highest available slots (descending) as a tiebreaker
 *
 * Non-destructive — returns a new sorted array.
 *
 * @param {object[]} facilities — facilities with `distanceKm` field
 * @returns {object[]}
 */
export function sortFacilities(facilities) {
  return [...facilities].sort((a, b) => {
    // Primary: closest first
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    // Secondary: most available slots first
    return b.availableSlots - a.availableSlots;
  });
}

// ─── findNearbyFacilities ─────────────────────────────────────────────────────
/**
 * Main entry point: filter to radius and return sorted results.
 * Structured so the `facilities` array can come from mock data or Supabase
 * interchangeably — the caller decides the data source.
 *
 * @param {object[]} facilities — all normalised facility objects
 * @param {number}   originLat — reference latitude
 * @param {number}   originLng — reference longitude
 * @param {number}   radiusKm  — search radius in km
 * @returns {object[]} sorted facilities within radius, each with `distanceKm`
 */
export function findNearbyFacilities(facilities, originLat, originLng, radiusKm = DEFAULT_RADIUS_KM) {
  const nearby = filterByRadius(facilities, originLat, originLng, radiusKm);
  return sortFacilities(nearby);
}
