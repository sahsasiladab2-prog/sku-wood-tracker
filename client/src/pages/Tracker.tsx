import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trophy, Target, Zap, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedSku, setExpandedSku] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedSku(expandedSku === id ? null : id);
  };

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
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            SKU Tracker
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">
            Track progress, complete quests, and level up!
          </p>
        </div>
        <Button className="w-full md:w-auto neo-button bg-chart-2 text-white hover:bg-pink-600 h-12 px-6 text-lg">
          <Plus className="mr-2 h-5 w-5" /> New SKU Quest
        </Button>
      </div>

      {/* Gamification Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="neo-card bg-chart-3 text-white">
          <CardContent className="p-4 md:p-6 flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <p className="font-bold uppercase text-xs md:text-sm opacity-80">Total Product XP</p>
              <h3 className="font-heading text-2xl md:text-3xl font-bold">1,750 XP</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="neo-card bg-chart-1">
          <CardContent className="p-4 md:p-6 flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-black">
              <Target className="w-6 h-6 md:w-8 md:h-8 text-black" />
            </div>
            <div>
              <p className="font-bold uppercase text-xs md:text-sm opacity-80">Active Quests</p>
              <h3 className="font-heading text-2xl md:text-3xl font-bold">3 SKUs</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="neo-card bg-chart-4 text-white">
          <CardContent className="p-4 md:p-6 flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
              <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <p className="font-bold uppercase text-xs md:text-sm opacity-80">Efficiency Streak</p>
              <h3 className="font-heading text-2xl md:text-3xl font-bold">5 Days</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SKU List */}
      <div className="space-y-4 md:space-y-6">
        {skus.map((sku) => (
          <Card key={sku.id} className="neo-card bg-white overflow-hidden">
            <div className="flex flex-col md:flex-row border-b-2 border-black">
              {/* Left: SKU Info */}
              <div className="p-4 md:p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge className={cn("border-2 border-black text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-none shadow-[2px_2px_0px_0px_#000000]", getStageColor(sku.stage))}>
                        {sku.stage}
                      </Badge>
                      <Badge className={cn("border-2 border-black text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-none shadow-[2px_2px_0px_0px_#000000]", getStatusColor(sku.status))}>
                        {sku.status}
                      </Badge>
                    </div>
                    <h3 className="font-heading text-xl md:text-2xl font-bold uppercase leading-tight">{sku.name}</h3>
                  </div>
                  <div className="text-right pl-2">
                    <p className="font-bold text-xs md:text-sm text-muted-foreground uppercase">Margin</p>
                    <p className={cn("font-heading text-xl md:text-2xl font-bold", sku.margin > 40 ? "text-green-600" : "text-black")}>
                      {sku.margin}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm font-bold uppercase">
                    <span>Progress</span>
                    <span>{sku.progress}%</span>
                  </div>
                  <div className="h-3 md:h-4 border-2 border-black bg-gray-100 relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-chart-3 transition-all duration-1000"
                      style={{ width: `${sku.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Mobile Expand Button */}
                <div className="md:hidden pt-2">
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold uppercase border-2 border-black/10 hover:bg-gray-100"
                    onClick={() => toggleExpand(sku.id)}
                  >
                    {expandedSku === sku.id ? (
                      <>Hide Quests <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>View Quests <ChevronDown className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>
              </div>

              {/* Right: Tasks / Quests (Collapsible on Mobile) */}
              <div className={cn(
                "w-full md:w-1/3 bg-gray-50 border-t-2 md:border-t-0 md:border-l-2 border-black p-4 md:p-6 transition-all",
                expandedSku === sku.id ? "block" : "hidden md:block"
              )}>
                <h4 className="font-heading text-base md:text-lg font-bold uppercase mb-3 md:mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 md:w-5 md:h-5" /> Active Quests
                </h4>
                <div className="space-y-2 md:space-y-3">
                  {sku.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 group cursor-pointer p-2 md:p-0 hover:bg-white md:hover:bg-transparent rounded-md md:rounded-none border border-transparent md:border-none hover:border-black/10 md:hover:border-none transition-all">
                      <div className={cn(
                        "w-5 h-5 md:w-6 md:h-6 border-2 border-black flex items-center justify-center transition-all flex-shrink-0",
                        task.completed ? "bg-green-500 text-white" : "bg-white group-hover:bg-gray-200"
                      )}>
                        {task.completed && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />}
                      </div>
                      <span className={cn(
                        "font-medium text-xs md:text-sm uppercase transition-all leading-tight",
                        task.completed ? "line-through text-muted-foreground" : "text-black"
                      )}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 md:mt-6 border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition-all text-xs md:text-sm h-10">
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
