import { useState } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trophy, Target, Zap, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Folder, History, ArrowDown, ArrowUp, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { cn } from "@/lib/utils";



export default function Tracker() {
  const { projects, deleteProject } = useProjects();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Group projects by name
  const groupedProjects = projects.reduce((acc, project) => {
    if (!acc[project.name]) {
      acc[project.name] = [];
    }
    acc[project.name].push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  // Sort versions within groups
  Object.keys(groupedProjects).forEach(name => {
    groupedProjects[name].sort((a, b) => b.version - a.version); // Newest version first
  });

  const toggleGroup = (name: string) => {
    setExpandedGroup(expandedGroup === name ? null : name);
  };

  const calculateCostDiff = (current: typeof projects[0], previous: typeof projects[0] | undefined) => {
    if (!previous) return null;
    const diff = current.totalCost - previous.totalCost;
    const percent = ((diff / previous.totalCost) * 100).toFixed(1);
    return { diff, percent };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        {Object.keys(groupedProjects).length === 0 && (
          <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-muted-foreground text-lg">No SKUs found. Start by creating a project in Calculator!</p>
            <Link href="/calculator">
              <Button variant="link" className="mt-2 text-chart-2 font-bold uppercase">
                Go to Calculator
              </Button>
            </Link>
          </div>
        )}
        {Object.entries(groupedProjects).map(([name, groupVersions]) => {
          const latestVersion = groupVersions[0];
          const isExpanded = expandedGroup === name;

          return (
            <Card key={name} className="neo-card bg-white overflow-hidden">
              {/* Group Header */}
              <div 
                className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleGroup(name)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-chart-1 border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl md:text-2xl font-bold uppercase leading-tight">{name}</h3>
                    <p className="text-sm text-muted-foreground font-bold uppercase mt-1">
                      {groupVersions.length} Version{groupVersions.length > 1 ? 's' : ''} • Latest: v.{latestVersion.version}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="font-bold text-xs text-muted-foreground uppercase">Latest Cost</p>
                    <p className="font-heading text-xl font-bold">{latestVersion.totalCost.toLocaleString()} THB</p>
                  </div>
                  <Button variant="ghost" size="icon" className="border-2 border-black/10">
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </Button>
                </div>
              </div>

              {/* Versions List (Collapsible) */}
              {isExpanded && (
                <div className="border-t-2 border-black bg-gray-50 p-4 space-y-4">
                  <h4 className="font-heading text-sm font-bold uppercase flex items-center gap-2 text-muted-foreground mb-2">
                    <History className="w-4 h-4" /> Version History
                  </h4>
                  
                  {groupVersions.map((version, index) => {
                    const previousVersion = groupVersions[index + 1];
                    const firstVersion = groupVersions[groupVersions.length - 1];
                    const diff = calculateCostDiff(version, previousVersion);
                    const diffFromFirst = version.version > 1 ? calculateCostDiff(version, firstVersion) : null;

                    return (
                      <div key={version.id} className="bg-white border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-black text-white hover:bg-black border-none text-xs px-2 py-0.5">v.{version.version}</Badge>
                              <span className="text-xs font-bold text-muted-foreground uppercase">ID: {version.id.slice(0, 8)}</span>
                              <span className="text-[10px] text-muted-foreground ml-auto md:ml-2">
                                {formatDate(version.updatedAt)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-lg">Total Cost: {version.totalCost.toLocaleString()} THB</span>
                              
                              {/* Compare with Previous Version */}
                              {diff && (
                                <Badge className={cn(
                                  "border-none font-bold",
                                  diff.diff < 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                  {diff.diff < 0 ? <ArrowDown className="w-3 h-3 mr-1" /> : <ArrowUp className="w-3 h-3 mr-1" />}
                                  {Math.abs(diff.diff).toLocaleString()} ({Math.abs(Number(diff.percent))}%)
                                </Badge>
                              )}

                              {/* Compare with First Version */}
                              {diffFromFirst && version.version > 1 && (
                                <Badge className={cn(
                                  "border-none font-bold bg-blue-100 text-blue-700"
                                )}>
                                  <span className="mr-1 text-[10px] uppercase">vs v.1:</span>
                                  {diffFromFirst.diff < 0 ? "-" : "+"}{Math.abs(diffFromFirst.diff).toLocaleString()}
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <span className="font-bold text-black">Note:</span> {version.note || "-"}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <Link href={`/calculator?edit=${version.id}`}>
                              <Button variant="outline" size="sm" className="border-2 border-black font-bold uppercase text-xs h-8 hover:bg-chart-1 hover:text-white transition-colors">
                                <Edit className="w-3 h-3 mr-1" /> Edit
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-2 border-black font-bold uppercase text-xs h-8 hover:bg-red-500 hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete ${name} v.${version.version}?`)) {
                                  deleteProject(version.id);
                                  toast.success(`Deleted ${name} v.${version.version}`);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
