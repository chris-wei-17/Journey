import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickAccess() {
  return (
    <Card className="bg-white/75 backdrop-blur-sm shadow-xl mb-2 border-0" style={{
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    }}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/progress">
            <Button 
              className="w-full h-20 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl border-0"
              style={{
                background: "linear-gradient(135deg, #ec4899, #db2777)",
                boxShadow: "0 10px 25px rgba(236, 72, 153, 0.3)"
              }}
            >
              <i className="fas fa-plus text-lg"></i>
              <span className="text-sm">Log Progress</span>
            </Button>
          </Link>

          <Link href="/photos">
            <Button 
              className="w-full h-20 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl border-0"
              style={{
                background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
                boxShadow: "0 10px 25px rgba(45, 212, 191, 0.3)"
              }}
            >
              <i className="fas fa-camera text-lg"></i>
              <span className="text-sm">Add Photos</span>
            </Button>
          </Link>

          <Link href="/goals">
            <Button 
              className="w-full h-20 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl border-0"
              style={{
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                boxShadow: "0 10px 25px rgba(251, 191, 36, 0.3)"
              }}
            >
              <i className="fas fa-target text-lg"></i>
              <span className="text-sm">View Goals</span>
            </Button>
          </Link>

          <Link href="/workouts">
            <Button 
              className="w-full h-20 text-white flex flex-col items-center space-y-2 transition-all duration-300 shadow-lg hover:shadow-xl border-0"
              style={{
                background: "linear-gradient(135deg, #a855f7, #9333ea)",
                boxShadow: "0 10px 25px rgba(168, 85, 247, 0.3)"
              }}
            >
              <i className="fas fa-dumbbell text-lg"></i>
              <span className="text-sm">Workouts</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}