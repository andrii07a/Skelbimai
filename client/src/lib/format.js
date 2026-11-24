const euro = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function money(value) {
  return value === 0 ? 'Free' : euro.format(value);
}

// SQLite saves time like "2026-11-24 13:39:37" (UTC)
function toDate(sqliteTime) {
  return new Date(sqliteTime.replace(' ', 'T') + 'Z');
}

// "3 hours ago", "yesterday", "2 weeks ago"
export function timeAgo(sqliteTime) {
  const seconds = Math.round((toDate(sqliteTime) - Date.now()) / 1000);
  const steps = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function fullDate(sqliteTime) {
  return toDate(sqliteTime).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
}

export function pluralize(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
