import { fetchNearbyParking } from './src/services/osmService.js';
import { searchLocation } from './src/services/geocodingService.js';
import { calculateDistance } from './src/utils/calculateDistance.js';

async function run() {
  console.log('--- DIAGNOSTIC TEST: "M2K Rohini, Delhi" ---');
  try {
    const geo = await searchLocation('M2K Rohini, Delhi');
    if (!geo || geo.length === 0) {
      console.log('No geocoding results found.');
      return;
    }
    
    const center = geo[0];
    console.log(`Geocoded 'M2K Rohini, Delhi' to: ${center.lat}, ${center.lng} (${center.displayName})`);
    
    // Simulate what ParkingMap does
    const osmSpots = await fetchNearbyParking(center.lat, center.lng, 5000);
    
    console.log(`\nFound ${osmSpots.length} external parking spots within 5km.`);
    
    const sorted = osmSpots
      .map(s => ({
        ...s,
        distance: calculateDistance(center.lat, center.lng, s.latitude, s.longitude)
      }))
      .sort((a, b) => a.distance - b.distance);
      
    sorted.slice(0, 5).forEach((spot, i) => {
      console.log(`\nResult #${i+1}:`);
      console.log(`  Name: ${spot.name}`);
      console.log(`  Distance: ${spot.distance.toFixed(2)} km`);
      console.log(`  External: ${spot.isExternal ? 'Yes (External Parking)' : 'No (EzPark Verified)'}`);
      console.log(`  Coordinates: ${spot.latitude.toFixed(4)}, ${spot.longitude.toFixed(4)}`);
      console.log(`  Price available: ${spot.pricePerHour !== null ? 'Yes' : 'No'}`);
      console.log(`  Booking available: ${spot.isExternal ? 'No' : 'Yes'}`);
    });
    
  } catch (err) {
    console.error('Test failed', err);
  }
}

run();
