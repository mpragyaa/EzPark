import React from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/landing/Hero';
import ParkingMap from '../components/map/ParkingMap';

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <ParkingMap />
    </>
  );
}
