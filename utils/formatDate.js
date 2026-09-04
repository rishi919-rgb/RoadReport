/**
 * @file formatDate.js
 * @description Utility functions for formatting dates.
 * Converts ISO timestamps into human-friendly "time ago" or formatted date strings.
 */

/**
 * Returns a human-friendly "time ago" string.
 * @param {string|Date} dateVal - Input date value.
 * @returns {string} Relative time string (e.g. "2 hours ago", "just now").
 */
export const timeAgo = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return 'recently';
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 0) return 'just now'; // handles clock skew issues

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

/**
 * Returns a formatted date string.
 * @param {string|Date} dateVal - Input date value.
 * @returns {string} Formatted date (e.g. "August 30, 2026").
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return '';
  
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

export default {
  timeAgo,
  formatDate
};
