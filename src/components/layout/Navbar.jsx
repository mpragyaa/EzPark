import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const MotionLink = motion(Link);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Framer Motion entry animation variants
  const navContainerVariants = {
    hidden: {
      y: -80,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] // Custom premium ease-out
      }
    }
  };

  const ctaPath = isAuthenticated
    ? (user?.role === 'operator' || user?.role === 'admin' ? '/operator' : '/dashboard')
    : '/login';

  return (
    <div className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
      <motion.nav
        className={`navbar-inner ${scrolled ? 'scrolled' : ''}`}
        variants={navContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left: Brand Logo */}
        <Link to="/" className="navbar-logo">
          EZPARK
        </Link>

        {/* Center: Navigation Links */}
        <ul className="navbar-menu">
          <li>
            <a href="#features" className="navbar-link">
              Features
            </a>
          </li>
          <li>
            <a href="#technology" className="navbar-link">
              Technology
            </a>
          </li>
          <li>
            <Link to={ctaPath} className="navbar-link">
              Console
            </Link>
          </li>
          <li>
            <a href="#contact" className="navbar-link">
              Contact
            </a>
          </li>
        </ul>

        {/* Right: Premium CTA Button */}
        <MotionLink
          to={ctaPath}
          className="navbar-cta"
          whileHover={{ 
            scale: 1.04,
            y: -2,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          whileTap={{ scale: 0.98 }}
        >
          Open Console →
        </MotionLink>
      </motion.nav>
    </div>
  );
}
