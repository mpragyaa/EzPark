export const parkingLocations = [
  {
    id: 'spot-1',
    name: 'Aether Premium Plaza',
    latitude: 37.7894,
    longitude: -122.4014,
    distance: 0.2, // in miles
    pricePerHour: 4.50,
    availableSlots: 14,
    totalSlots: 40,
    rating: 4.9,
    hasEVCharging: true,
    isOpen: true,
    vehicleTypes: ['car', 'ev']
  },
  {
    id: 'spot-2',
    name: 'Vortex Cyberport Garage',
    latitude: 37.7854,
    longitude: -122.4064,
    distance: 0.5,
    pricePerHour: 6.00,
    availableSlots: 3,
    totalSlots: 50,
    rating: 4.8,
    hasEVCharging: true,
    isOpen: true,
    vehicleTypes: ['car', 'ev', 'bike']
  },
  {
    id: 'spot-3',
    name: 'Lumina Smart Hub',
    latitude: 37.7814,
    longitude: -122.4114,
    distance: 0.8,
    pricePerHour: 3.50,
    availableSlots: 0, // full
    totalSlots: 30,
    rating: 4.6,
    hasEVCharging: false,
    isOpen: true,
    vehicleTypes: ['car', 'bike']
  },
  {
    id: 'spot-4',
    name: 'Nexus Underground Vault',
    latitude: 37.7934,
    longitude: -122.3984,
    distance: 1.2,
    pricePerHour: 8.00,
    availableSlots: 22,
    totalSlots: 60,
    rating: 5.0,
    hasEVCharging: true,
    isOpen: true,
    vehicleTypes: ['car', 'ev']
  },
  {
    id: 'spot-5',
    name: 'Stellar Heights Deck',
    latitude: 37.7794,
    longitude: -122.4184,
    distance: 1.5,
    pricePerHour: 5.00,
    availableSlots: 11,
    totalSlots: 25,
    rating: 4.4,
    hasEVCharging: true,
    isOpen: false, // Closed
    vehicleTypes: ['car', 'ev']
  },
  {
    id: 'spot-6',
    name: 'Meridian Valley Lots',
    latitude: 37.7734,
    longitude: -122.4234,
    distance: 1.9,
    pricePerHour: 3.00,
    availableSlots: 2,
    totalSlots: 45,
    rating: 4.2,
    hasEVCharging: false,
    isOpen: true,
    vehicleTypes: ['car', 'bike']
  }
];
