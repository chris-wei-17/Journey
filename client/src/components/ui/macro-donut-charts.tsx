import { Doughnut } from 'react-chartjs-2';

interface MacroDonutChartsProps {
  macroData: {
    todaySummary: {
      protein: number;
      fats: number;
      carbs: number;
      totalCalories: number;
    };
    macroTargets?: {
      proteinTarget: number;
      fatsTarget: number;
      carbsTarget: number;
    };
    macroPercentages: {
      protein: number;
      fats: number;
      carbs: number;
    };
    proteinDonut: any;
    fatsDonut: any;
    carbsDonut: any;
  };
}

export function MacroDonutCharts({ macroData }: MacroDonutChartsProps) {
  const { todaySummary, macroTargets, macroPercentages, proteinDonut, fatsDonut, carbsDonut } = macroData;

  return (
    <div className="flex justify-center gap-8 px-4">
      {/* Protein */}
      <div className="text-center bg-white/75 backdrop-blur-sm rounded-xl p-4 shadow-xl border-0">
        <div className="w-16 h-16 mx-auto relative">
          <Doughnut data={proteinDonut.data} options={proteinDonut.options} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">
              {Math.round(macroPercentages.protein)}%
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">Protein</p>
        <p className="text-xs text-red-500 font-medium">
          {todaySummary.protein}g
          {macroTargets && ` / ${macroTargets.proteinTarget}g`}
        </p>
      </div>

      {/* Fats */}
      <div className="text-center bg-white/75 backdrop-blur-sm rounded-xl p-4 shadow-xl border-0">
        <div className="w-16 h-16 mx-auto relative">
          <Doughnut data={fatsDonut.data} options={fatsDonut.options} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">
              {Math.round(macroPercentages.fats)}%
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">Fats</p>
        <p className="text-xs text-yellow-500 font-medium">
          {todaySummary.fats}g
          {macroTargets && ` / ${macroTargets.fatsTarget}g`}
        </p>
      </div>

      {/* Carbs */}
      <div className="text-center bg-white/75 backdrop-blur-sm rounded-xl p-4 shadow-xl border-0">
        <div className="w-16 h-16 mx-auto relative">
          <Doughnut data={carbsDonut.data} options={carbsDonut.options} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700">
              {Math.round(macroPercentages.carbs)}%
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">Carbs</p>
        <p className="text-xs text-green-500 font-medium">
          {todaySummary.carbs}g
          {macroTargets && ` / ${macroTargets.carbsTarget}g`}
        </p>
      </div>
    </div>
  );
}