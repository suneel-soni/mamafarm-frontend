/**
 * Date formatting utilities configured for Indian Standard Time (Asia/Kolkata, UTC+5:30)
 */

export const INDIAN_TIMEZONE = 'Asia/Kolkata';

/**
 * Format date to standard DD/MM/YYYY string in IST
 */
export function formatDateIST(dateVal: Date | string | number | undefined | null): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    timeZone: INDIAN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date and time to "DD/MM/YYYY, hh:mm am/pm" in IST
 */
export function formatDateTimeIST(dateVal: Date | string | number | undefined | null): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', {
    timeZone: INDIAN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format short date (e.g. "30 Jul") in IST
 */
export function formatShortDateIST(dateVal: Date | string | number | undefined | null): string {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    timeZone: INDIAN_TIMEZONE,
    month: 'short',
    day: 'numeric',
  });
}
