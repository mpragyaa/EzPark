/**
 * BookingContext.jsx
 *
 * Centralised booking state context for EzPark.
 * Shared across the landing page search form, interactive map, details drawer,
 * and booking confirmation flows.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  // Centralized search & booking state
  const [destination, setDestination] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [vehicleType, setVehicleType] = useState('car');
  
  // Default values
  const [date, setDate] = useState('2026-07-28');
  const [time, setTime] = useState('16:00'); // 4:00 PM
  const [duration, setDuration] = useState(2); // 2 Hours

  // Selected parking facility
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Search parameters
  const [searchRadius, setSearchRadius] = useState(10);
  const [priceLimit, setPriceLimit] = useState(200);

  // Clear slot selection if facility changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedFacility]);

  // Synchronize destination string and selectedLocation label
  useEffect(() => {
    if (selectedLocation && selectedLocation.label) {
      setDestination(selectedLocation.label);
    }
  }, [selectedLocation]);

  return (
    <BookingContext.Provider
      value={{
        destination,
        setDestination,
        selectedLocation,
        setSelectedLocation,
        vehicleType,
        setVehicleType,
        date,
        setDate,
        time,
        setTime,
        duration,
        setDuration,
        selectedFacility,
        setSelectedFacility,
        selectedSlot,
        setSelectedSlot,
        searchRadius,
        setSearchRadius,
        priceLimit,
        setPriceLimit,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
