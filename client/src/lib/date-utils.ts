/**
 * Custom date utilities that handle date/time construction without timezone interference
 */

/**
 * Creates a Date object from a date and time string without timezone conversion
 * @param dateStr - Date string in YYYY-MM-DD format  
 * @param timeStr - Time string in HH:MM format
 * @returns Date object representing the exact local date/time specified
 */
export function createDateTimeFromComponents(dateStr: string, timeStr: string): Date {
  // Parse date components
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Parse time components
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create date using local timezone constructor (avoids UTC conversion)
  // Month is 0-indexed in JavaScript Date constructor
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Creates a date object representing the start of the specified date
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object representing midnight on that date in local timezone
 */
export function createDateFromString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Formats a date as YYYY-MM-DD string
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Handles overnight activities (like sleep) by adding a day to end time if needed
 * @param startDateTime - Start date/time
 * @param endDateTime - End date/time  
 * @param activityType - Type of activity (sleep activities can span overnight)
 * @returns Adjusted end date/time
 */
export function handleOvernightActivity(
  startDateTime: Date,
  endDateTime: Date,
  activityType: string
): Date {
  // For sleep activities, if end time is earlier than start time, assume it's the next day
  if (activityType === 'sleep' && endDateTime <= startDateTime) {
    const adjustedEndDateTime = new Date(endDateTime);
    adjustedEndDateTime.setDate(adjustedEndDateTime.getDate() + 1);
    return adjustedEndDateTime;
  }
  
  return endDateTime;
}