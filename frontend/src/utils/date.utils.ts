/**
 * Calculate human-readable duration from a timestamp.
 * Examples from spec: "Just now", "2 hours", "3 days", "2 weeks"
 */
export function formatStageDuration(timestamp: string | Date | undefined | null): string {
  if (!timestamp) return 'Just now';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return 'Just now';

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) {
    return minutes === 1 ? '1 min' : `${minutes} mins`;
  }

  const hours = Math.floor(diffInSeconds / 3600);
  if (hours < 24) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) {
    return days === 1 ? '1 day' : `${days} days`;
  }

  const weeks = Math.floor(days / 7);
  if (days < 30) {
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return months === 1 ? '1 month' : `${months} months`;
  }

  const years = Math.floor(days / 365);
  return years === 1 ? '1 year' : `${years} years`;
}

/**
 * Short date format, e.g. "Oct 1" or "Oct 1, 2026"
 */
export function formatShortDate(timestamp: string | Date | undefined | null): string {
  if (!timestamp) return '—';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return '—';

  const currentYear = new Date().getFullYear();
  const dateYear = date.getFullYear();

  if (dateYear === currentYear) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Detailed date-time format for history timeline, e.g. "Oct 1, 10:30 AM"
 */
export function formatDateTime(timestamp: string | Date | undefined | null): string {
  if (!timestamp) return '—';

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
