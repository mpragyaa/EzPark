import React from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import ParkingMap from '../components/map/ParkingMap';
import Contact from '../components/landing/Contact';

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <ParkingMap />
      <Features />
      <Contact />
    </>
  );
}
