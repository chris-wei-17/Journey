import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MetricsBlockProps {
  selectedDate: Date;
}

interface MetricEntry {
  id: number;
  userId: number;
  date: string;
  weight?: string;
  customFields: Record<string, number>;
  createdAt: string;
}

interface CustomMetricField {
  id: number;
  userId: number;
  fieldName: string;
  unit: string;
  createdAt: string;
}

const metricsSchema = z.object({
  weight: z.string().optional(),
  customFields: z.record(z.coerce.number()).optional(),
});

const customFieldSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  unit: z.string().min(1, "Unit is required"),
});

export function MetricsBlock({ selectedDate }: MetricsBlockProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [addFieldDialogOpen, setAddFieldDialogOpen] = React.useState(false);
  const [metricsDialogOpen, setMetricsDialogOpen] = React.useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Get today's metrics
  const { data: metrics } = useQuery<MetricEntry[]>({
    queryKey: ['/api/metrics/date', dateString],
  });

  // Get custom fields
  const { data: customFields = [] } = useQuery<CustomMetricField[]>({
    queryKey: ['/api/custom-metric-fields'],
  });

  const todaysMetric = metrics?.[0];

  const form = useForm<z.infer<typeof metricsSchema>>({
    resolver: zodResolver(metricsSchema),
    defaultValues: {
      weight: todaysMetric?.weight || "",
      customFields: todaysMetric?.customFields || {},
    },
  });

  const addFieldForm = useForm<z.infer<typeof customFieldSchema>>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      fieldName: "",
      unit: "",
    },
  });

  React.useEffect(() => {
    if (todaysMetric) {
      form.reset({
        weight: todaysMetric.weight || "",
        customFields: todaysMetric.customFields || {},
      });
    }
  }, [todaysMetric, form]);

  const updateMetricsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof metricsSchema>) => {
      return await apiRequest('/api/metrics', 'POST', {
        ...data,
        weight: data.weight || null,
        date: selectedDate.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/metrics/date', dateString] });
      setMetricsDialogOpen(false);
      toast({
        title: "Success",
        description: "Metrics updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update metrics",
        variant: "destructive",
      });
    },
  });

  const addCustomFieldMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customFieldSchema>) => {
      return await apiRequest('/api/custom-metric-fields', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-metric-fields'] });
      setAddFieldDialogOpen(false);
      addFieldForm.reset();
      toast({
        title: "Success",
        description: "Custom field added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add custom field",
        variant: "destructive",
      });
    },
  });

  const deleteCustomFieldMutation = useMutation({
    mutationFn: async (fieldId: number) => {
      return await apiRequest(`/api/custom-metric-fields/${fieldId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-metric-fields'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics/date', dateString] });
      toast({
        title: "Success",
        description: "Custom field removed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove custom field",
        variant: "destructive",
      });
    },
  });

  const onSubmitMetrics = (data: z.infer<typeof metricsSchema>) => {
    updateMetricsMutation.mutate(data);
  };

  const onSubmitCustomField = (data: z.infer<typeof customFieldSchema>) => {
    addCustomFieldMutation.mutate(data);
  };

  const hasData = todaysMetric?.weight || Object.keys(todaysMetric?.customFields || {}).length > 0;

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800">Metrics</CardTitle>
          <div className="flex items-center space-x-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-xs text-black hover:text-gray-700 transition-colors">
                  Edit
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Custom Fields</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {customFields.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Current Fields:</h4>
                      <div className="space-y-2">
                        {customFields.map((field) => (
                          <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{field.fieldName} ({field.unit})</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteCustomFieldMutation.mutate(field.id)}
                              disabled={deleteCustomFieldMutation.isPending}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => setAddFieldDialogOpen(true)}
                    className="w-full"
                  >
                    Add Custom Field
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-4">
          {hasData ? (
            <div className="space-y-3">
              {todaysMetric?.weight && (
                <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500 rounded-lg p-2 flex items-center justify-center min-w-[48px] h-12">
                      <i className="fas fa-weight text-white text-sm"></i>
                    </div>
                    <div>
                      <div className="text-white font-medium">Weight</div>
                      <div className="text-gray-300 text-xs">{todaysMetric.weight} lbs</div>
                    </div>
                  </div>
                </div>
              )}
              
              {Object.entries(todaysMetric?.customFields || {}).map(([fieldName, value]) => {
                const customField = customFields.find(f => f.fieldName === fieldName);
                if (!customField) return null;
                
                return (
                  <div key={fieldName} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-500 rounded-lg p-2 flex items-center justify-center min-w-[48px] h-12">
                        <i className="fas fa-ruler text-white text-sm"></i>
                      </div>
                      <div>
                        <div className="text-white font-medium">{fieldName}</div>
                        <div className="text-gray-300 text-xs">{value} {customField.unit}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              No metrics logged for this date
            </div>
          )}
        </div>
        
        <Dialog open={metricsDialogOpen} onOpenChange={setMetricsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-200">
              <i className="fas fa-plus mr-2"></i>
              ADD METRICS
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add/Update Metrics</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitMetrics)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (lbs)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          placeholder="0.0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {customFields.map((customField) => (
                  <FormField
                    key={customField.id}
                    control={form.control}
                    name={`customFields.${customField.fieldName}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{customField.fieldName} ({customField.unit})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.1"
                            placeholder="0.0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={updateMetricsMutation.isPending}
                >
                  {updateMetricsMutation.isPending ? 'Saving...' : 'Save Metrics'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={addFieldDialogOpen} onOpenChange={setAddFieldDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Metric Field</DialogTitle>
            </DialogHeader>
            <Form {...addFieldForm}>
              <form onSubmit={addFieldForm.handleSubmit(onSubmitCustomField)} className="space-y-4">
                <FormField
                  control={addFieldForm.control}
                  name="fieldName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Waist, Arms, Body Fat %"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addFieldForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., inches, cm, %"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={addCustomFieldMutation.isPending}
                >
                  {addCustomFieldMutation.isPending ? 'Adding...' : 'Add Field'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}