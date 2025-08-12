import { format, subDays, startOfDay } from "date-fns";

// Calorie conversion constants
export const CALORIES_PER_GRAM = {
  fat: 9,
  protein: 4,
  carbs: 4,
} as const;

export interface MacroEntry {
  id: number;
  userId: number;
  description: string;
  protein: number | string;
  fats: number | string;
  carbs: number | string;
  calories?: number | string | null;
  date: string;
  createdAt: string;
}

export interface MacroTarget {
  id: number;
  userId: number;
  proteinTarget: number;
  fatsTarget: number;
  carbsTarget: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalorieDataPoint {
  date: string;
  value: number;
}

export interface MacroSummary {
  protein: number;
  fats: number;
  carbs: number;
  totalCalories: number;
}

/**
 * Calculate total calories from macro grams
 */
export function calculateCalories(protein: number, fats: number, carbs: number): number {
  return (
    protein * CALORIES_PER_GRAM.protein +
    fats * CALORIES_PER_GRAM.fat +
    carbs * CALORIES_PER_GRAM.carbs
  );
}

/**
 * Calculate macro summary for a single day
 */
export function calculateDayMacros(macros: MacroEntry[]): MacroSummary {
  const totals = macros.reduce(
    (acc, macro) => ({
      protein: acc.protein + (Number(macro.protein) || 0),
      fats: acc.fats + (Number(macro.fats) || 0),
      carbs: acc.carbs + (Number(macro.carbs) || 0),
    }),
    { protein: 0, fats: 0, carbs: 0 }
  );

  // Sum calories across entries: prefer explicit calories field when present (>0), else compute from grams
  const totalCalories = macros.reduce((sum, macro) => {
    const calField = macro.calories !== undefined && macro.calories !== null ? Number(macro.calories) : 0;
    if (calField && isFinite(calField) && calField > 0) {
      return sum + calField;
    }
    const p = Number(macro.protein) || 0;
    const f = Number(macro.fats) || 0;
    const c = Number(macro.carbs) || 0;
    return sum + calculateCalories(p, f, c);
  }, 0);

  return {
    ...totals,
    totalCalories,
  };
}

/**
 * Generate calorie data points for chart from macro entries grouped by date
 */
export function generateCalorieData(
  macrosByDate: Record<string, MacroEntry[]>,
  days: number = 7
): CalorieDataPoint[] {
  const endDate = new Date();
  const dataPoints: CalorieDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(endDate, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayMacros = macrosByDate[dateKey] || [];
    
    if (dayMacros.length > 0) {
      const summary = calculateDayMacros(dayMacros);
      dataPoints.push({
        date: dateKey,
        value: summary.totalCalories,
      });
    }
  }

  return dataPoints;
}

/**
 * Calculate macro percentages for donut charts
 */
export function calculateMacroPercentages(
  current: MacroSummary,
  targets: MacroTarget
): {
  protein: number;
  fats: number;
  carbs: number;
} {
  return {
    protein: targets.proteinTarget > 0 ? (current.protein / targets.proteinTarget) * 100 : 0,
    fats: targets.fatsTarget > 0 ? (current.fats / targets.fatsTarget) * 100 : 0,
    carbs: targets.carbsTarget > 0 ? (current.carbs / targets.carbsTarget) * 100 : 0,
  };
}