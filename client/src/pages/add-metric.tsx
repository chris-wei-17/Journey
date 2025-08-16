import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

const UNITS = {
  weight_lb: ["lb"],
  weight_kg:["kg"],
  length_inch: ["in"],
  length_cm: ["cm"],
  percentage: ["%"],
  count: ["reps", "count"]
};

const COMMON_METRICS = [
  { name: "Waist", unit: "length_inch" },
  { name: "Chest", unit: "length_inch" },
  { name: "Bicep", unit: "length_inch" },
  { name: "Thighs", unit: "length_inch" },
  { name: "Body Fat %", unit: "percentage" }
];

export default function AddMetric() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldUnit, setNewFieldUnit] = useState("length");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get date from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      // Create date safely to avoid timezone issues
      const [year, month, day] = dateParam.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
  }, []);

  const createCustomFieldMutation = useMutation({
    mutationFn: async (data: { fieldName: string; unit: string }) => {
      console.log('Creating custom metric field:', data);
      const result = await apiRequest("POST", "/api/custom-metric-fields", data);
      console.log('Custom metric field created:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Custom field creation successful:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/custom-metric-fields"] });
      toast({
        title: "Success",
        description: "Custom metric added successfully!",
      });
      // Return to home with the selected date
      const dateParam = format(selectedDate, 'yyyy-MM-dd');
      setLocation(`/?date=${dateParam}`);
    },
    onError: (error) => {
      console.error('Error creating custom metric field:', error);
      toast({
        title: "Error",
        description: "Failed to add custom metric. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    console.log('handleSubmit called', { newFieldName, newFieldUnit });
    if (!newFieldName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a metric name.",
        variant: "destructive",
      });
      return;
    }

    const unitType = newFieldUnit;
    const unit = UNITS[unitType as keyof typeof UNITS][0];
    console.log('Creating field with:', { fieldName: newFieldName.trim(), unit });
    createCustomFieldMutation.mutate({ 
      fieldName: newFieldName.trim(),
      unit: unit
    });
  };

  return (
    <div className="app-gradient-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mt-12 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            const dateParam = format(selectedDate, 'yyyy-MM-dd');
            setLocation(`/?date=${dateParam}`);
          }}
          className="p-2 text-white hover:bg-white/20"
        >
          <i className="fas fa-chevron-left text-xl"></i>
        </Button>
        <h1 className="text-xl font-bold text-white">ADD CUSTOM METRIC</h1>
        <div 
          onClick={() => {
            const dateParam = format(selectedDate, 'yyyy-MM-dd');
            setLocation(`/?date=${dateParam}`);
          }}
          className="w-10 h-10 flex items-center justify-center cursor-pointer text-black bg-white/90 hover:bg-white rounded-full"
        >
          <i className="fas fa-times text-xl text-black"></i>
        </div>
      </div>

      <main className="px-4 max-w-lg mx-auto">
        {/* Metric Name Section */}
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm font-medium mb-4 tracking-wide">METRIC NAME</h3>
          <Card className="bg-gray-800 border-0 mb-4">
            <CardContent className="p-4">
              <Label className="text-white mb-2 block">Select Common Metric</Label>
              <Select value={newFieldName} onValueChange={setNewFieldName}>
                <SelectTrigger className="bg-transparent border-gray-600 text-white">
                  <SelectValue placeholder="Select a common metric" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_METRICS.map((metric) => (
                    <SelectItem key={metric.name} value={metric.name}>
                      {metric.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-0">
            <CardContent className="p-4">
              <Label className="text-white mb-2 block">Or Enter Custom Name</Label>
              <Input
                placeholder="e.g., Bicep, Neck, Body Water %..."
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="bg-transparent border-gray-600 text-white placeholder-gray-400 focus:ring-0 focus:outline-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Unit Type Section */}
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm font-medium mb-4 tracking-wide">UNIT TYPE</h3>
          <Card className="bg-gray-800 border-0">
            <CardContent className="p-4">
              <Label className="text-white mb-2 block">Measurement Unit</Label>
              <Select value={newFieldUnit} onValueChange={setNewFieldUnit}>
                <SelectTrigger className="bg-transparent border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="length_inch">Length (in)</SelectItem>
                  <SelectItem value="length_cm">Length (cm)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="count">Count/Reps</SelectItem>
                  <SelectItem value="weight_lb">Max. Weight (lb)</SelectItem>
                  <SelectItem value="weight_kg">Max. Weight (kg)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSubmit}
          disabled={!newFieldName.trim() || createCustomFieldMutation.isPending}
          className="w-full bg-white/20 hover:bg-white/30 text-white py-4 rounded-lg text-lg font-medium transition-all duration-200 disabled:opacity-50"
        >
          {createCustomFieldMutation.isPending ? "ADDING..." : "ADD METRIC"}
        </Button>
      </main>
    </div>
  );
}