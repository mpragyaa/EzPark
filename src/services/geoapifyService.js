/**
 * Geoapify Places API Service
 * Fetches real parking facilities based on the searched coordinates,
 * with strict scoring, ranking, and geographic validation.
 */

const GEOAPIFY_URL = 'https://api.geoapify.com/v2/places';

// Simple memory cache
const geoapifyCache = new Map();

// Constants
const EARTH_RADIUS_KM = 6371;

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
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
  return EARTH_RADIUS_KM * c;
}

function scoreRelevance(feature, distanceKm) {
  let score = 0;
  
  // 1. Distance Score (Max 50)
  if (distanceKm <= 0.5) score += 50;
  else if (distanceKm <= 1.0) score += 40;
  else if (distanceKm <= 2.0) score += 30;
  else if (distanceKm <= 3.0) score += 20;
  else if (distanceKm <= 5.0) score += 10;

  const props = feature.properties || {};
  const name = (props.name || '').toLowerCase();
  
  // 2. Name Quality Score (Max 30)
  if (name && name.length > 2) {
    if (name.includes('parking') || name.includes('garage')) {
      score += 30;
    } else {
      // It has a name but doesn't explicitly say parking in the name
      score += 15;
    }
  } else {
    // Unnamed facility penalty
    score -= 10;
  }

  // 3. Category Score (Max 30)
  const categories = props.categories || [];
  if (categories.includes('parking.cars.multistorey') || categories.includes('parking.cars.underground')) {
    score += 30; // Highly explicit structural parking
  } else if (categories.includes('parking.cars')) {
    score += 20; // Explicit car parking
  } else if (categories.includes('parking')) {
    score += 10; // Generic parking
  }

  // Penalty for generic venue types if it doesn't have a distinct parking tag
  // Geoapify might return a mall that happens to have a parking category
  if (categories.includes('commercial.shopping_mall') && !name.includes('parking')) {
    score -= 20;
  }

  return score;
}

async function executeQuery(lat, lng, radiusMeters, apiKey) {
  const params = new URLSearchParams({
    categories: 'parking,parking.cars,parking.cars.multistorey,parking.cars.surface,parking.cars.underground,parking.cars.rooftop',
    filter: `circle:${lng},${lat},${radiusMeters}`,
    limit: '20',
    apiKey: apiKey,
  });

  const url = `${GEOAPIFY_URL}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Geoapify API returned status ${res.status}`);
  }
  return await res.json();
}

export async function fetchNearbyParking(lat, lng, radiusMeters = 5000) {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)},${radiusMeters}`;
  if (geoapifyCache.has(cacheKey)) {
    console.log(`[Discovery Pipeline] Returning Geoapify results from cache`);
    return geoapifyCache.get(cacheKey);
  }

  console.log(`[Discovery Pipeline] Search: ${lat}, ${lng}`);
  
  let usedRadius = 2000;
  console.log(`[Discovery Pipeline] Initial radius: ${usedRadius}m`);

  try {
    let data = await executeQuery(lat, lng, usedRadius, apiKey);
    let features = data.features || [];
    
    // If we have fewer than 5 results at 2km, expand to 5km (up to requested radiusMeters max)
    const maxAllowed = Math.min(5000, radiusMeters);
    if (features.length < 5 && usedRadius < maxAllowed) {
      console.log(`[Discovery Pipeline] Only ${features.length} raw results at 2km. Expanding to ${maxAllowed}m`);
      usedRadius = maxAllowed;
      data = await executeQuery(lat, lng, usedRadius, apiKey);
      features = data.features || [];
    }

    console.log(`[Discovery Pipeline] Geoapify raw results: ${features.length}`);

    const validResults = [];
    let rejectedCount = 0;
    const dedupeMap = new Map();

    features.forEach((feature) => {
      const props = feature.properties || {};
      
      // Validation
      if (!props.lat || !props.lon) {
        console.log(`[Discovery Pipeline] Rejected: Invalid coordinates (place_id: ${props.place_id})`);
        rejectedCount++;
        return;
      }

      const distanceKm = calculateDistanceKm(lat, lng, props.lat, props.lon);
      
      if (distanceKm > (usedRadius / 1000)) {
        console.log(`[Discovery Pipeline] Rejected: Too far (${distanceKm.toFixed(2)}km) - ${props.name}`);
        rejectedCount++;
        return;
      }

      const categories = props.categories || [];
      if (!categories.some(c => c.startsWith('parking'))) {
        console.log(`[Discovery Pipeline] Rejected: Not a parking category - ${props.name}`);
        rejectedCount++;
        return;
      }

      const score = scoreRelevance(feature, distanceKm);
      
      if (score < 10) {
        console.log(`[Discovery Pipeline] Rejected: Low relevance score (${score}) - ${props.name}`);
        rejectedCount++;
        return;
      }

      // Deduplication via Place ID or proximity (50m)
      let isDuplicate = false;
      for (const [key, existing] of dedupeMap.entries()) {
        if (existing.placeId === props.place_id) {
          isDuplicate = true;
          break;
        }
        const dist = calculateDistanceKm(props.lat, props.lon, existing.latitude, existing.longitude);
        if (dist < 0.05) { // 50m
          isDuplicate = true;
          break;
        }
      }

      if (isDuplicate) {
        console.log(`[Discovery Pipeline] Rejected: Duplicate - ${props.name}`);
        rejectedCount++;
        return;
      }

      const parsed = {
        id: props.place_id || `ext-${Date.now()}-${Math.random()}`,
        placeId: props.place_id,
        name: (props.name && props.name.trim().length > 0) ? props.name : 'Parking Area',
        latitude: props.lat,
        longitude: props.lon,
        address: props.address_line2 || props.formatted || '',
        distanceKm: distanceKm,
        isExternal: true,
        relevanceScore: score
      };

      dedupeMap.set(parsed.id, parsed);
      validResults.push(parsed);
    });

    console.log(`[Discovery Pipeline] Rejected results: ${rejectedCount}`);
    console.log(`[Discovery Pipeline] Valid parking results: ${validResults.length}`);

    // Sort by Relevance (desc), then Distance (asc)
    validResults.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.distanceKm - b.distanceKm;
    });

    // Top 8
    const topResults = validResults.slice(0, 8);
    console.log(`[Discovery Pipeline] Final returned external results: ${topResults.length}`);

    geoapifyCache.set(cacheKey, topResults);
    return topResults;
  } catch (error) {
    console.error('[Discovery Pipeline] Geoapify fetch failed:', error);
    throw error;
  }
}
