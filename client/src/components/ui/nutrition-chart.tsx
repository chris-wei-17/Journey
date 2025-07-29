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
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import {
  generateCalorieData,
  calculateDayMacros,
  calculateMacroPercentages,
  type MacroEntry,
  type MacroTarget,
} from "@/lib/nutrition-utils";
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  const { data: allMacros = [] } = useQuery<MacroEntry[]>({
    queryKey: ['/api/macros'],
  });

  // Fetch macro targets
  const { data: macroTargets } = useQuery<MacroTarget>({
    queryKey: ['/api/macro-targets'],
  });

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
        const macroDate = new Date(macro.date);
        return macroDate >= startDate && macroDate <= endDate;
      })
      .forEach(macro => {
        const dateKey = format(new Date(macro.date), 'yyyy-MM-dd');
        if (!macrosByDate[dateKey]) {
          macrosByDate[dateKey] = [];
        }
        macrosByDate[dateKey].push(macro);
      });

    return macrosByDate;
  };

  const macrosByDate = getMacrosByDate();
  const calorieData = generateCalorieData(macrosByDate, getDaysForRange(timeRange));

  // Get today's macros for donut charts
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMacros = macrosByDate[today] || [];
  const todaySummary = calculateDayMacros(todayMacros);
  const macroPercentages = macroTargets 
    ? calculateMacroPercentages(todaySummary, macroTargets)
    : { protein: 0, fats: 0, carbs: 0 };

  // Line chart data
  const chartData = {
    labels: calorieData.map(point => point.date),
    datasets: [
      {
        label: 'Daily Calories',
        data: calorieData.map(point => point.value || null),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1, // Low weight line
        fill: false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#10b981',
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
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 8,
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
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
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

  return {
    chart: (
    <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            Daily Calories
          </CardTitle>
          
          {/* Time Range Selector */}
          <div className="flex gap-0.5 bg-gray-100 rounded-md p-0.5 w-fit">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(option.value)}
                className={`text-xs px-1.5 py-0.5 h-5 min-w-0 ${
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
      
      <CardContent className="pt-0 space-y-6">
        {/* Line Chart */}
        <div className="h-64 w-full">
          <Line data={chartData} options={lineOptions} />
        </div>

        {/* Today's Total Calories */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">Today's Total</p>
          <p className="text-xl font-bold text-gray-800">
            {Math.round(todaySummary.totalCalories)} calories
          </p>
        </div>
      </CardContent>
    </Card>
    ),
    macroData: {
      todaySummary,
      macroTargets,
      macroPercentages,
      proteinDonut,
      fatsDonut,
      carbsDonut,
    }
  };
}