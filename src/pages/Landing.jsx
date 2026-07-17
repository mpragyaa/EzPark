import React from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/landing/Hero';
import ParkingSearch from '../components/landing/ParkingSearch';
import BookingSection from '../components/landing/BookingSection';

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <ParkingSearch />
      <BookingSection />
    </>
  );
}
