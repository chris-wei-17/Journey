import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats activity type for display by converting to title case
 * Handles both uppercase and lowercase inputs
 * @param activityType - The activity type string to format
 * @returns Properly formatted activity name (e.g., "SWIMMING" -> "Swimming", "swimming" -> "Swimming")
 */
export function formatActivityName(activityType: string): string {
  if (!activityType) return 'Activity';

  return activityType
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculates duration between start and end times, handling overnight activities
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @param activityType - Type of activity (sleep activities can span overnight)
 * @returns Duration object with hours and minutes, or null if invalid
 */
export function calculateDuration(startTime: string, endTime: string, activityType?: string): { hours: number; minutes: number } | null {
  if (!startTime || !endTime) return null;

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let startDate = new Date();
  startDate.setHours(startHour, startMin, 0, 0);

  let endDate = new Date();
  endDate.setHours(endHour, endMin, 0, 0);

  // For sleep activities, if end time is earlier than start time, assume it's the next day
  if (activityType === 'sleep' && endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  } else if (activityType !== 'sleep' && endDate <= startDate) {
    // For non-sleep activities, end time must be after start time on the same day
    return null;
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
}

/**
 * Formats duration for display
 * @param duration - Duration object with hours and minutes
 * @returns Formatted string like "2 hr 30 min" or "45 min"
 */
export function formatDuration(duration: { hours: number; minutes: number } | null): string {
  if (!duration) return '';
  
  const parts = [];
  if (duration.hours > 0) {
    parts.push(`${duration.hours} hr`);
  }
  if (duration.minutes > 0) {
    parts.push(`${duration.minutes} min`);
  }
  
  return parts.join(' ') || '0 min';
}
