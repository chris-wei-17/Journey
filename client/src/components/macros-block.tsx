import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isToday } from "date-fns";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";

interface MacroEntry {
  id: number;
  userId: number;
  description: string;
  protein: number;
  fats: number;
  carbs: number;
  date: string;
  createdAt: string;
}

interface MacroTarget {
  id: number;
  userId: number;
  proteinTarget: number;
  fatsTarget: number;
  carbsTarget: number;
  createdAt: string;
  updatedAt: string;
}

interface MacrosBlockProps {
  selectedDate: Date;
}

const macroTargetSchema = z.object({
  proteinTarget: z.coerce.number().min(0),
  fatsTarget: z.coerce.number().min(0),
  carbsTarget: z.coerce.number().min(0),
});

export function MacrosBlock({ selectedDate }: MacrosBlockProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { data: macros = [] } = useQuery<MacroEntry[]>({
    queryKey: [`/api/macros/date/${format(selectedDate, 'yyyy-MM-dd')}`],
  });

  const { data: macroTargets } = useQuery<MacroTarget>({
    queryKey: ['/api/macro-targets'],
  });

  const form = useForm<z.infer<typeof macroTargetSchema>>({
    resolver: zodResolver(macroTargetSchema),
    defaultValues: {
      proteinTarget: macroTargets?.proteinTarget ? parseFloat(macroTargets.proteinTarget.toString()) : 0,
      fatsTarget: macroTargets?.fatsTarget ? parseFloat(macroTargets.fatsTarget.toString()) : 0,
      carbsTarget: macroTargets?.carbsTarget ? parseFloat(macroTargets.carbsTarget.toString()) : 0,
    },
  });

  // Update form when targets data is loaded
  React.useEffect(() => {
    if (macroTargets) {
      form.reset({
        proteinTarget: parseFloat(macroTargets.proteinTarget.toString()),
        fatsTarget: parseFloat(macroTargets.fatsTarget.toString()),
        carbsTarget: parseFloat(macroTargets.carbsTarget.toString()),
      });
    }
  }, [macroTargets, form]);

  const updateTargetsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof macroTargetSchema>) => {
      return await apiRequest('/api/macro-targets', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/macro-targets'] });
      setDialogOpen(false);
      toast({
        title: "Success",
        description: "Macro targets updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update macro targets",
        variant: "destructive",
      });
    },
  });

  const getTotalMacros = () => {
    return macros.reduce((totals, macro) => ({
      protein: totals.protein + parseFloat(macro.protein.toString()),
      fats: totals.fats + parseFloat(macro.fats.toString()),
      carbs: totals.carbs + parseFloat(macro.carbs.toString()),
    }), { protein: 0, fats: 0, carbs: 0 });
  };

  const totals = getTotalMacros();

  const onSubmit = (data: z.infer<typeof macroTargetSchema>) => {
    updateTargetsMutation.mutate(data);
  };

  return (
    <Card className="mb-6 bg-white/75 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800">Macros</CardTitle>
          <div className="flex items-center justify-end">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  Target: P:{macroTargets ? parseFloat(macroTargets.proteinTarget.toString()) : 0}g | F:{macroTargets ? parseFloat(macroTargets.fatsTarget.toString()) : 0}g | C:{macroTargets ? parseFloat(macroTargets.carbsTarget.toString()) : 0}g
                </button>
                    <span className="text-xs text-gray-400">
                      Click to edit targets
                    </span>
              </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Macro Targets</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="proteinTarget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Protein Target (grams)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fatsTarget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fats Target (grams)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                placeholder="0"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="carbsTarget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carbs Target (grams)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                placeholder="0"
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
                        disabled={updateTargetsMutation.isPending}
                      >
                        {updateTargetsMutation.isPending ? 'Updating...' : 'Update Targets'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm font-medium text-gray-600 mb-3">
            <span>NUTRITION</span>
            {macros.length > 0 && (
              <span className="text-xs text-right">
                P: {totals.protein}g | F: {totals.fats}g | C: {totals.carbs}g
              </span>
            )}
          </div>
          
          {macros.length > 0 ? (
            macros.map((macro: MacroEntry) => (
              <div key={macro.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 rounded-lg p-2 flex items-center justify-center min-w-[48px] h-12">
                    <i className="fas fa-utensils text-white text-sm"></i>
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {macro.description}
                    </div>
                    <div className="text-gray-300 text-xs">
                      P: {macro.protein}g • F: {macro.fats}g • C: {macro.carbs}g
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-4">
              No macros logged {isToday(selectedDate) ? 'today' : 'for this date'}
            </div>
          )}
        </div>
        
        <Link href="/add-macros">
          <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all duration-200">
            <i className="fas fa-plus mr-2"></i>
            ADD MACROS
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}