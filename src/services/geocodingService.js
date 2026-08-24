/**
 * geocodingService.js
 *
 * Reusable geocoding service for EzPark using the Nominatim OpenStreetMap API.
 * No API key required. Nominatim is free but requires a valid User-Agent and
 * asks that clients respect a 1 req/s rate limit — use debouncing at call sites.
 *
 * Exports
 * ───────
 *   searchLocation(query, options?)  → Promise<GeoResult[]>
 *   reverseGeocode(lat, lng)         → Promise<GeoResult>
 *
 * GeoResult shape
 * ───────────────
 *   {
 *     placeId:     number   — Nominatim internal ID (use as React key)
 *     displayName: string   — Full formatted address string
 *     shortName:   string   — Concise label (city + country)
 *     lat:         number
 *     lng:         number
 *     type:        string   — OSM feature type (e.g. 'city', 'road')
 *   }
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Nominatim usage policy requires identifying your application in the User-Agent
const FETCH_OPTS = {
  headers: {
    'Accept-Language': 'en',
    'User-Agent': 'EzPark/1.0 (https://github.com/mpragyaa/EzPark)',
  },
};

/**
 * Format a Nominatim display_name into a shorter label.
 * e.g. "Connaught Place, New Delhi, Delhi, 110001, India" → "Connaught Place, New Delhi"
 */
function formatShortName(displayName) {
  const parts = displayName.split(',').map((p) => p.trim());
  // Take first two meaningful parts
  return parts.slice(0, 2).join(', ');
}

/**
 * Search for locations matching `query`.
 *
 * @param {string} query          — User-typed search string (min 2 chars)
 * @param {object} [options]
 * @param {number} [options.limit=6]          — Max results
 * @param {string} [options.countrycodes='']  — Comma-separated ISO-3166 codes to restrict results (e.g. 'in')
 * @returns {Promise<GeoResult[]>}
 */
export async function searchLocation(query, { limit = 6, countrycodes = '' } = {}) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    limit: String(limit),
    addressdetails: '1',
    dedupe: '1',
  });

  if (countrycodes) params.set('countrycodes', countrycodes);

  const url = `${NOMINATIM_BASE}/search?${params}`;

  const res = await fetch(url, FETCH_OPTS);

  if (res.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  if (!res.ok) {
    throw new Error(`Nominatim search failed with status ${res.status}`);
  }

  const data = await res.json();

  return data.map((item) => ({
    placeId: item.place_id,
    displayName: item.display_name,
    shortName: formatShortName(item.display_name),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type ?? item.class ?? 'place',
  }));
}

/**
 * Reverse-geocode a coordinate pair to a human-readable address.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<GeoResult>}
 */
export async function reverseGeocode(latitude, longitude) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'json',
    addressdetails: '1',
  });

  const url = `${NOMINATIM_BASE}/reverse?${params}`;

  const res = await fetch(url, FETCH_OPTS);

  if (!res.ok) {
    throw new Error(`Nominatim reverse-geocode failed with status ${res.status}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return {
    placeId: data.place_id,
    displayName: data.display_name,
    shortName: formatShortName(data.display_name),
    lat: parseFloat(data.lat),
    lng: parseFloat(data.lon),
    type: data.type ?? 'place',
  };
}
