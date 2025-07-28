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
