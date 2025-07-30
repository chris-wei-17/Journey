import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import type { MetricEntry, CustomMetricField } from "@shared/schema";

interface MetricsBlockProps {
  selectedDate: Date;
}

const UNITS = {
  weight: ["lbs", "kg"],
  length: ["in", "cm"],
  percentage: ["%"],
  count: ["reps", "count"]
};

const COMMON_METRICS = [
  { name: "Waist", unit: "length" },
  { name: "Chest", unit: "length" },
  { name: "Arms", unit: "length" },
  { name: "Thighs", unit: "length" },
  { name: "Hips", unit: "length" },
  { name: "Body Fat %", unit: "percentage" },
  { name: "Muscle Mass", unit: "percentage" }
];

export function MetricsBlock({ selectedDate }: MetricsBlockProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldUnit, setNewFieldUnit] = useState("length");

  const [tempValues, setTempValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch metrics for the selected date
  const { data: metrics = [] } = useQuery<MetricEntry[]>({
    queryKey: [`/api/metrics/date/${dateStr}`],
  });

  // Fetch custom metric fields
  const { data: customFields = [] } = useQuery<CustomMetricField[]>({
    queryKey: ["/api/custom-metric-fields"],
  });

  // Get current metric entry for today
  const currentMetric = metrics.find(m => format(new Date(m.date), 'yyyy-MM-dd') === dateStr);
  
  // Clear temp values when date changes
  useEffect(() => {
    setTempValues({});
  }, [dateStr]);

  // Debug logging
  console.log('Metrics Debug:', { tempValues, dateStr, currentMetric });

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
      setNewFieldName("");
      setNewFieldUnit("length");
      setIsAddingField(false);
    },
    onError: (error) => {
      console.error('Error creating custom metric field:', error);
    },
  });

  const deleteCustomFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      return apiRequest("DELETE", `/api/custom-metric-fields/${fieldId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-metric-fields"] });
      // Auto-exit edit mode if no custom fields remain
      if (customFields.length <= 1) {
        setIsEditMode(false);
      }
    },
  });

  const saveMetricsMutation = useMutation({
    mutationFn: async (data: { weight?: number; customFields: Record<string, number> }) => {
      return apiRequest("POST", "/api/metrics", {
        date: dateStr,
        weight: data.weight,
        customFields: data.customFields,
      });
    },
    onSuccess: (data) => {
      console.log('Metric saved successfully:', data);
      queryClient.invalidateQueries({ queryKey: [`/api/metrics/date/${dateStr}`] });
      // Clear temp values after successful save
      setTempValues({});
    },
    onError: (error) => {
      console.error('Error saving metric:', error);
    },
  });



  const handleFieldSave = (fieldName: string) => {
    // Get the current value from input (tempValues) or use empty string
    const inputValue = tempValues[fieldName] || "";
    console.log('Saving field:', fieldName, 'input value:', inputValue);
    
    if (!inputValue.trim()) {
      console.log('No value to save');
      return;
    }
    
    if (fieldName === "weight") {
      const weight = parseFloat(inputValue);
      const customFields = currentMetric?.customFields || {};
      console.log('Saving weight:', weight);
      saveMetricsMutation.mutate({ weight, customFields });
    } else {
      const weight = currentMetric?.weight;
      const customFields = { 
        ...(currentMetric?.customFields || {}), 
        [fieldName]: parseFloat(inputValue)
      };
      console.log('Saving custom field:', fieldName, 'value:', parseFloat(inputValue));
      saveMetricsMutation.mutate({ weight, customFields });
    }
  };

  const addCustomField = () => {
    console.log('addCustomField called', { newFieldName, newFieldUnit });
    if (newFieldName.trim()) {
      const unitType = newFieldUnit;
      const unit = UNITS[unitType as keyof typeof UNITS][0];
      console.log('Creating field with:', { fieldName: newFieldName.trim(), unit });
      createCustomFieldMutation.mutate({ 
        fieldName: newFieldName.trim(),
        unit: unit
      });
    } else {
      console.log('Field name is empty, not creating');
    }
  };

  return (
    <Card className="bg-white/75 backdrop-blur-sm shadow-xl mb-2 border-0" style={{
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    }}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
          <i className="fas fa-weight text-purple-500 mr-2"></i>
          Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Weight field - always present */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {isEditMode && (
                <div className="w-6 h-6 flex items-center justify-center opacity-30">
                  <i className="fas fa-ban text-gray-400 text-xs"></i>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700">Weight</span>
            </div>
                          <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={tempValues["weight"] ?? currentMetric?.weight?.toString() ?? ""}
                  onChange={(e) => setTempValues(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Enter weight"
                  className="w-20 h-8"
                />
                <span className="text-xs text-gray-500">lbs</span>
                <button
                  onClick={() => {
                    console.log('Save weight clicked!');
                    handleFieldSave("weight");
                  }}
                  disabled={saveMetricsMutation.isPending}
                  className="h-8 px-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded"
                >
                  {saveMetricsMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
          </div>

          {/* Custom fields */}
          {customFields.map((field) => (
            <div key={field.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {isEditMode && (
                  <button
                    onClick={() => deleteCustomFieldMutation.mutate(field.id)}
                    className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  >
                    <i className="fas fa-times text-white text-xs"></i>
                  </button>
                )}
                <span className="text-sm font-medium text-gray-700">{field.fieldName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={tempValues[field.fieldName] ?? currentMetric?.customFields?.[field.fieldName]?.toString() ?? ""}
                  onChange={(e) => setTempValues(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                  placeholder={`Enter ${field.fieldName.toLowerCase()}`}
                  className="w-20 h-8"
                />
                <span className="text-xs text-gray-500">{field.unit}</span>
                <button
                  onClick={() => {
                    console.log('Save', field.fieldName, 'clicked!');
                    handleFieldSave(field.fieldName);
                  }}
                  disabled={saveMetricsMutation.isPending}
                  className="h-8 px-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded"
                >
                  {saveMetricsMutation.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ))}

          {customFields.length === 0 && !currentMetric?.weight && (
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mt-4">
          <Dialog open={isAddingField} onOpenChange={setIsAddingField}>
            <DialogTrigger asChild>
              <Button 
                className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-200"
                onClick={() => setIsEditMode(false)}
              >
                <i className="fas fa-plus mr-2"></i>
                ADD CUSTOM METRIC
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Metric</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Metric Name</Label>
                  <Select value={newFieldName} onValueChange={setNewFieldName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or type custom metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_METRICS.map((metric) => (
                        <SelectItem key={metric.name} value={metric.name}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Or type custom metric name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Unit Type</Label>
                  <Select value={newFieldUnit} onValueChange={setNewFieldUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="length">Length (in/cm)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="count">Count/Reps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingField(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('Add Metric button clicked');
                      addCustomField();
                    }}
                    disabled={!newFieldName.trim() || createCustomFieldMutation.isPending}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    {createCustomFieldMutation.isPending ? "Adding..." : "Add Metric"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {customFields.length > 0 && (
            <Button 
              onClick={() => setIsEditMode(!isEditMode)}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-all duration-200"
            >
              <i className="fas fa-edit mr-2"></i>
              {isEditMode ? "DONE EDITING" : "EDIT METRICS"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}