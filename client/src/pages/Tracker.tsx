import { useState } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trophy, Target, Zap, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Folder, History, ArrowDown, ArrowUp, Edit, Trash2, Store, Download, TrendingUp, Tag } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Legend } from 'recharts';
import { Slider } from "@/components/ui/slider";



export default function Tracker() {
  const { projects, deleteProject, updateProject } = useProjects();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  
  // Manage Prices State
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedVersionForPrice, setSelectedVersionForPrice] = useState<typeof projects[0] | null>(null);
  const [tempChannels, setTempChannels] = useState<{ id: string; name: string; price: number; feePercent: number; profit: number; marginPercent: number }[]>([]);

  // Simulator State
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [selectedVersionForSim, setSelectedVersionForSim] = useState<typeof projects[0] | null>(null);
  const [simCostMultiplier, setSimCostMultiplier] = useState(100); // 100%
  const [simPriceMultiplier, setSimPriceMultiplier] = useState(100); // 100%

  const openSimModal = (version: typeof projects[0]) => {
    setSelectedVersionForSim(version);
    setSimCostMultiplier(100);
    setSimPriceMultiplier(100);
    setIsSimModalOpen(true);
  };

  const openPriceModal = (version: typeof projects[0]) => {
    setSelectedVersionForPrice(version);
    // Deep copy channels to temp state
    setTempChannels(version.channels ? JSON.parse(JSON.stringify(version.channels)) : []);
    setIsPriceModalOpen(true);
  };

  const handlePriceChange = (index: number, field: 'price' | 'feePercent', value: number) => {
    const newChannels = [...tempChannels];
    newChannels[index][field] = value;
    
    // Recalculate profit and margin
    // Note: We need totalCost from the version to recalculate
    if (selectedVersionForPrice) {
      const totalCost = selectedVersionForPrice.totalCost;
      const price = newChannels[index].price;
      const fee = Math.ceil(price * (newChannels[index].feePercent / 100));
      const netProfit = price - totalCost - fee;
      // Net Profit Margin = (Net Profit / Selling Price) * 100
      // Net Profit Margin = (Net Profit / Selling Price) * 100
      const margin = price > 0 ? parseFloat(((netProfit / price) * 100).toFixed(1)) : 0;
      
      newChannels[index].profit = netProfit;
      newChannels[index].marginPercent = margin;
    }
    
    setTempChannels(newChannels);
  };

  const savePrices = () => {
    if (selectedVersionForPrice) {
      updateProject(selectedVersionForPrice.id, {
        ...selectedVersionForPrice,
        channels: tempChannels
      });
      toast.success("Prices updated successfully!");
      setIsPriceModalOpen(false);
    }
  };

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

  const exportToCSV = (name: string, versions: typeof projects) => {
    // Prepare CSV data
    const headers = ["Version", "Date", "Total Cost", "Margin %", "Selling Price", "Profit", "Note"];
    const rows = versions.map(v => [
      `v.${v.version}`,
      new Date(v.updatedAt).toLocaleDateString('th-TH'),
      v.totalCost,
      v.margin,
      v.sellingPrice,
      v.sellingPrice - v.totalCost,
      `"${v.note || ''}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${name}_history.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${name} history to CSV`);
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
                  
                  {/* Profit Trend Chart & Actions */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 bg-white border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-heading text-sm font-bold uppercase flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-chart-2" /> Profit Trend
                        </h4>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => exportToCSV(name, groupVersions)}
                          className="h-7 text-xs font-bold uppercase border-black hover:bg-black hover:text-white"
                        >
                          <Download className="w-3 h-3 mr-1" /> Export CSV
                        </Button>
                      </div>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...groupVersions].reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="version" 
                              tickFormatter={(v) => `v.${v}`}
                              stroke="#000"
                              fontSize={10}
                              tickMargin={10}
                            />
                            <YAxis 
                              stroke="#000" 
                              fontSize={10}
                              tickFormatter={(val) => `${val}%`}
                            />
                            <Tooltip 
                              contentStyle={{ border: '2px solid black', borderRadius: '0px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.1)' }}
                              labelFormatter={(v) => `Version ${v}`}
                            />
                            <ReferenceLine y={30} stroke="green" strokeDasharray="3 3" label={{ value: 'Target (30%)', position: 'insideTopRight', fill: 'green', fontSize: 10 }} />
                            <Line 
                              type="monotone" 
                              dataKey="margin" 
                              stroke="#ec4899" 
                              strokeWidth={3}
                              dot={{ r: 4, fill: "#ec4899", stroke: "#000", strokeWidth: 2 }}
                              activeDot={{ r: 6, stroke: "#000", strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

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
                              
                              {/* Margin Badge - Show Real Profit from Channels if Target Margin is 0 */}
                              {version.margin > 0 ? (
                                <Badge className={cn(
                                  "border-none font-bold text-white",
                                  version.margin >= 30 ? "bg-green-500" : version.margin >= 15 ? "bg-yellow-500" : "bg-red-500"
                                )}>
                                  Target Margin: {version.margin}%
                                </Badge>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-muted-foreground mr-1">Net Margin:</span>
                                  {version.channels && version.channels.length > 0 ? (
                                    [...version.channels]
                                      .sort((a, b) => {
                                        // Calculate real-time margin for sorting
                                        const marginA = a.price > 0 ? (a.profit / a.price) * 100 : 0;
                                        const marginB = b.price > 0 ? (b.profit / b.price) * 100 : 0;
                                        return marginB - marginA;
                                      })
                                      .map((ch, idx) => {
                                        // Calculate real-time margin for display: (Net Profit / Selling Price) * 100
                                        const realMargin = ch.price > 0 ? ((ch.profit / ch.price) * 100).toFixed(1) : "0.0";
                                        const marginVal = parseFloat(realMargin);
                                        
                                        return (
                                          <Badge key={idx} className={cn(
                                            "border-none font-bold text-white",
                                            marginVal >= 30 ? "bg-green-500" : marginVal >= 15 ? "bg-yellow-500" : "bg-red-500"
                                          )}>
                                            {parseFloat(ch.price > 0 ? ((ch.profit / ch.price) * 100).toFixed(1) : "0.0")}% ({ch.name})
                                          </Badge>
                                        );
                                      })
                                  ) : (
                                    <Badge className="bg-gray-400 text-white border-none">No Margin Data</Badge>
                                  )}
                                </div>
                              )}

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

                            {/* Multi-Channel Pricing Display */}
                            {version.channels && version.channels.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-black/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <Store className="w-3 h-3 text-purple-600" />
                                  <span className="text-xs font-bold uppercase text-purple-600">Sales Channels</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {version.channels.map((channel) => {
                                    // Recalculate net profit if feePercent exists (for backward compatibility or display logic)
                                    // Note: channel.profit should already be net profit from Calculator logic, 
                                    // but let's display the breakdown if possible or just the net result.
                                    // The saved 'profit' in DB is already Net Profit based on Calculator logic update.
                                    
                                    return (
                                      <div key={channel.id} className="bg-purple-50 border border-purple-200 p-2 rounded text-xs">
                                        <div className="font-bold truncate mb-1">{channel.name}</div>
                                        <div className="space-y-0.5">
                                          <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Price:</span>
                                            <span className="font-bold">{channel.price.toLocaleString()}</span>
                                          </div>
                                          {channel.feePercent > 0 && (
                                            <div className="flex justify-between items-center text-red-500/80">
                                              <span className="text-[10px]">Fee ({channel.feePercent}%):</span>
                                              <span className="font-bold text-[10px]">
                                                -{Math.ceil(channel.price * (channel.feePercent / 100)).toLocaleString()}
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex justify-between items-center pt-1 mt-1 border-t border-purple-200">
                                          <span className="text-muted-foreground font-bold">Net Profit:</span>
                                            <span className={cn("font-bold", channel.profit >= 0 ? "text-green-600" : "text-red-600")}>
                                              {channel.profit.toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-2 border-black font-bold uppercase text-xs h-8 hover:bg-blue-600 hover:text-white transition-colors"
                              onClick={() => openSimModal(version)}
                            >
                              <Zap className="w-3 h-3 mr-1" /> Simulator
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-2 border-black font-bold uppercase text-xs h-8 hover:bg-purple-600 hover:text-white transition-colors"
                              onClick={() => openPriceModal(version)}
                            >
                              <Tag className="w-3 h-3 mr-1" /> Manage Prices
                            </Button>
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

      {/* Simulator & Cost Analysis Modal */}
      <Dialog open={isSimModalOpen} onOpenChange={setIsSimModalOpen}>
        <DialogContent className="max-w-3xl bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase flex items-center gap-2">
              <Zap className="w-5 h-5 text-chart-4" /> Cost Analysis & Profit Simulator (v.{selectedVersionForSim?.version})
            </DialogTitle>
          </DialogHeader>

          {selectedVersionForSim && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Left: Cost Breakdown */}
              <div className="space-y-4">
                <h3 className="font-bold uppercase text-sm border-b-2 border-black pb-1">Cost Breakdown</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Materials', value: selectedVersionForSim.totalCost - (selectedVersionForSim.costs.carpenter + selectedVersionForSim.costs.painting + selectedVersionForSim.costs.packing) },
                          { name: 'Carpenter', value: selectedVersionForSim.costs.carpenter },
                          { name: 'Painting', value: selectedVersionForSim.costs.painting },
                          { name: 'Packing', value: selectedVersionForSim.costs.packing },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#e76e50" /> {/* Materials - chart-1 */}
                        <Cell fill="#2a9d8f" /> {/* Carpenter - chart-2 */}
                        <Cell fill="#e9c46a" /> {/* Painting - chart-3 */}
                        <Cell fill="#264653" /> {/* Packing - chart-5 */}
                      </Pie>
                      <Tooltip formatter={(value: number) => `${value.toLocaleString()} THB`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-100 p-2 rounded">
                    <span className="block text-muted-foreground">Total Cost</span>
                    <span className="font-bold text-lg">{selectedVersionForSim.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="bg-gray-100 p-2 rounded">
                    <span className="block text-muted-foreground">Material Cost</span>
                    <span className="font-bold text-lg">{(selectedVersionForSim.totalCost - (selectedVersionForSim.costs.carpenter + selectedVersionForSim.costs.painting + selectedVersionForSim.costs.packing)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right: Simulator */}
              <div className="space-y-6 bg-gray-50 p-4 rounded border border-black/10">
                <h3 className="font-bold uppercase text-sm border-b-2 border-black pb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Profit Simulator
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Cost Adjustment</Label>
                      <span className={cn("font-bold", simCostMultiplier > 100 ? "text-red-500" : "text-green-500")}>
                        {simCostMultiplier}% ({Math.ceil(selectedVersionForSim.totalCost * (simCostMultiplier/100)).toLocaleString()} THB)
                      </span>
                    </div>
                    <Slider 
                      value={[simCostMultiplier]} 
                      min={50} 
                      max={150} 
                      step={5} 
                      onValueChange={(val) => setSimCostMultiplier(val[0])}
                      className="py-2"
                    />
                    <p className="text-[10px] text-muted-foreground">Adjust total cost from 50% to 150%</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Selling Price Adjustment</Label>
                      <span className={cn("font-bold", simPriceMultiplier > 100 ? "text-green-500" : "text-red-500")}>
                        {simPriceMultiplier}%
                      </span>
                    </div>
                    <Slider 
                      value={[simPriceMultiplier]} 
                      min={50} 
                      max={150} 
                      step={5} 
                      onValueChange={(val) => setSimPriceMultiplier(val[0])}
                      className="py-2"
                    />
                    <p className="text-[10px] text-muted-foreground">Adjust selling price from 50% to 150%</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-black/10 space-y-3">
                  <h4 className="font-bold text-xs uppercase text-muted-foreground">Simulated Results (Top Channel)</h4>
                  {(() => {
                    const simulatedCost = Math.ceil(selectedVersionForSim.totalCost * (simCostMultiplier/100));
                    // Use the best channel for simulation
                    const bestChannel = selectedVersionForSim.channels && selectedVersionForSim.channels.length > 0 
                      ? [...selectedVersionForSim.channels].sort((a, b) => b.marginPercent - a.marginPercent)[0]
                      : { name: "Default", price: selectedVersionForSim.sellingPrice, feePercent: 0 };
                    
                    const simulatedPrice = Math.ceil(bestChannel.price * (simPriceMultiplier/100));
                    const fee = Math.ceil(simulatedPrice * (bestChannel.feePercent / 100));
                    const netProfit = simulatedPrice - simulatedCost - fee;
                    const margin = simulatedPrice > 0 ? parseFloat(((netProfit / simulatedPrice) * 100).toFixed(1)) : 0;

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Channel:</span>
                          <span className="font-bold text-sm">{bestChannel.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Simulated Price:</span>
                          <span className="font-bold text-sm">{simulatedPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 border border-black/10 rounded">
                          <span className="text-sm font-bold">Net Profit:</span>
                          <div className="text-right">
                            <span className={cn("block font-bold text-lg", netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                              {netProfit.toLocaleString()} THB
                            </span>
                            <span className={cn("text-xs font-bold", margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-red-600")}>
                              {margin}% Margin
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsSimModalOpen(false)} className="w-full bg-black text-white hover:bg-gray-800">Close Simulator</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Prices Modal */}
      <Dialog open={isPriceModalOpen} onOpenChange={setIsPriceModalOpen}>
        <DialogContent className="max-w-md md:max-w-lg bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase flex items-center gap-2">
              <Tag className="w-5 h-5" /> Manage Prices (v.{selectedVersionForPrice?.version})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-100 p-3 rounded border border-gray-300 text-sm">
              <span className="font-bold">Total Cost:</span> {selectedVersionForPrice?.totalCost.toLocaleString()} THB
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {tempChannels.map((channel, index) => (
                <div key={index} className="border border-black/20 p-3 rounded bg-gray-50 space-y-3">
                  <div className="font-bold text-sm uppercase text-purple-700">{channel.name}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Selling Price</Label>
                      <Input 
                        type="number" 
                        value={channel.price} 
                        onChange={(e) => handlePriceChange(index, 'price', Number(e.target.value))}
                        className="h-8 bg-white border-black/30"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Fee %</Label>
                      <Input 
                        type="number" 
                        value={channel.feePercent} 
                        onChange={(e) => handlePriceChange(index, 'feePercent', Number(e.target.value))}
                        className="h-8 bg-white border-black/30"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-black/10">
                    <span>Net Profit:</span>
                    <span className={cn("font-bold", channel.profit >= 0 ? "text-green-600" : "text-red-600")}>
                      {channel.profit.toLocaleString()} THB ({channel.marginPercent}%)
                    </span>
                  </div>
                </div>
              ))}
              {tempChannels.length === 0 && (
                <div className="text-center text-muted-foreground py-4">No channels defined. Edit project to add channels.</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPriceModalOpen(false)} className="border-black">Cancel</Button>
            <Button onClick={savePrices} className="bg-black text-white hover:bg-gray-800">Save Prices</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
