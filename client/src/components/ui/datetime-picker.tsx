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
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const selectedIndex = options.findIndex(option => option === value);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const index = Math.round(currentScrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
    
    if (options[clampedIndex] !== value) {
      onChange(options[clampedIndex]);
    }
  };

  const snapToNearest = () => {
    if (!containerRef.current) return;
    
    const currentScrollTop = containerRef.current.scrollTop;
    const index = Math.round(currentScrollTop / itemHeight);
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
    
    containerRef.current.scrollTo({
      top: clampedIndex * itemHeight,
      behavior: 'smooth'
    });
    
    if (options[clampedIndex] !== value) {
      onChange(options[clampedIndex]);
    }
  };

  // Only set initial position, don't force it back
  useEffect(() => {
    if (containerRef.current && !hasInitialized && selectedIndex >= 0) {
      containerRef.current.scrollTop = selectedIndex * itemHeight;
      setHasInitialized(true);
    }
  }, [selectedIndex, itemHeight, hasInitialized]);

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
            className={`flex items-center justify-center text-center select-none transition-all duration-200 cursor-pointer ${
              option === value 
                ? 'text-blue-600 font-semibold text-lg' 
                : 'text-gray-600 text-base'
            }`}
            style={{ 
              height: `${itemHeight}px`,
              scrollSnapAlign: 'center'
            }}
            onClick={() => {
              onChange(option);
              if (containerRef.current) {
                containerRef.current.scrollTo({
                  top: index * itemHeight,
                  behavior: 'smooth'
                });
              }
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
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // Smart year logic: if current month is December, January dates are next year
  // If current month is not December, December dates are previous year
  const getYearForMonth = (monthIndex: number) => {
    if (currentMonth === 11 && monthIndex === 0) { // December current, January selected
      return currentYear + 1;
    } else if (currentMonth !== 11 && monthIndex === 11) { // Not December current, December selected
      return currentYear - 1;
    }
    return currentYear;
  };
  
  const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periods = ['AM', 'PM'];

  // Parse current values - avoid timezone issues by parsing the date string directly
  const [yearStr, monthStr, dayStr] = tempDate.split('-');
  const selectedYear = parseInt(yearStr);
  const selectedMonthIndex = parseInt(monthStr) - 1; // Month is 0-indexed
  const selectedDay = dayStr;
  const selectedMonth = months[selectedMonthIndex];
  
  const timeObj = tempTime.split(':');
  const hour24 = parseInt(timeObj[0]);
  const minute = timeObj[1];
  
  const currentHour = hour24 === 0 ? '12' : hour24 > 12 ? String(hour24 - 12).padStart(2, '0') : String(hour24).padStart(2, '0');
  const currentPeriod = hour24 >= 12 ? 'PM' : 'AM';

  // Get days for the selected month/year using the smart year
  const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

  const formatDisplayValue = () => {
    // Parse date string directly to avoid timezone issues
    const [year, month, day] = value.date.split('-');
    const monthIndex = parseInt(month) - 1;
    const dayNum = parseInt(day);
    
    const timeStr = value.time;
    const [hour, minute] = timeStr.split(':');
    const hour24 = parseInt(hour);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    
    return `${months[monthIndex]} ${dayNum} at ${hour12}:${minute} ${period}`;
  };

  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month);
    const yearForMonth = getYearForMonth(monthIndex);
    const day = Math.min(parseInt(selectedDay), new Date(yearForMonth, monthIndex + 1, 0).getDate());
    const newDate = `${yearForMonth}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setTempDate(newDate);
  };

  const handleDayChange = (day: string) => {
    const yearForMonth = getYearForMonth(selectedMonthIndex);
    const newDate = `${yearForMonth}-${String(selectedMonthIndex + 1).padStart(2, '0')}-${String(parseInt(day)).padStart(2, '0')}`;
    console.log('🗓️ Day Change Debug:', {
      selectedDay: day,
      selectedMonthIndex,
      yearForMonth,
      newDate,
      tempDate: tempDate
    });
    setTempDate(newDate);
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
    console.log('💾 DateTime Save Debug:', {
      tempDate,
      tempTime,
      formatDisplayValue: formatDisplayValue()
    });
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
          
          {/* Date & Time Pickers */}
          <div className="mb-6">
            <div className="grid grid-cols-5 gap-2">
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Month</p>
                <WheelPicker
                  options={months}
                  value={selectedMonth}
                  onChange={handleMonthChange}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 text-center">Day</p>
                <WheelPicker
                  options={days}
                  value={selectedDay}
                  onChange={handleDayChange}
                />
              </div>
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