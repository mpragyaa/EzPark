const http = require('https');

function searchOverpass(lat, lon, radius) {
  const query = `[out:json];(node(around:${radius},${lat},${lon})["amenity"="parking"];way(around:${radius},${lat},${lon})["amenity"="parking"];);out center;`;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  const options = {
    headers: { 'User-Agent': 'EzPark/1.0 (test)' }
  };
  http.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        console.log(`Overpass results for ${lat}, ${lon}:`);
        const json = JSON.parse(data);
        console.log(json.elements.slice(0, 5).map(x => ({ 
          id: x.id, 
          name: x.tags?.name || 'Unnamed Parking', 
          lat: x.lat || x.center?.lat, 
          lon: x.lon || x.center?.lon,
          tags: x.tags
        })));
        console.log(`Total found: ${json.elements.length}`);
      } catch (e) {
        console.error(e);
      }
    });
  });
}

searchOverpass(28.7041, 77.1025, 2000); // Rohini approx, 2km radius
