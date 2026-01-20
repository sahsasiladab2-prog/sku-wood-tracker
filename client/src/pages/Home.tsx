import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Package, ArrowRight, Star, Target } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Home() {
  const { projects } = useProjects();

  // Calculate stats
  const activeSkus = projects.length;
  const avgMargin = activeSkus > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.margin, 0) / activeSkus) 
    : 0;
  const totalXp = projects.reduce((sum, p) => sum + (p.totalCost > 5000 ? 1000 : 500), 0);
  const level = Math.floor(totalXp / 1000) + 1;

  // Get top projects by margin
  const topProjects = [...projects]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 3);

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            Dashboard
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">
            Welcome back, Wood Master! Ready to craft some profits?
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/calculator" className="w-full md:w-auto">
            <Button className="w-full md:w-auto neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 px-6 text-lg">
              New Project <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="neo-card bg-chart-1">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <h3 className="font-heading text-2xl md:text-4xl font-bold mt-1 md:mt-2">{activeSkus}</h3>
            <p className="font-bold uppercase text-[10px] md:text-sm tracking-widest">Active SKUs</p>
          </CardContent>
        </Card>

        <Card className="neo-card bg-chart-2 text-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <h3 className="font-heading text-2xl md:text-4xl font-bold mt-1 md:mt-2">{avgMargin}%</h3>
            <p className="font-bold uppercase text-[10px] md:text-sm tracking-widest">Avg. Margin</p>
          </CardContent>
        </Card>

        <Card className="neo-card bg-chart-4 text-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <h3 className="font-heading text-2xl md:text-4xl font-bold mt-1 md:mt-2">{totalXp.toLocaleString()}</h3>
            <p className="font-bold uppercase text-[10px] md:text-sm tracking-widest">Total XP</p>
          </CardContent>
        </Card>

        <Card className="neo-card bg-chart-5 text-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Star className="w-5 h-5 md:w-6 md:h-6 text-black" />
            </div>
            <h3 className="font-heading text-2xl md:text-4xl font-bold mt-1 md:mt-2">{level}</h3>
            <p className="font-bold uppercase text-[10px] md:text-sm tracking-widest">Level</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Challenges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <Card className="neo-card bg-white h-full">
            <CardHeader className="border-b-2 border-black bg-black text-white py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-chart-1" /> Daily Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y-2 divide-black">
                {[
                  { title: "Calculate 3 New Projects", xp: 150, progress: 1, total: 3 },
                  { title: "Achieve >40% Margin on a SKU", xp: 300, progress: 0, total: 1 },
                  { title: "Review 5 Wood Costs", xp: 100, progress: 5, total: 5, completed: true },
                ].map((challenge, i) => (
                  <div key={i} className={cn("p-3 md:p-4 flex items-center gap-3 md:gap-4", challenge.completed ? "bg-gray-100 opacity-60" : "hover:bg-blue-50")}>
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 border-2 border-black flex items-center justify-center font-bold text-base md:text-lg shadow-[2px_2px_0px_0px_#000000] flex-shrink-0",
                      challenge.completed ? "bg-chart-4 text-white" : "bg-white"
                    )}>
                      {challenge.completed ? "✓" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm md:text-lg uppercase truncate">{challenge.title}</h4>
                      <div className="w-full h-2 md:h-3 border-2 border-black bg-white mt-1 md:mt-2 relative">
                        <div 
                          className="absolute top-0 left-0 h-full bg-chart-3 transition-all duration-500"
                          style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="block font-black text-sm md:text-xl text-chart-2">+{challenge.xp} XP</span>
                      <span className="text-[10px] md:text-xs font-bold text-muted-foreground">{challenge.progress}/{challenge.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Mini Leaderboard */}
        <div className="lg:col-span-1">
          <Card className="neo-card bg-chart-1 h-full">
            <CardHeader className="border-b-2 border-black pb-3 md:pb-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase text-center">
                Top Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
              {topProjects.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No projects yet.</div>
              ) : (
                topProjects.map((project, i) => (
                  <div key={i} className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_#000000] flex justify-between items-center">
                    <div>
                      <p className="font-bold uppercase text-xs md:text-sm truncate max-w-[120px]">{project.name} v.{project.version}</p>
                      <p className="text-[10px] md:text-xs font-bold text-muted-foreground">Margin: {project.margin}%</p>
                    </div>
                    <div className="font-black text-sm md:text-base text-green-600">฿{(project.sellingPrice - project.totalCost).toLocaleString()}</div>
                  </div>
                ))
              )}
              
              <Button className="w-full neo-button bg-black text-white hover:bg-gray-800 mt-2 md:mt-4 text-sm md:text-base">
                View All Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
