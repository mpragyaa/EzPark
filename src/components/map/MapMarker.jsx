/**
 * Helper utility to build custom HTML/CSS glowing pin markers for Leaflet maps.
 * Utilizes standard Leaflet divIcon to map custom DOM structures styled in map.css.
 */
export const createCustomMarkerIcon = (L, spot, isSelected) => {
  const { availableSlots, totalSlots } = spot;

  // Availability color mapping:
  // Green = many slots (> 5)
  // Yellow = limited slots (1 - 5)
  // Red = full (0)
  let availabilityColorClass = 'green';
  
  if (availableSlots === 0) {
    availabilityColorClass = 'red';
  } else if (availableSlots <= 5) {
    availabilityColorClass = 'yellow';
  }

  const selectionClass = isSelected ? 'selected' : '';

  return L.divIcon({
    className: 'custom-leaflet-marker-div',
    html: `
      <div class="custom-map-marker ${availabilityColorClass} ${selectionClass}">
        <div class="marker-pin-core"></div>
        <div class="marker-pin-pulse"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};
