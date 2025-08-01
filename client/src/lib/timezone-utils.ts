import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Get the user's detected timezone
 */
export function getDetectedTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Failed to detect timezone, falling back to UTC:', error);
    return 'UTC';
  }
}

/**
 * Get the user's timezone from localStorage or detect it
 */
export function getUserTimezone(): string {
  const stored = localStorage.getItem('user_timezone');
  if (stored) {
    return stored;
  }
  
  const detected = getDetectedTimezone();
  localStorage.setItem('user_timezone', detected);
  return detected;
}

/**
 * Set the user's timezone preference
 */
export function setUserTimezone(timezone: string): void {
  localStorage.setItem('user_timezone', timezone);
}

/**
 * Get the current date in user's timezone (YYYY-MM-DD format)
 */
export function getCurrentLocalDate(): string {
  const timezone = getUserTimezone();
  const now = new Date();
  return formatInTimeZone(now, timezone, 'yyyy-MM-dd');
}

/**
 * Get the current date and time in user's timezone
 */
export function getCurrentLocalDateTime(): Date {
  const timezone = getUserTimezone();
  const now = new Date();
  return utcToZonedTime(now, timezone);
}

/**
 * Convert a local date string (YYYY-MM-DD) to UTC for database storage
 */
export function localDateToUtc(dateString: string): Date {
  const timezone = getUserTimezone();
  // Create date at start of day in user's timezone
  const localDate = new Date(dateString + 'T00:00:00');
  return zonedTimeToUtc(localDate, timezone);
}

/**
 * Convert a UTC date from database to user's local timezone
 */
export function utcToLocalDate(utcDate: string | Date): Date {
  const timezone = getUserTimezone();
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return utcToZonedTime(date, timezone);
}

/**
 * Format a date in user's timezone
 */
export function formatInUserTimezone(date: string | Date, formatString: string): string {
  const timezone = getUserTimezone();
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, formatString);
}

/**
 * Get date range for database queries (start and end of day in UTC)
 */
export function getDateRangeForQuery(localDateString: string): { start: Date; end: Date } {
  const timezone = getUserTimezone();
  
  // Create start and end of day in user's timezone
  const startOfDayLocal = startOfDay(new Date(localDateString + 'T00:00:00'));
  const endOfDayLocal = endOfDay(new Date(localDateString + 'T00:00:00'));
  
  // Convert to UTC for database queries
  const startUtc = zonedTimeToUtc(startOfDayLocal, timezone);
  const endUtc = zonedTimeToUtc(endOfDayLocal, timezone);
  
  return { start: startUtc, end: endUtc };
}

/**
 * Get a list of common timezones for user selection
 */
export function getCommonTimezones(): Array<{ value: string; label: string; offset: string }> {
  const now = new Date();
  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Moscow',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'UTC'
  ];

  return timezones.map(tz => {
    try {
      const offset = formatInTimeZone(now, tz, 'XXX');
      const label = tz.replace('_', ' ').replace('/', ' - ');
      return {
        value: tz,
        label: `${label} (${offset})`,
        offset
      };
    } catch (error) {
      return {
        value: tz,
        label: tz,
        offset: '+00:00'
      };
    }
  }).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Auto-detect and set user timezone if not already set
 */
export function initializeTimezone(): void {
  const stored = localStorage.getItem('user_timezone');
  if (!stored) {
    const detected = getDetectedTimezone();
    setUserTimezone(detected);
    console.log('🌍 Auto-detected timezone:', detected);
  }
}