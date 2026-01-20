import { useState, useEffect } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { useCustomData } from "@/contexts/CustomDataContext";
import { WoodItem } from "@/lib/woodData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Calculator as CalcIcon, Save, Package, AlertCircle, ChevronDown, ChevronUp, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface SelectedWood extends WoodItem {
  quantity: number;
  usage: string; // e.g., "Table Leg", "Top"
  usedLength: number; // Length used in cm
  calculatedCost: number; // Cost based on used length
  isCustom?: boolean; // Flag for manually added items
}



export default function Calculator() {
  const [selectedWoods, setSelectedWoods] = useState<SelectedWood[]>([]);
  
  // Costs
  const [carpenterCost, setCarpenterCost] = useState<number>(0);
  const [paintingCost, setPaintingCost] = useState<number>(0);
  const [packingCost, setPackingCost] = useState<number>(0);
  
  // Percentages
  const [wastePercentage, setWastePercentage] = useState<number>(5); // Default 5%
  const [marginPercentage, setMarginPercentage] = useState<number>(30);
  
  const { addProject, getProjectVersion } = useProjects();
  const { materials: woodData, usages, addMaterial, addUsage } = useCustomData();
  const [projectName, setProjectName] = useState<string>("");
  const [projectVersion, setProjectVersion] = useState<number>(1);
  const [projectNote, setProjectNote] = useState<string>("");

  // Custom Item Input State
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customCost, setCustomCost] = useState<number>(0);
  const [customRefQty, setCustomRefQty] = useState<number>(100);

  // Searchable Select State
  const [openCombobox, setOpenCombobox] = useState(false);

  // Auto-increment version when project name changes
  useEffect(() => {
    if (projectName) {
      const nextVersion = getProjectVersion(projectName);
      setProjectVersion(nextVersion);
    }
  }, [projectName, getProjectVersion]);

  const addWood = (code: string) => {
    const wood = woodData.find((w) => w.code === code);
    if (wood) {
      // Default used length is the reference length
      setSelectedWoods([...selectedWoods, { 
        ...wood, 
        quantity: 1, 
        usage: "", 
        usedLength: wood.refQty,
        calculatedCost: wood.cost 
      }]);
      setOpenCombobox(false);
    }
  };

  const addCustomWood = () => {
    if (!customCode || customCost <= 0) {
      toast.error("Please fill in Code and Cost.");
      return;
    }
    
    const newMaterial: WoodItem = {
      code: customCode,
      description: customDesc || "Custom Item",
      unit: "cm",
      refQty: customRefQty,
      cost: customCost
    };

    // Add to persistent storage
    addMaterial(newMaterial);

    const newItem: SelectedWood = {
      ...newMaterial,
      quantity: 1,
      usage: "",
      usedLength: customRefQty,
      calculatedCost: customCost,
      isCustom: true
    };

    setSelectedWoods([...selectedWoods, newItem]);
    
    // Reset inputs
    setCustomCode("");
    setCustomDesc("");
    setCustomCost(0);
    setCustomRefQty(100);
    setIsCustomOpen(false);
    toast.success("Custom item added!");
  };

  const updateItem = (index: number, field: keyof SelectedWood, value: any) => {
    const newWoods = [...selectedWoods];
    const item = newWoods[index];

    if (field === "quantity") {
      item.quantity = Math.max(1, Math.ceil(value));
    } else if (field === "usage") {
      item.usage = value;
      if (value) addUsage(value);
    } else if (field === "usedLength") {
      item.usedLength = Math.max(1, Math.ceil(value));
      // Recalculate cost based on length ratio: (RefCost / RefLength) * UsedLength
      // Round up to nearest integer
      const costPerUnit = item.cost / item.refQty;
      item.calculatedCost = Math.ceil(costPerUnit * item.usedLength);
    }

    setSelectedWoods(newWoods);
  };

  const removeWood = (index: number) => {
    const newWoods = [...selectedWoods];
    newWoods.splice(index, 1);
    setSelectedWoods(newWoods);
  };

  // Calculation Logic (All Integers, Round Up)
  const totalWoodCost = selectedWoods.reduce((sum, item) => sum + (item.calculatedCost * item.quantity), 0);
  const wasteCost = Math.ceil(totalWoodCost * (wastePercentage / 100));
  const totalMaterialCost = totalWoodCost + wasteCost;
  
  const totalLaborCost = carpenterCost + paintingCost + packingCost;
  const totalCost = totalMaterialCost + totalLaborCost;
  
  const profit = Math.ceil(totalCost * (marginPercentage / 100));
  const sellingPrice = totalCost + profit;

  const handleSaveProject = () => {
    if (!projectName) {
      toast.error("Please enter a project name!");
      return;
    }
    if (selectedWoods.length === 0) {
      toast.error("Please add at least one wood item!");
      return;
    }

    addProject({
      name: projectName,
      version: projectVersion,
      status: "Idea",
      margin: marginPercentage,
      totalCost: totalCost,
      sellingPrice: sellingPrice,
      note: projectNote,
      materials: selectedWoods,
      costs: {
        carpenter: carpenterCost,
        painting: paintingCost,
        packing: packingCost,
        waste: wasteCost,
        wastePercentage: wastePercentage
      }
    });
    
    toast.success(`Project "${projectName} v.${projectVersion}" saved! Selling Price: ${sellingPrice.toLocaleString()} THB`);
    
    // Reset form for next project
    setProjectName("");
    setProjectNote("");
    setSelectedWoods([]);
    setCarpenterCost(0);
    setPaintingCost(0);
    setPackingCost(0);
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            Wood Cost Calc
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">
            Calculate costs, add margins, and get rich!
          </p>
        </div>
        <Button 
          onClick={handleSaveProject}
          className="w-full md:w-auto neo-button bg-chart-4 text-white hover:bg-emerald-600 h-12 px-6 text-lg"
        >
          <Save className="mr-2 h-5 w-5" /> Save Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-1 py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <span className="w-3 h-3 bg-black inline-block"></span> Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="projectName" className="font-bold uppercase">Project Name</Label>
                  <Input 
                    id="projectName" 
                    placeholder="e.g. Modern Coffee Table" 
                    className="neo-input h-12 text-lg"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectVersion" className="font-bold uppercase">Version</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 font-bold text-muted-foreground">v.</span>
                    <Input 
                      id="projectVersion" 
                      type="number"
                      min="1"
                      className="neo-input h-12 text-lg font-bold pl-8 text-center bg-gray-50"
                      value={projectVersion}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wood Selection */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-3 text-white py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <Plus className="w-6 h-6" /> Add Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              {/* Searchable Select */}
              <div className="space-y-2">
                <Label className="font-bold uppercase text-xs text-muted-foreground">Select Wood Code</Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="w-full justify-between neo-input h-12 text-lg font-normal"
                    >
                      Select wood code...
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] md:w-[400px] p-0 border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
                    <Command>
                      <CommandInput placeholder="Type code to search..." className="h-12 text-base" />
                      <CommandList>
                        <CommandEmpty>No wood found.</CommandEmpty>
                        <CommandGroup>
                          {woodData.map((wood) => (
                            <CommandItem
                              key={wood.code}
                              value={wood.code}
                              onSelect={(currentValue) => {
                                addWood(currentValue);
                              }}
                              className="cursor-pointer py-3 text-base"
                            >
                              <span className="font-bold mr-2">{wood.code}</span>
                              <span className="text-muted-foreground">({wood.cost} THB)</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Collapsible Custom Item */}
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCustomOpen(!isCustomOpen)}
                  className="text-xs font-bold uppercase border-black hover:bg-gray-100"
                >
                  {isCustomOpen ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                  {isCustomOpen ? "Close Custom Item" : "Add Custom Item"}
                </Button>
                
                {isCustomOpen && (
                  <div className="mt-4 bg-gray-50 p-4 border-2 border-black border-dashed space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input 
                        placeholder="Code" 
                        value={customCode} 
                        onChange={(e) => setCustomCode(e.target.value)}
                        className="bg-white border-black"
                      />
                      <Input 
                        placeholder="Description (Optional)" 
                        value={customDesc} 
                        onChange={(e) => setCustomDesc(e.target.value)}
                        className="bg-white border-black md:col-span-3"
                      />
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="Cost" 
                          value={customCost || ""} 
                          onChange={(e) => setCustomCost(parseFloat(e.target.value))}
                          className="bg-white border-black pr-8"
                        />
                        <span className="absolute right-2 top-2 text-xs font-bold text-muted-foreground">THB</span>
                      </div>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="Ref Length" 
                          value={customRefQty || ""} 
                          onChange={(e) => setCustomRefQty(parseFloat(e.target.value))}
                          className="bg-white border-black pr-8"
                        />
                        <span className="absolute right-2 top-2 text-xs font-bold text-muted-foreground">cm</span>
                      </div>
                      <Button onClick={addCustomWood} className="md:col-span-2 bg-black text-white hover:bg-gray-800 font-bold uppercase">
                        Add Custom Item
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {selectedWoods.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block border-2 border-black mt-4 overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted border-b-2 border-black">
                        <TableRow className="hover:bg-muted">
                          <TableHead className="text-black font-bold uppercase w-[120px]">Code</TableHead>
                          <TableHead className="text-black font-bold uppercase w-[150px]">Usage</TableHead>
                          <TableHead className="text-black font-bold uppercase text-center w-[100px]">Len (cm)</TableHead>
                          <TableHead className="text-black font-bold uppercase text-right w-[100px]">Cost/Pc</TableHead>
                          <TableHead className="text-black font-bold uppercase text-center w-[80px]">Qty</TableHead>
                          <TableHead className="text-black font-bold uppercase text-right w-[100px]">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedWoods.map((item, index) => (
                          <TableRow key={`${item.code}-${index}`} className="border-b border-black/20 hover:bg-blue-50">
                            <TableCell className="font-medium">
                              {item.isCustom ? <span className="text-blue-600">* {item.code}</span> : item.code}
                            </TableCell>
                            <TableCell>
                          <div className="relative">
                            <Input 
                              value={item.usage}
                              onChange={(e) => updateItem(index, "usage", e.target.value)}
                              className="h-8 md:h-10 text-xs md:text-sm"
                              placeholder="e.g. Leg"
                              list={`usage-list-${index}`}
                            />
                            <datalist id={`usage-list-${index}`}>
                              {usages.map((u) => (
                                <option key={u} value={u} />
                              ))}
                            </datalist>
                          </div>
                        </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="1"
                                value={item.usedLength}
                                onChange={(e) => updateItem(index, "usedLength", parseInt(e.target.value) || 1)}
                                className="h-8 border-black/50 text-center font-bold"
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono">
                              {item.calculatedCost}
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                className="h-8 border-2 border-black text-center font-bold bg-white"
                              />
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {(item.calculatedCost * item.quantity).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeWood(index)}
                                className="hover:bg-red-100 hover:text-red-600 h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 mt-4">
                    {selectedWoods.map((item, index) => (
                      <div key={`${item.code}-${index}-mobile`} className="border-2 border-black p-3 bg-gray-50 shadow-[2px_2px_0px_0px_#000000] relative">
                        <div className="flex justify-between items-start mb-2 pr-8">
                          <div className="w-full pr-2">
                            <div className="font-bold text-lg text-primary flex items-center gap-2 mb-1">
                              {item.code}
                              {item.isCustom && <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded">CUSTOM</span>}
                            </div>
                            <Input 
                              value={item.usage}
                              onChange={(e) => updateItem(index, "usage", e.target.value)}
                              placeholder="Usage (e.g. Leg)"
                              className="h-8 border-black/50 text-xs w-full bg-white"
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeWood(index)}
                            className="absolute top-1 right-1 h-8 w-8 text-red-500 hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-black/10">
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">Length (cm)</Label>
                            <Input 
                              type="number" 
                              min="1"
                              value={item.usedLength}
                              onChange={(e) => updateItem(index, "usedLength", parseInt(e.target.value) || 1)}
                              className="h-8 border-black text-center font-bold bg-white text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                            <Input 
                              type="number" 
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                              className="h-8 border-black text-center font-bold bg-white text-sm"
                            />
                          </div>
                          <div className="text-right">
                            <Label className="text-[10px] uppercase text-muted-foreground">Total</Label>
                            <div className="font-black text-lg leading-8">
                              {(item.calculatedCost * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-none bg-gray-50">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-muted-foreground">No wood items added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costs & Note */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-5 text-white py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <CalcIcon className="w-6 h-6" /> Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              {/* Waste & Margin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="waste" className="font-bold uppercase text-red-600">Wood Waste (%)</Label>
                  <div className="relative">
                    <Input 
                      id="waste" 
                      type="number" 
                      min="0"
                      value={wastePercentage}
                      onChange={(e) => setWastePercentage(Math.max(0, parseInt(e.target.value) || 0))}
                      className="neo-input h-12 text-lg font-bold pr-8 border-red-200 focus:border-red-500"
                    />
                    <span className="absolute right-3 top-3 font-bold text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="margin" className="font-bold uppercase text-green-600">Profit Margin (%)</Label>
                  <div className="relative">
                    <Input 
                      id="margin" 
                      type="number" 
                      min="0"
                      value={marginPercentage}
                      onChange={(e) => setMarginPercentage(Math.max(0, parseInt(e.target.value) || 0))}
                      className="neo-input h-12 text-lg font-bold pr-8 border-green-200 focus:border-green-500"
                    />
                    <span className="absolute right-3 top-3 font-bold text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-black/10 w-full"></div>

              {/* Labor Costs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="carpenterCost" className="font-bold uppercase">Carpenter Cost</Label>
                  <Input 
                    id="carpenterCost" 
                    type="number" 
                    min="0"
                    value={carpenterCost}
                    onChange={(e) => setCarpenterCost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="neo-input h-12 text-lg font-bold"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packingCost" className="font-bold uppercase">Packing Cost</Label>
                  <Input 
                    id="packingCost" 
                    type="number" 
                    min="0"
                    value={packingCost}
                    onChange={(e) => setPackingCost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="neo-input h-12 text-lg font-bold"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paintingCost" className="font-bold uppercase">Painting Cost</Label>
                  <Input 
                    id="paintingCost" 
                    type="number" 
                    min="0"
                    value={paintingCost}
                    onChange={(e) => setPaintingCost(Math.max(0, parseInt(e.target.value) || 0))}
                    className="neo-input h-12 text-lg font-bold"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="h-px bg-black/10 w-full"></div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="note" className="font-bold uppercase">Note</Label>
                <Textarea 
                  id="note" 
                  placeholder="Add notes about this project..." 
                  className="neo-input min-h-[100px] text-base"
                  value={projectNote}
                  onChange={(e) => setProjectNote(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 md:top-8 space-y-6">
            <Card className="neo-card bg-chart-1 border-black shadow-[8px_8px_0px_0px_#000000]">
              <CardHeader className="border-b-2 border-black pb-4">
                <CardTitle className="font-heading text-xl md:text-2xl uppercase text-center">
                  Total Price
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center space-y-2">
                <div className="text-4xl md:text-5xl font-black font-heading tracking-tighter">
                  {sellingPrice.toLocaleString()}
                </div>
                <div className="text-sm font-bold uppercase tracking-widest opacity-70">THB</div>
              </CardContent>
            </Card>

            <Card className="neo-card bg-white">
              <CardHeader className="border-b-2 border-black bg-black text-white py-3">
                <CardTitle className="font-heading text-lg uppercase">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y-2 divide-black text-sm md:text-base">
                  <div className="flex justify-between p-3 md:p-4">
                    <span className="font-medium">Wood Cost</span>
                    <span className="font-bold">{totalWoodCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 md:p-4 bg-red-50">
                    <span className="font-medium">Waste ({wastePercentage}%)</span>
                    <span className="font-bold text-red-600">+{wasteCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 md:p-4 bg-blue-50">
                    <span className="font-medium">Carpenter</span>
                    <span className="font-bold text-blue-600">+{carpenterCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 md:p-4 bg-blue-50">
                    <span className="font-medium">Packing</span>
                    <span className="font-bold text-blue-600">+{packingCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 md:p-4 bg-blue-50">
                    <span className="font-medium">Painting</span>
                    <span className="font-bold text-blue-600">+{paintingCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 md:p-4 bg-gray-100 font-bold border-t-4 border-black">
                    <span className="uppercase">Total Cost</span>
                    <span>{totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-3 md:p-4 bg-green-50">
                    <span className="font-medium">Profit ({marginPercentage}%)</span>
                    <span className="font-bold text-green-600">+{profit.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
