import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { Link } from "wouter";

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

interface MacrosBlockProps {
  selectedDate: Date;
}

export function MacrosBlock({ selectedDate }: MacrosBlockProps) {
  const { data: macros = [] } = useQuery<MacroEntry[]>({
    queryKey: [`/api/macros/date/${format(selectedDate, 'yyyy-MM-dd')}`],
  });

  const getTotalMacros = () => {
    return macros.reduce((totals, macro) => ({
      protein: totals.protein + macro.protein,
      fats: totals.fats + macro.fats,
      carbs: totals.carbs + macro.carbs,
    }), { protein: 0, fats: 0, carbs: 0 });
  };

  const totals = getTotalMacros();

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800">Macros</CardTitle>
          <i className="fas fa-utensils text-gray-400"></i>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm font-medium text-gray-600 mb-3">
            <span>NUTRITION</span>
            {macros.length > 0 && (
              <span className="text-xs">
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