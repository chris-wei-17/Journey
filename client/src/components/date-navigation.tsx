import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarPicker } from "./calendar-picker";
import { format, isToday, addDays, subDays } from "date-fns";

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleTodayClick = () => {
    setShowCalendar(!showCalendar);
  };

  const handleDateSelect = (date: Date) => {
    onDateChange(date);
    setShowCalendar(false);
  };

  return (
    <div className="relative mb-6">
      <div className="flex items-center justify-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handlePrevDay}
          className="text-gray-600 hover:text-gray-800 hover:bg-white/50 p-3 h-10 w-10 flex items-center justify-center"
        >
          <i className="fas fa-chevron-left text-lg"></i>
        </Button>
        
        <Button
          variant="outline"
          onClick={handleTodayClick}
          className={`
            px-6 py-2 font-semibold transition-all duration-200 min-w-[140px] h-10
            ${isToday(selectedDate) 
              ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700 shadow-lg' 
              : 'bg-white/80 text-gray-700 border-gray-300 hover:bg-white/90 shadow-md'
            }
          `}
        >
          {isToday(selectedDate) ? 'TODAY' : format(selectedDate, 'EEE, MMM d').toUpperCase()}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleNextDay}
          className="text-gray-600 hover:text-gray-800 hover:bg-white/50 p-3 h-10 w-10 flex items-center justify-center"
        >
          <i className="fas fa-chevron-right text-lg"></i>
        </Button>
      </div>

      {showCalendar && (
        <CalendarPicker
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}