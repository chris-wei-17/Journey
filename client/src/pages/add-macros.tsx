import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { calculateCalories } from "@/lib/nutrition-utils";

export default function AddMacros() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [description, setDescription] = useState('');
  const [protein, setProtein] = useState('');
  const [fats, setFats] = useState('');
  const [carbs, setCarbs] = useState('');
  const [calories, setCalories] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'macro' | 'calorie'>('macro');
  const VIEW_MODE_STORAGE_KEY = 'add-macros-view-mode';
  const [isEditMode, setIsEditMode] = useState(false);
  const [editMacroId, setEditMacroId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === 'macro' || saved === 'calorie') setViewMode(saved as 'macro' | 'calorie');
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode); } catch {}
  }, [viewMode]);

  // Get date from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const editParam = params.get('edit');
    const descParam = params.get('description');
    const pParam = params.get('protein');
    const fParam = params.get('fats');
    const cParam = params.get('carbs');
    if (dateParam) {
      // Create date safely to avoid timezone issues
      const [year, month, day] = dateParam.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
    if (editParam) {
      setIsEditMode(true);
      setEditMacroId(parseInt(editParam));
      if (descParam) setDescription(descParam);
      if (pParam) setProtein(String(pParam));
      if (fParam) setFats(String(fParam));
      if (cParam) setCarbs(String(cParam));
      // Clean URL
      window.history.replaceState({}, '', '/add-macros');
    }
  }, []);

  const createMacroMutation = useMutation({
    mutationFn: async (macroData: any) => {
      console.log('Frontend sending macro data:', macroData);
      try {
        const result = await apiRequest('POST', '/api/macros', macroData);
        console.log('Frontend received result:', result);
        return result;
      } catch (error) {
        console.error('Frontend API request error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate macros cache for all dates
      queryClient.invalidateQueries({ queryKey: ['/api/macros'] });
      // Also invalidate the specific date query
      const dateStr = selectedDate.toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: [`/api/macros/date/${dateStr}`] });
      toast({
        title: "Success",
        description: "Macros added successfully!",
      });
      // Return to home with the selected date
      const dateParam = format(selectedDate, 'yyyy-MM-dd');
      setLocation(`/?date=${dateParam}`);
    },
    onError: (error: Error) => {
      console.error('Frontend mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to add macros. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMacroMutation = useMutation({
    mutationFn: async (macroData: any) => {
      return await apiRequest('PUT', `/api/macros/${editMacroId}`, macroData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/macros'] });
      const dateStr = selectedDate.toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: [`/api/macros/date/${dateStr}`] });
      toast({ title: 'Success', description: 'Macros updated successfully!' });
      const dateParam = format(selectedDate, 'yyyy-MM-dd');
      setLocation(`/?date=${dateParam}`);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update macros.', variant: 'destructive' });
    }
  });

  const deleteMacroMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/macros/${editMacroId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/macros'] });
      const dateStr = selectedDate.toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: [`/api/macros/date/${dateStr}`] });
      toast({ title: 'Success', description: 'Macro deleted successfully!' });
      const dateParam = format(selectedDate, 'yyyy-MM-dd');
      setLocation(`/?date=${dateParam}`);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete macro.', variant: 'destructive' });
    }
  });

  const handleSubmit = () => {
    if (viewMode === 'macro') {
      if (!description.trim() || !protein || !fats || !carbs) {
        toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
        return;
      }
    } else {
      if (!description.trim() || !calories) {
        toast({ title: "Error", description: "Please enter description and calories.", variant: "destructive" });
        return;
      }
    }

    let macroData: any;
    if (viewMode === 'macro') {
      macroData = {
        description: description.trim(),
        protein: parseFloat(protein),
        fats: parseFloat(fats),
        carbs: parseFloat(carbs),
        date: format(selectedDate, 'yyyy-MM-dd'),
      };
    } else {
      // Store macros as zeros; calories are not converted to macros
      macroData = {
        description: description.trim(),
        protein: 0,
        fats: 0,
        carbs: 0,
        date: format(selectedDate, 'yyyy-MM-dd'),
      };
    }

    if (isEditMode && editMacroId) {
      updateMacroMutation.mutate(macroData);
    } else {
      createMacroMutation.mutate(macroData);
    }
  };

  return (
    <div className="app-gradient-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mt-12 mb-2">
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
        <h1 className="text-xl font-bold text-white">{isEditMode ? 'EDIT MACROS' : 'ADD MACROS'}</h1>
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
        {/* Description Section */}
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm font-medium mb-4 tracking-wide">DESCRIPTION</h3>
          <Card className="bg-gray-800 border-0">
            <CardContent className="p-4">
              <Textarea
                placeholder="e.g., Breakfast, Lunch, Snack..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-transparent border-0 text-white placeholder-gray-400 resize-none focus:ring-0 focus:outline-none"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Local toggle (page-specific) now below description */}
        <div className="mb-4 flex justify-center">
          <ToggleGroup
            type="single"
            size="lg"
            value={viewMode}
            onValueChange={(v) => v && setViewMode(v as 'macro' | 'calorie')}
            className="bg-white/90 rounded-md w-fit"
          >
            <ToggleGroupItem
              value="macro"
              className={`text-sm px-4 h-10 leading-none ${viewMode === 'macro' ? 'bg-blue-600 text-white' : 'text-gray-900'}`}
            >
              Macro
            </ToggleGroupItem>
            <ToggleGroupItem
              value="calorie"
              className={`text-sm px-4 h-10 leading-none ${viewMode === 'calorie' ? 'bg-blue-600 text-white' : 'text-gray-900'}`}
            >
              Calorie
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Macros Section */}
        {viewMode === 'macro' ? (
          <div className="mb-6">
            <h3 className="text-gray-400 text-sm font-medium mb-4 tracking-wide">MACRONUTRIENTS (GRAMS)</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Protein</Label>
                <Card className="bg-gray-800 border-0">
                  <CardContent className="p-4">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="0.0"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0 focus:outline-none text-center text-lg"
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label className="text-white mb-2 block">Fats</Label>
                <Card className="bg-gray-800 border-0">
                  <CardContent className="p-4">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="0.0"
                      value={fats}
                      onChange={(e) => setFats(e.target.value)}
                      className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0 focus:outline-none text-center text-lg"
                    />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label className="text-white mb-2 block">Carbs</Label>
                <Card className="bg-gray-800 border-0">
                  <CardContent className="p-4">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="0.0"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0 focus:outline-none text-center text-lg"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-gray-400 text-sm font-medium mb-4 tracking-wide">CALORIES</h3>
            <Card className="bg-gray-800 border-0">
              <CardContent className="p-4">
                <Input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0 focus:outline-none text-center text-lg"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleSubmit}
          disabled={isEditMode ? updateMacroMutation.isPending : createMacroMutation.isPending}
          className="w-full bg-white/20 hover:bg-white/30 text-white py-4 rounded-lg text-lg font-medium transition-all duration-200 disabled:opacity-50"
        >
          {isEditMode ? (updateMacroMutation.isPending ? 'UPDATING...' : 'UPDATE') : (createMacroMutation.isPending ? 'SAVING...' : 'SAVE')}
        </Button>

        {isEditMode && (
          <Button
            onClick={() => deleteMacroMutation.mutate()}
            disabled={deleteMacroMutation.isPending}
            variant="destructive"
            className="w-full py-3 rounded-lg transition-all duration-200 mt-2"
          >
            {deleteMacroMutation.isPending ? 'DELETING...' : 'DELETE MACRO'}
          </Button>
        )}
      </main>
    </div>
  );
}