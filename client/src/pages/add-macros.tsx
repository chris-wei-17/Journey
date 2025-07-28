import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AddMacros() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [description, setDescription] = useState('');
  const [protein, setProtein] = useState('');
  const [fats, setFats] = useState('');
  const [carbs, setCarbs] = useState('');

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
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: [`/api/macros/date/${today}`] });
      toast({
        title: "Success",
        description: "Macros added successfully!",
      });
      setLocation('/');
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

  const handleSubmit = () => {
    if (!description.trim() || !protein || !fats || !carbs) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const macroData = {
      description: description.trim(),
      protein: parseFloat(protein),
      fats: parseFloat(fats),
      carbs: parseFloat(carbs),
      date: new Date().toISOString(), // Current date
    };

    createMacroMutation.mutate(macroData);
  };

  return (
    <div className="app-gradient-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLocation('/')}
          className="p-2 text-white hover:bg-white/20"
        >
          <i className="fas fa-chevron-left text-xl"></i>
        </Button>
        <h1 className="text-xl font-bold text-white">ADD MACROS</h1>
        <div 
          onClick={() => setLocation('/')}
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

        {/* Macros Section */}
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

        {/* Save Button */}
        <Button 
          onClick={handleSubmit}
          disabled={createMacroMutation.isPending}
          className="w-full bg-white/20 hover:bg-white/30 text-white py-4 rounded-lg text-lg font-medium transition-all duration-200 disabled:opacity-50"
        >
          {createMacroMutation.isPending ? "SAVING..." : "SAVE"}
        </Button>
      </main>
    </div>
  );
}