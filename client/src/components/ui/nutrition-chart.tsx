import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { createDateFromString } from "@/lib/date-utils";
import {
  generateCalorieData,
  calculateDayMacros,
  calculateMacroPercentages,
  type MacroEntry,
  type MacroTarget,
  type CalorieDataPoint,
} from "@/lib/nutrition-utils";
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement
);

type TimeRange = '7d' | '14d' | '30d' | '90d';

const timeRangeOptions = [
  { value: '7d' as TimeRange, label: '7D', days: 7 },
  { value: '14d' as TimeRange, label: '14D', days: 14 },
  { value: '30d' as TimeRange, label: '30D', days: 30 },
  { value: '90d' as TimeRange, label: '90D', days: 90 },
];

export function NutritionChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // Fetch macro data for the time range
  const { data: allMacros = [], error: macrosError, isLoading: macrosLoading } = useQuery<MacroEntry[]>({
    queryKey: ['/api/macros'],
  });

  // Fetch macro targets
  const { data: macroTargets, error: targetsError, isLoading: targetsLoading } = useQuery<MacroTarget>({
    queryKey: ['/api/macro-targets'],
  });

  // Debug logging
  console.log('NutritionChart Debug:', {
    allMacros,
    macroTargets,
    macrosError,
    targetsError,
    macrosLoading,
    targetsLoading
  });

  // Additional debug for date issues
  if (allMacros.length > 0) {
    console.log('Sample macro dates:', allMacros.slice(0, 3).map(m => ({ id: m.id, date: m.date, dateType: typeof m.date })));
  }

  // Get days for current range
  const getDaysForRange = (range: TimeRange) => {
    return timeRangeOptions.find(opt => opt.value === range)?.days || 7;
  };

  // Group macros by date and filter by time range
  const getMacrosByDate = () => {
    const days = getDaysForRange(timeRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    const macrosByDate: Record<string, MacroEntry[]> = {};
    
    allMacros
      .filter(macro => {
        try {
          // Add validation for macro.date
          if (!macro.date) {
            console.warn('Macro entry missing date:', macro);
            return false;
          }
          
          const macroDate = new Date(macro.date);
          
          // Check if date is valid
          if (isNaN(macroDate.getTime())) {
            console.warn('Invalid date in macro entry:', macro.date, macro);
            return false;
          }
          
          return macroDate >= startDate && macroDate <= endDate;
        } catch (error) {
          console.error('Error processing macro date:', macro.date, error);
          return false;
        }
      })
      .forEach(macro => {
        try {
          const macroDate = new Date(macro.date);
          const dateKey = format(macroDate, 'yyyy-MM-dd');
          
          if (!macrosByDate[dateKey]) {
            macrosByDate[dateKey] = [];
          }
          macrosByDate[dateKey].push(macro);
        } catch (error) {
          console.error('Error formatting macro date:', macro.date, error);
        }
      });

    return macrosByDate;
  };

  const macrosByDate = getMacrosByDate();
  
  // Safely generate calorie data with error handling
  let calorieData: CalorieDataPoint[] = [];
  try {
    calorieData = generateCalorieData(macrosByDate, getDaysForRange(timeRange));
  } catch (error) {
    console.error('Error generating calorie data:', error);
    // Provide empty data if generation fails
    calorieData = [];
  }

  // Generate date range keys for the selected time window
  const daysInRange = getDaysForRange(timeRange);
  const dateKeys = Array.from({ length: daysInRange }, (_, idx) =>
    format(subDays(new Date(), daysInRange - 1 - idx), 'yyyy-MM-dd')
  );

  // Build daily macro totals aligned to dateKeys
  const dailyMacroSummaries = dateKeys.map(dateKey => calculateDayMacros(macrosByDate[dateKey] || []));

  // Macro series for triple bar chart
  const proteinSeries = dateKeys.map((dateKey, i) => ({ x: dateKey, y: dailyMacroSummaries[i].protein || 0 }));
  const fatsSeries = dateKeys.map((dateKey, i) => ({ x: dateKey, y: dailyMacroSummaries[i].fats || 0 }));
  const carbsSeries = dateKeys.map((dateKey, i) => ({ x: dateKey, y: dailyMacroSummaries[i].carbs || 0 }));

  // Dynamic bar thickness by time range
  const macroBarThickness = timeRange === '7d' ? 9 : timeRange === '14d' ? 4 : timeRange === '30d' ? 2 : 1;

  // Get today's macros for donut charts
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMacros = macrosByDate[today] || [];
  const todaySummary = calculateDayMacros(todayMacros);
  
  // Use default targets if none are set
  const defaultTargets = {
    proteinTarget: 150,
    fatsTarget: 80,
    carbsTarget: 200,
  };
  
  // More robust check for valid macro targets
  const hasValidTargets = macroTargets && 
    typeof macroTargets.proteinTarget === 'number' && 
    typeof macroTargets.fatsTarget === 'number' && 
    typeof macroTargets.carbsTarget === 'number' &&
    macroTargets.proteinTarget > 0 &&
    macroTargets.fatsTarget > 0 &&
    macroTargets.carbsTarget > 0;
  
  const effectiveTargets = hasValidTargets ? macroTargets : defaultTargets;
  
  console.log('Macro targets debug:', { 
    macroTargets, 
    hasValidTargets, 
    effectiveTargets 
  });
  
  // Safely calculate macro percentages with error handling
  let macroPercentages = { protein: 0, fats: 0, carbs: 0 };
  try {
    const rawPercentages = calculateMacroPercentages(todaySummary, effectiveTargets);
    
    // Ensure percentages are valid numbers
    macroPercentages = {
      protein: isFinite(rawPercentages.protein) ? Math.max(0, rawPercentages.protein) : 0,
      fats: isFinite(rawPercentages.fats) ? Math.max(0, rawPercentages.fats) : 0,
      carbs: isFinite(rawPercentages.carbs) ? Math.max(0, rawPercentages.carbs) : 0,
    };
    
    console.log('Macro percentages debug:', {
      todaySummary,
      effectiveTargets,
      rawPercentages,
      macroPercentages
    });
  } catch (error) {
    console.error('Error calculating macro percentages:', error);
    // Use default empty percentages if calculation fails
  }

  // Line chart data - use x/y format for time series
  const chartData = {
    datasets: [
      {
        label: 'Daily Calories',
        data: calorieData.map(point => ({
          x: point.date,
          y: isFinite(point.value) ? point.value : null
        })),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1, // Low weight line
        fill: false,
        tension: 0.4,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#7c3aed',
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: false,
        yAxisID: 'y',
        type: 'line',
      },
      {
        label: 'Protein',
        data: proteinSeries,
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
        yAxisID: 'y1',
        type: 'bar',
        barThickness: macroBarThickness,
      },
      {
        label: 'Fats',
        data: fatsSeries,
        backgroundColor: '#eab308',
        borderColor: '#eab308',
        yAxisID: 'y1',
        type: 'bar',
        barThickness: macroBarThickness,
      },
      {
        label: 'Carbs',
        data: carbsSeries,
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
        yAxisID: 'y1',
        type: 'bar',
        barThickness: macroBarThickness,
      },
    ],
  };

  // Create dynamic chart options that respond to time range changes
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          padding: 6,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#7c3aed',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'MMM d'
          }
        },
        min: format(subDays(new Date(), getDaysForRange(timeRange) - 1), 'yyyy-MM-dd'),
        max: format(new Date(), 'yyyy-MM-dd'),
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
          color: '#6b7280',
          display: true,
          font: {
            size: 10,
          },
        },
        border: {
          display: true,
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: '#6b7280',
        },
        title: {
          display: true,
          text: 'Calories',
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#6b7280',
        },
        title: {
          display: true,
          text: 'Macros (g)',
          color: '#6b7280',
          font: {
            size: 12,
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    layout: {
      padding: {
        bottom: 2,
      },
    },
  };

  // Donut chart configurations
  const createDonutConfig = (percentage: number, color: string, label: string) => ({
    data: {
      datasets: [{
        data: [percentage, Math.max(0, 100 - percentage)],
        backgroundColor: [color, '#f3f4f6'],
        borderWidth: 0,
        cutout: '70%',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    }
  });

  const proteinDonut = createDonutConfig(macroPercentages.protein, '#ef4444', 'Protein');
  const fatsDonut = createDonutConfig(macroPercentages.fats, '#eab308', 'Fats');
  const carbsDonut = createDonutConfig(macroPercentages.carbs, '#22c55e', 'Carbs');

  // Show loading state
  if (macrosLoading || targetsLoading) {
    return (
      <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading nutrition data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (macrosError || targetsError) {
    return (
      <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600">Error loading nutrition data</p>
            <p className="text-sm text-gray-500 mt-2">
              {macrosError?.message || targetsError?.message}
            </p>
            <details className="mt-4 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
              <pre className="text-xs text-gray-400 mt-2 overflow-auto max-h-32">
                {JSON.stringify({ 
                  macrosError: macrosError?.message, 
                  targetsError: targetsError?.message,
                  macrosCount: allMacros?.length || 0,
                  sampleMacro: allMacros?.[0] || null
                }, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Main Chart */}
      <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">
              Daily Calories
            </CardTitle>
            
            {/* Time Range Selector */}
            <div className="flex gap-0.5 bg-gray-100 rounded-md p-0 w-fit">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={timeRange === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(option.value)}
                  className={`text-[10px] px-1 py-0 h-4 min-w-0 ${
                    timeRange === option.value
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Line Chart */}
                    <div className="h-64 w-full">
            <Line data={chartData} options={lineOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Macro donuts moved to dashboard */}
    </>
  );
}