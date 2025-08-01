import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getCommonTimezones, 
  getUserTimezone, 
  setUserTimezone, 
  getDetectedTimezone,
  formatInUserTimezone 
} from "@/lib/timezone-utils";
import { useToast } from "@/hooks/use-toast";

interface TimezoneSettingsProps {
  className?: string;
}

export function TimezoneSettings({ className }: TimezoneSettingsProps) {
  const [currentTimezone, setCurrentTimezone] = useState<string>('');
  const [detectedTimezone, setDetectedTimezone] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    setCurrentTimezone(getUserTimezone());
    setDetectedTimezone(getDetectedTimezone());
  }, []);

  const handleTimezoneChange = (newTimezone: string) => {
    setCurrentTimezone(newTimezone);
    setUserTimezone(newTimezone);
    
    toast({
      title: "Timezone Updated",
      description: `Timezone changed to ${newTimezone}`,
    });
  };

  const handleAutoDetect = () => {
    const detected = getDetectedTimezone();
    setCurrentTimezone(detected);
    setUserTimezone(detected);
    
    toast({
      title: "Timezone Auto-detected",
      description: `Set to ${detected}`,
    });
  };

  const timezones = getCommonTimezones();
  const currentTime = formatInUserTimezone(new Date(), 'PPP p');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <i className="fas fa-globe mr-2"></i>
          Timezone Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Current Timezone
          </label>
          <Select value={currentTimezone} onValueChange={handleTimezoneChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <div>
            <strong>Current time:</strong> {currentTime}
          </div>
          <div>
            <strong>Detected timezone:</strong> {detectedTimezone}
          </div>
        </div>

        {currentTimezone !== detectedTimezone && (
          <Button 
            variant="outline" 
            onClick={handleAutoDetect}
            className="w-full"
          >
            <i className="fas fa-location-arrow mr-2"></i>
            Use Auto-detected Timezone
          </Button>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Note:</strong> Changing your timezone affects how dates are displayed and when journal entries are created. 
          All existing entries will be shown according to your new timezone setting.
        </div>
      </CardContent>
    </Card>
  );
}