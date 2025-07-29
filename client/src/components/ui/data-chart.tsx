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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays, addDays, startOfDay } from "date-fns";
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface DataPoint {
  date: string;
  value: number;
}

interface DataChartProps {
  title: string;
  data: DataPoint[];
  lineColor?: string;
  backgroundColor?: string;
  yAxisLabel?: string;
}

type TimeRange = '7d' | '14d' | '30d' | '90d';

const timeRangeOptions = [
  { value: '7d' as TimeRange, label: '7D', days: 7 },
  { value: '14d' as TimeRange, label: '14D', days: 14 },
  { value: '30d' as TimeRange, label: '30D', days: 30 },
  { value: '90d' as TimeRange, label: '90D', days: 90 },
];

export function DataChart({ 
  title, 
  data, 
  lineColor = '#3b82f6', 
  backgroundColor = 'rgba(59, 130, 246, 0.1)',
  yAxisLabel = 'Y Axis'
}: DataChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  
  // Get the date range based on selected time range
  const getDaysForRange = (range: TimeRange) => {
    return timeRangeOptions.find(opt => opt.value === range)?.days || 7;
  };

  // Filter data based on time range
  const getFilteredData = () => {
    const days = getDaysForRange(timeRange);
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    return data.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= startOfDay(startDate) && pointDate <= endDate;
    });
  };

  const filteredData = getFilteredData();
  
  // Generate complete date range for x-axis
  const generateDateRange = () => {
    const days = getDaysForRange(timeRange);
    const dates = [];
    const endDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      dates.push(format(subDays(endDate, i), 'yyyy-MM-dd'));
    }
    return dates;
  };

  const dateRange = generateDateRange();

  // Create chart data
  const chartData = {
    labels: dateRange,
    datasets: [
      {
        label: title,
        data: dateRange.map(date => {
          const point = filteredData.find(p => 
            format(new Date(p.date), 'yyyy-MM-dd') === date
          );
          return point ? point.value : null;
        }),
        borderColor: lineColor,
        backgroundColor: backgroundColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: false, // Don't connect null values
      },
    ],
  };

  const options = {
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
        borderColor: lineColor,
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
          text: yAxisLabel,
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

  return (
    <Card className="bg-white/75 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {title}
          </CardTitle>
          
          {/* Time Range Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit scale-60 origin-center">
            {timeRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(option.value)}
                className={`text-xs px-2 py-1 h-7 ${
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
      
      <CardContent className="pt-0">
        <div className="h-64 w-full">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}