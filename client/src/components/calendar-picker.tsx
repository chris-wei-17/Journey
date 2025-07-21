import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";

interface CalendarPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose?: () => void;
}

export function CalendarPicker({ selectedDate, onDateSelect, onClose }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
    onClose?.();
  };

  return (
    <Card className="absolute top-full left-0 right-0 mt-2 z-50 bg-white/95 backdrop-blur-sm shadow-xl border-0" style={{
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    }}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePrevMonth}
            className="p-2 h-8 w-8 flex items-center justify-center"
          >
            <i className="fas fa-chevron-left text-sm"></i>
          </Button>
          
          <h3 className="font-semibold text-lg text-gray-800">
            {format(currentMonth, "MMMM yyyy").toUpperCase()}
          </h3>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleNextMonth}
            className="p-2 h-8 w-8 flex items-center justify-center"
          >
            <i className="fas fa-chevron-right text-sm"></i>
          </Button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => (
            <Button
              key={day.toISOString()}
              variant="ghost"
              size="sm"
              onClick={() => handleDateClick(day)}
              className={`
                h-8 w-8 p-0 text-sm font-normal
                ${isSameDay(day, selectedDate) 
                  ? 'bg-gray-800 text-white hover:bg-gray-700' 
                  : isToday(day)
                  ? 'text-yellow-600 font-semibold hover:bg-yellow-50'
                  : isSameMonth(day, currentMonth)
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-400 hover:bg-gray-50'
                }
              `}
            >
              {format(day, 'd')}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}