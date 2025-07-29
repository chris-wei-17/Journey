import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DateTimePickerProps {
  label: string;
  value: { date: string; time: string }; // date: YYYY-MM-DD, time: HH:MM
  onChange: (value: { date: string; time: string }) => void;
  className?: string;
}

interface WheelPickerProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function WheelPicker({ options, value, onChange, className = "" }: WheelPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 40; // Height of each item in pixels
  
  const selectedIndex = options.findIndex(option => option === value);
  const scrollTop = selectedIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isDragging) return;
    
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
    
    if (options[clampedIndex] !== value) {
      onChange(options[clampedIndex]);
    }
  };

  const snapToNearest = () => {
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
    
    containerRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: 'smooth'
    });
    
    if (options[clampedIndex] !== value) {
      onChange(options[clampedIndex]);
    }
  };

  useEffect(() => {
    if (containerRef.current && !isDragging) {
      containerRef.current.scrollTop = scrollTop;
    }
  }, [value, scrollTop, isDragging]);

  return (
    <div className={`relative ${className}`}>
      {/* Selection indicator */}
      <div 
        className="absolute left-0 right-0 bg-blue-500/20 border-y-2 border-blue-500 pointer-events-none z-10"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          height: `${itemHeight}px`
        }}
      />
      
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-32 overflow-y-scroll scrollbar-hide"
        style={{ 
          scrollSnapType: 'y mandatory',
          paddingTop: `${itemHeight}px`,
          paddingBottom: `${itemHeight}px`
        }}
        onScroll={handleScroll}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => {
          setIsDragging(false);
          snapToNearest();
        }}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => {
          setIsDragging(false);
          snapToNearest();
        }}
      >
        {options.map((option, index) => (
          <div
            key={option}
            className={`flex items-center justify-center text-center select-none transition-all duration-200 ${
              option === value 
                ? 'text-blue-600 font-semibold text-lg' 
                : 'text-gray-600 text-base'
            }`}
            style={{ 
              height: `${itemHeight}px`,
              scrollSnapAlign: 'center'
            }}
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DateTimePicker({ label, value, onChange, className = "" }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value.date);
  const [tempTime, setTempTime] = useState(value.time);

  // Generate options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => String(currentYear - 5 + i));
  
  const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periods = ['AM', 'PM'];

  // Parse current values
  const dateObj = new Date(tempDate);
  const timeObj = tempTime.split(':');
  const hour24 = parseInt(timeObj[0]);
  const minute = timeObj[1];
  
  const currentMonth = months[dateObj.getMonth()];
  const currentDay = String(dateObj.getDate()).padStart(2, '0');
  const currentYear_str = String(dateObj.getFullYear());
  const currentHour = hour24 === 0 ? '12' : hour24 > 12 ? String(hour24 - 12).padStart(2, '0') : String(hour24).padStart(2, '0');
  const currentPeriod = hour24 >= 12 ? 'PM' : 'AM';

  // Get days for the selected month/year
  const daysInMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

  const formatDisplayValue = () => {
    const date = new Date(value.date);
    const timeStr = value.time;
    const [hour, minute] = timeStr.split(':');
    const hour24 = parseInt(hour);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    
    return `${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })} at ${hour12}:${minute} ${period}`;
  };

  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month);
    const newDate = new Date(parseInt(currentYear_str), monthIndex, parseInt(currentDay));
    setTempDate(newDate.toISOString().split('T')[0]);
  };

  const handleDayChange = (day: string) => {
    const newDate = new Date(parseInt(currentYear_str), months.indexOf(currentMonth), parseInt(day));
    setTempDate(newDate.toISOString().split('T')[0]);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(parseInt(year), months.indexOf(currentMonth), parseInt(currentDay));
    setTempDate(newDate.toISOString().split('T')[0]);
  };

  const handleHourChange = (hour: string) => {
    const hour24 = currentPeriod === 'AM' 
      ? (hour === '12' ? 0 : parseInt(hour))
      : (hour === '12' ? 12 : parseInt(hour) + 12);
    
    setTempTime(`${String(hour24).padStart(2, '0')}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    const hour24 = currentPeriod === 'AM' 
      ? (currentHour === '12' ? 0 : parseInt(currentHour))
      : (currentHour === '12' ? 12 : parseInt(currentHour) + 12);
    
    setTempTime(`${String(hour24).padStart(2, '0')}:${newMinute}`);
  };

  const handlePeriodChange = (period: string) => {
    const currentHourNum = parseInt(currentHour);
    const hour24 = period === 'AM' 
      ? (currentHourNum === 12 ? 0 : currentHourNum)
      : (currentHourNum === 12 ? 12 : currentHourNum + 12);
    
    setTempTime(`${String(hour24).padStart(2, '0')}:${minute}`);
  };

  const handleSave = () => {
    onChange({ date: tempDate, time: tempTime });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(value.date);
    setTempTime(value.time);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className={className}>
        <label className="text-white mb-2 block text-sm font-medium">{label}</label>
        <Card 
          className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-white">{formatDisplayValue()}</span>
              <i className="fas fa-chevron-right text-gray-400"></i>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${className}`}>
      <Card className="bg-white max-w-md w-full max-h-[90vh] overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">{label}</h3>
          
          {/* Date Pickers */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Date</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Month</p>
                <WheelPicker
                  options={months}
                  value={currentMonth}
                  onChange={handleMonthChange}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Day</p>
                <WheelPicker
                  options={days}
                  value={currentDay}
                  onChange={handleDayChange}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Year</p>
                <WheelPicker
                  options={years}
                  value={currentYear_str}
                  onChange={handleYearChange}
                />
              </div>
            </div>
          </div>

          {/* Time Pickers */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Time</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Hour</p>
                <WheelPicker
                  options={hours}
                  value={currentHour}
                  onChange={handleHourChange}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Min</p>
                <WheelPicker
                  options={minutes}
                  value={minute}
                  onChange={handleMinuteChange}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">AM/PM</p>
                <WheelPicker
                  options={periods}
                  value={currentPeriod}
                  onChange={handlePeriodChange}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}