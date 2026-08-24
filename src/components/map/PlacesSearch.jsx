/**
 * PlacesSearch — Location autocomplete input for EzPark.
 *
 * Renders with the exact same CSS classes as the existing search bar
 * (.search-wrapper, .search-input-field, .search-icon) so the UI is unchanged.
 * Adds a dropdown suggestion list below the input.
 *
 * Props
 * ─────
 *   value           {string}    Controlled input value (facility name filter)
 *   onChange        {Function}  Called with (string) on every keystroke — keeps the
 *                               facility name filter working as before.
 *   onLocationSelect {Function} Called with ({ lat, lng, label }) when the user
 *                               picks a suggestion. Use this to center the map.
 *   placeholder     {string}    Optional placeholder text.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { searchLocation } from '../../services/geocodingService';
import { searchHistoryService } from '../../services/searchHistoryService';
import { useAuth } from '../../contexts/AuthContext';

// Debounce delay in ms — keeps Nominatim happy (< 1 req/s)
const DEBOUNCE_MS = 400;

export default function PlacesSearch({
  value,
  onChange,
  onLocationSelect,
  placeholder = 'Search location or facility…',
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1); // keyboard nav
  const { user } = useAuth();

  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  // Track the last query that was fetched to avoid stale results
  const lastQueryRef = useRef('');

  // ── Fetch suggestions (debounced) ──────────────────────────────────────────
  const fetchSuggestions = useCallback((query) => {
    clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setErrorMsg('');
      return;
    }

    debounceRef.current = setTimeout(async () => {
      lastQueryRef.current = query;
      setIsLoading(true);
      setErrorMsg('');

      try {
        const results = await searchLocation(query);

        // Discard if a newer query has already taken over
        if (lastQueryRef.current !== query) return;

        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);

        if (results.length === 0) {
          setErrorMsg('No locations found.');
          setIsOpen(true); // show the "no results" row
        }
      } catch (err) {
        if (lastQueryRef.current !== query) return;
        const isRateLimit = err.message === 'RATE_LIMITED';
        setErrorMsg(
          isRateLimit
            ? 'Too many requests — please wait a moment.'
            : 'Location search unavailable. Try again.'
        );
        setSuggestions([]);
        setIsOpen(true);
      } finally {
        if (lastQueryRef.current === query) setIsLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  // ── Handle text input changes ──────────────────────────────────────────────
  function handleInputChange(e) {
    const q = e.target.value;
    onChange(q); // keep facility name filter in sync
    fetchSuggestions(q);
  }

  // ── Handle suggestion selection ────────────────────────────────────────────
  async function handleSelect(suggestion) {
    // Update input to show the chosen location
    onChange(suggestion.shortName);

    // Save to search history if authenticated
    if (user) {
      try {
        await searchHistoryService.saveSearch(
          user.id,
          suggestion.shortName,
          suggestion.lat,
          suggestion.lng
        );
      } catch (err) {
        console.warn('Failed to save search history', err);
      }
    }

    // Bubble the coordinates up to ParkingMap → LeafletMap
    onLocationSelect?.({
      lat: suggestion.lat,
      lng: suggestion.lng,
      label: suggestion.shortName,
    });

    // Close dropdown
    setSuggestions([]);
    setIsOpen(false);
    setErrorMsg('');
    setActiveIndex(-1);

    // Return focus to input
    inputRef.current?.blur();
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  }

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Cleanup debounce on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const showDropdown = isOpen && (suggestions.length > 0 || errorMsg);

  return (
    /* Existing .search-wrapper class — no visual change to the bar itself */
    <div className="search-wrapper places-search-root" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        id="places-search-input"
        className="search-input-field"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 || errorMsg) setIsOpen(true);
        }}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls="places-suggestions"
        aria-expanded={showDropdown}
        role="combobox"
      />

      {/* Search / spinner icon — existing .search-icon position */}
      {isLoading ? (
        <div className="search-icon places-spinner" aria-hidden="true" />
      ) : (
        <svg
          className="search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <ul
          id="places-suggestions"
          className="places-dropdown"
          role="listbox"
          aria-label="Location suggestions"
        >
          {errorMsg ? (
            <li className="places-dropdown-msg">{errorMsg}</li>
          ) : (
            suggestions.map((s, idx) => (
              <li
                key={s.placeId}
                className={`places-dropdown-item${idx === activeIndex ? ' active' : ''}`}
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={(e) => {
                  // Prevent blur before click registers
                  e.preventDefault();
                  handleSelect(s);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <span className="places-item-icon" aria-hidden="true">📍</span>
                <span className="places-item-text">
                  <span className="places-item-short">{s.shortName}</span>
                  <span className="places-item-full">{s.displayName}</span>
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
