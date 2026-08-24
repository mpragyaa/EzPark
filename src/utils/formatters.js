/**
 * formatters.js
 *
 * Helper formatters for dates and times in EzPark booking flow.
 */

/**
 * Formats an ISO date string (YYYY-MM-DD) into "DD MMM YYYY".
 * e.g. "2026-07-28" → "28 Jul 2026"
 */
export function formatDateLabel(dateStr) {
  if (!dateStr) return 'N/A';
  // Parse date manual to avoid local timezone shifts
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[monthIdx] || '';

  return `${day} ${monthName} ${year}`;
}

/**
 * Formats a 24h time string (HH:MM) into 12h AM/PM.
 * e.g. "16:00" → "4:00 PM"
 */
export function formatTimeLabel(timeStr) {
  if (!timeStr) return 'N/A';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hrs = parseInt(parts[0], 10);
  const mins = parseInt(parts[1], 10);

  if (isNaN(hrs) || isNaN(mins)) return timeStr;

  const period = hrs >= 12 ? 'PM' : 'AM';
  const displayHrs = hrs % 12 || 12;
  const displayMins = mins.toString().padStart(2, '0');

  return `${displayHrs}:${displayMins} ${period}`;
}
