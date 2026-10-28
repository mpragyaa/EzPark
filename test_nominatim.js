const http = require('https');

function search(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`;
  const options = {
    headers: { 'User-Agent': 'EzPark/1.0 (test)' }
  };
  http.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        console.log(`Results for ${query}:`);
        console.log(JSON.parse(data).map(x => ({ name: x.name, display: x.display_name, type: x.type })));
      } catch (e) {
        console.error(e);
      }
    });
  });
}

search('parking in Rohini');
search('parking near 28.7041, 77.1025'); // Delhi coords
search('[amenity=parking] Rohini');
