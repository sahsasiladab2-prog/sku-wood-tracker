import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trophy, Target, Zap, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data for SKUs
const initialSkus = [
  {
    id: 1,
    name: "Oak Coffee Table",
    stage: "Production",
    progress: 80,
    margin: 42,
    xp: 1200,
    status: "On Track",
    tasks: [
      { id: 1, title: "Design Draft", completed: true },
      { id: 2, title: "Material Selection", completed: true },
      { id: 3, title: "Prototype V1", completed: true },
      { id: 4, title: "Cost Analysis", completed: true },
      { id: 5, title: "Final Assembly", completed: false },
    ]
  },
  {
    id: 2,
    name: "Minimal Chair",
    stage: "Prototyping",
    progress: 45,
    margin: 35,
    xp: 450,
    status: "Delayed",
    tasks: [
      { id: 1, title: "Design Draft", completed: true },
      { id: 2, title: "Material Selection", completed: true },
      { id: 3, title: "Prototype V1", completed: false },
      { id: 4, title: "Cost Analysis", completed: false },
    ]
  },
  {
    id: 3,
    name: "Wall Shelf Unit",
    stage: "Concept",
    progress: 15,
    margin: 0,
    xp: 100,
    status: "New",
    tasks: [
      { id: 1, title: "Design Draft", completed: true },
      { id: 2, title: "Material Selection", completed: false },
    ]
  }
];

export default function Tracker() {
  const [skus, setSkus] = useState(initialSkus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track": return "bg-green-500 text-white";
      case "Delayed": return "bg-red-500 text-white";
      case "New": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Concept": return "bg-chart-5";
      case "Prototyping": return "bg-chart-1";
      case "Production": return "bg-chart-4";
      case "Launch": return "bg-chart-2";
      default: return "bg-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            SKU Development Tracker
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Track progress, complete quests, and level up your products!
          </p>
        </div>
        <Button className="neo-button bg-chart-2 text-white hover:bg-pink-600 h-12 px-6 text-lg">
          <Plus className="mr-2 h-5 w-5" /> New SKU Quest
        </Button>
      </div>

      {/* Gamification Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="neo-card bg-chart-3 text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold uppercase text-sm opacity-80">Total Product XP</p>
              <h3 className="font-heading text-3xl font-bold">1,750 XP</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="neo-card bg-chart-1">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-black">
              <Target className="w-8 h-8 text-black" />
            </div>
            <div>
              <p className="font-bold uppercase text-sm opacity-80">Active Quests</p>
              <h3 className="font-heading text-3xl font-bold">3 SKUs</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="neo-card bg-chart-4 text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-bold uppercase text-sm opacity-80">Efficiency Streak</p>
              <h3 className="font-heading text-3xl font-bold">5 Days</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SKU List */}
      <div className="space-y-6">
        {skus.map((sku) => (
          <Card key={sku.id} className="neo-card bg-white overflow-hidden">
            <div className="flex flex-col md:flex-row border-b-2 border-black">
              {/* Left: SKU Info */}
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={cn("border-2 border-black text-sm font-bold px-3 py-1 rounded-none shadow-[2px_2px_0px_0px_#000000]", getStageColor(sku.stage))}>
                        {sku.stage}
                      </Badge>
                      <Badge className={cn("border-2 border-black text-sm font-bold px-3 py-1 rounded-none shadow-[2px_2px_0px_0px_#000000]", getStatusColor(sku.status))}>
                        {sku.status}
                      </Badge>
                    </div>
                    <h3 className="font-heading text-2xl font-bold uppercase">{sku.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-muted-foreground uppercase">Project Margin</p>
                    <p className={cn("font-heading text-2xl font-bold", sku.margin > 40 ? "text-green-600" : "text-black")}>
                      {sku.margin}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold uppercase">
                    <span>Development Progress</span>
                    <span>{sku.progress}%</span>
                  </div>
                  <div className="h-4 border-2 border-black bg-gray-100 relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-chart-3 transition-all duration-1000"
                      style={{ width: `${sku.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Right: Tasks / Quests */}
              <div className="w-full md:w-1/3 bg-gray-50 border-l-0 md:border-l-2 border-black p-6">
                <h4 className="font-heading text-lg font-bold uppercase mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Active Quests
                </h4>
                <div className="space-y-3">
                  {sku.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 group cursor-pointer">
                      <div className={cn(
                        "w-6 h-6 border-2 border-black flex items-center justify-center transition-all",
                        task.completed ? "bg-green-500 text-white" : "bg-white group-hover:bg-gray-200"
                      )}>
                        {task.completed && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "font-medium text-sm uppercase transition-all",
                        task.completed ? "line-through text-muted-foreground" : "text-black"
                      )}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-6 border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition-all">
                  Manage Tasks
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
