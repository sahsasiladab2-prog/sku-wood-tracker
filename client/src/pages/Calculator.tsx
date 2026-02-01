import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useProjects } from "@/contexts/ProjectContext";
import { useCustomData } from "@/contexts/CustomDataContext";
import { WoodItem } from "@/lib/woodData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Minus, Calculator as CalcIcon, Save, Package, AlertCircle, ChevronDown, ChevronUp, Search, Store } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Settings } from "lucide-react";

interface SelectedWood extends WoodItem {
  quantity: number | ""; // Allow empty string for initial state
  usage: string; // e.g., "Table Leg", "Top"
  usedLength: number; // Length used in cm
  calculatedCost: number; // Cost based on used length
  isCustom?: boolean; // Flag for manually added items
}



export default function Calculator() {
  const [location, setLocation] = useLocation();
  const { projects, addProject, updateProject, getProjectVersion } = useProjects();
  const { materials: woodData, usages, defaultLaborCosts, addMaterial, addUsage, updateDefaultLaborCosts } = useCustomData();
  
  const [selectedWoods, setSelectedWoods] = useState<SelectedWood[]>([]);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [projectVersion, setProjectVersion] = useState<number>(1);
  const [projectNote, setProjectNote] = useState<string>("");
  const [productionType, setProductionType] = useState<"Outsource" | "In-House">("Outsource");

  // Costs
  const [carpenterCost, setCarpenterCost] = useState<number | "">("");
  const [paintingCost, setPaintingCost] = useState<number>(defaultLaborCosts.painting);
  const [packingCost, setPackingCost] = useState<number>(defaultLaborCosts.packing);

  // Settings Dialog State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempDefaultCosts, setTempDefaultCosts] = useState(defaultLaborCosts);

  // Update local costs when default costs change (only if not editing an existing project)
  useEffect(() => {
    if (!editingProjectId) {
      setCarpenterCost("");
      setPaintingCost(defaultLaborCosts.painting);
      setPackingCost(defaultLaborCosts.packing);
    }
  }, [defaultLaborCosts, editingProjectId]);

  const handleSaveSettings = () => {
    updateDefaultLaborCosts(tempDefaultCosts);
    setIsSettingsOpen(false);
    toast.success("Default labor costs updated!");
  };
  
  // Percentages
  const [wastePercentage, setWastePercentage] = useState<number>(5); // Default 5%
  const [marginPercentage, setMarginPercentage] = useState<number | "">("");
  
  // Multi-Channel Pricing State
  const [channels, setChannels] = useState<{ id: string; name: string; price: number; feePercent: number }[]>([
    { id: "default", name: "Default Price", price: 0, feePercent: 0 }
  ]);

  // Custom Item Input State
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customCost, setCustomCost] = useState<number>(0);
  const [customRefQty, setCustomRefQty] = useState<number>(100);

  // Searchable Select State
  const [openCombobox, setOpenCombobox] = useState(false);

  // Load project data if editing
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get("edit");

    if (editId) {
      const projectToEdit = projects.find(p => p.id === editId);
      if (projectToEdit) {
        setProjectName(projectToEdit.name);
        // Keep the same version if editing, or maybe user wants to create new version based on old one?
        // For now, let's load the version but if they change name, it will recalculate.
        // Actually, if we are "editing" to create a NEW version, we should probably load everything EXCEPT the version (let it auto-calc).
        // But user request was "Edit", implying modification. 
        // However, in this system, "Versions" are immutable snapshots usually.
        // Let's load the data as a "Template" for the NEXT version.
        // So we load name, materials, costs, note. Version will be auto-calculated as next version.
        
        setProjectNote(projectToEdit.note || "");
        setProductionType(projectToEdit.productionType || "Outsource");
        setCarpenterCost(projectToEdit.costs.carpenter || "");
        setPaintingCost(projectToEdit.costs.painting);
        setPackingCost(projectToEdit.costs.packing);
        setWastePercentage(projectToEdit.costs.wastePercentage || 5);
        setMarginPercentage(projectToEdit.margin || "");
        setProjectVersion(projectToEdit.version);
        setEditingProjectId(projectToEdit.id);

        // Load channels if exist, otherwise use default
        if (projectToEdit.channels && projectToEdit.channels.length > 0) {
          setChannels(projectToEdit.channels.map(c => ({ 
            id: c.id, 
            name: c.name, 
            price: c.price,
            feePercent: c.feePercent || 0 // Default to 0 if not present in old data
          })));
        } else {
          // Backward compatibility: use sellingPrice as default channel
          setChannels([{ id: "default", name: "Default Price", price: projectToEdit.sellingPrice, feePercent: 0 }]);
        }

        // Map materials back to SelectedWood format
        if (projectToEdit.materials) {
          const mappedMaterials = projectToEdit.materials.map(m => ({
            ...m,
            // Ensure calculatedCost is present (it should be in saved data)
            calculatedCost: m.calculatedCost || m.cost
          }));
          setSelectedWoods(mappedMaterials);
        }
        
        toast.info(`Editing ${projectToEdit.name} v.${projectToEdit.version}`);
      }
    }
  }, [projects]);

  // Auto-increment version when project name changes (ONLY if not editing existing project)
  useEffect(() => {
    if (projectName && !editingProjectId) {
      const nextVersion = getProjectVersion(projectName);
      setProjectVersion(nextVersion);

      // Try to find the latest version of this project to copy channels/prices
      // We look for projects with the same name
      const existingProjects = projects.filter(p => p.name.toLowerCase() === projectName.toLowerCase());
      
      if (existingProjects.length > 0) {
        // Sort by version descending to get the latest
        const latestProject = existingProjects.sort((a, b) => b.version - a.version)[0];
        
        if (latestProject) {
          // Copy channels and prices from the latest version
          if (latestProject.channels && latestProject.channels.length > 0) {
            setChannels(latestProject.channels.map(c => ({
              id: crypto.randomUUID(), // Generate new IDs to avoid linking to old project
              name: c.name,
              price: c.price,
              feePercent: c.feePercent || 0
            })));
          }

          // Copy materials, costs, and other settings from the latest version
          // This allows user to start v2 based on v1 data
          if (latestProject.materials) {
            const mappedMaterials = latestProject.materials.map(m => ({
              ...m,
              calculatedCost: m.calculatedCost || m.cost
            }));
            setSelectedWoods(mappedMaterials);
          }

          // Copy labor and other costs
          setCarpenterCost(latestProject.costs.carpenter || "");
          setPaintingCost(latestProject.costs.painting);
          setPackingCost(latestProject.costs.packing);
          setWastePercentage(latestProject.costs.wastePercentage || 5);
          setMarginPercentage(latestProject.margin || "");
          
          // Notify user that data was copied
          toast.success(`Loaded data from v.${latestProject.version} for new version!`);
        }
      }
    }
  }, [projectName, getProjectVersion, editingProjectId, projects]);

  const addWood = (code: string) => {
    const wood = woodData.find((w) => w.code === code);
    if (wood) {
      // Default used length is the reference length
      setSelectedWoods([...selectedWoods, { 
        ...wood, 
        quantity: "", // Start with empty quantity
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
      quantity: "", // Start with empty quantity
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
      // Allow setting to empty string or number
      if (value === "") {
        item.quantity = "";
      } else {
        item.quantity = Math.max(1, Math.ceil(Number(value)));
      }
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
  const totalWoodCost = selectedWoods.reduce((sum, item) => sum + (item.calculatedCost * (typeof item.quantity === 'number' ? item.quantity : 0)), 0);
  const wasteCost = Math.ceil(totalWoodCost * (wastePercentage / 100));
  const totalMaterialCost = totalWoodCost + wasteCost;
  
  const totalLaborCost = (typeof carpenterCost === 'number' ? carpenterCost : 0) + paintingCost + packingCost;
  const totalCost = totalMaterialCost + (typeof carpenterCost === 'number' ? carpenterCost : 0) + paintingCost + packingCost;
  
  const profit = Math.ceil(totalCost * ((typeof marginPercentage === 'number' ? marginPercentage : 0) / 100));
  const sellingPrice = totalCost + profit;

  // Update default channel price if it hasn't been manually edited (optional logic, but let's keep it simple for now)
  // Actually, let's sync the "Default Price" channel with the calculated sellingPrice if it exists and hasn't been modified?
  // Better approach: The "Margin %" input controls the "Base Price". 
  // The Channels are independent overrides.
  // Let's initialize new channels with the calculated sellingPrice.

  const addChannel = () => {
    setChannels([...channels, { id: crypto.randomUUID(), name: "New Channel", price: sellingPrice, feePercent: 27.61 }]);
  };

  const removeChannel = (index: number) => {
    const newChannels = [...channels];
    newChannels.splice(index, 1);
    setChannels(newChannels);
  };

  const updateChannel = (index: number, field: keyof typeof channels[0], value: any) => {
    const newChannels = [...channels];
    
    if (field === "name") {
      const nameVal = String(value);
      newChannels[index] = { ...newChannels[index], name: nameVal };
      
      // Auto-set fee for Shopee (starts with "Sp.")
      if (nameVal.toLowerCase().startsWith("sp.")) {
        newChannels[index].feePercent = 27.61;
      }
    } else {
      newChannels[index] = { ...newChannels[index], [field]: value };
    }
    
    setChannels(newChannels);
  };

  const handleSaveProject = () => {
    if (!projectName) {
      toast.error("Please enter a project name!");
      return;
    }
    if (selectedWoods.length === 0) {
      toast.error("Please add at least one wood item!");
      return;
    }

    // Calculate profit for each channel
    const calculatedChannels = channels.map(c => {
      const feeAmount = Math.ceil(c.price * (c.feePercent / 100));
      const netPrice = c.price - feeAmount;
      const channelProfit = netPrice - totalCost;
      // Net Profit Margin = (Net Profit / Selling Price) * 100
      const channelMargin = c.price > 0 ? (channelProfit / c.price) * 100 : 0;
      return {
        ...c,
        profit: channelProfit,
        marginPercent: parseFloat(channelMargin.toFixed(1))
      };
    });

    const projectData = {
      name: projectName,
      version: projectVersion,
      status: "Idea" as const,
      margin: typeof marginPercentage === 'number' ? marginPercentage : 0,
      totalCost: totalCost,
      sellingPrice: sellingPrice, // This remains as the "Base/Calculated Price"
      channels: calculatedChannels,
      note: projectNote,
      productionType,
      materials: selectedWoods,
      costs: {
        carpenter: typeof carpenterCost === 'number' ? carpenterCost : 0,
        painting: paintingCost,
        packing: packingCost,
        waste: wasteCost,
        wastePercentage: wastePercentage
      }
    };

    if (editingProjectId) {
      updateProject(editingProjectId, projectData);
      toast.success(`Project "${projectName} v.${projectVersion}" updated!`);
      // Clear edit mode after update
      setEditingProjectId(null);
      setLocation("/tracker"); // Redirect back to tracker after edit
    } else {
      addProject(projectData);
      toast.success(`Project "${projectName} v.${projectVersion}" created!`);
      
      // Reset form for next project
      setProjectName("");
      setProjectNote("");
      setSelectedWoods([]);
      setCarpenterCost("");
      setPaintingCost(0);
      setPackingCost(0);
    }
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
        <div className="flex gap-2 w-full md:w-auto">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 md:flex-none neo-button bg-white text-black hover:bg-gray-100 h-12 px-4"
                onClick={() => setTempDefaultCosts(defaultLaborCosts)}
              >
                <Settings className="mr-2 h-5 w-5" /> Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_#000000]">
              <DialogHeader>
                <DialogTitle className="font-heading uppercase text-xl">Default Labor Costs</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="def-carpenter" className="text-right font-bold uppercase">
                    Carpenter
                  </Label>
                  <Input
                    id="def-carpenter"
                    type="number"
                    value={tempDefaultCosts.carpenter}
                    onChange={(e) => setTempDefaultCosts({ ...tempDefaultCosts, carpenter: Number(e.target.value) })}
                    className="col-span-3 neo-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="def-painting" className="text-right font-bold uppercase">
                    Painting
                  </Label>
                  <Input
                    id="def-painting"
                    type="number"
                    value={tempDefaultCosts.painting}
                    onChange={(e) => setTempDefaultCosts({ ...tempDefaultCosts, painting: Number(e.target.value) })}
                    className="col-span-3 neo-input"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="def-packing" className="text-right font-bold uppercase">
                    Packing
                  </Label>
                  <Input
                    id="def-packing"
                    type="number"
                    value={tempDefaultCosts.packing}
                    onChange={(e) => setTempDefaultCosts({ ...tempDefaultCosts, packing: Number(e.target.value) })}
                    className="col-span-3 neo-input"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveSettings} className="neo-button bg-black text-white hover:bg-gray-800 w-full">
                  Save Defaults
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button 
            onClick={handleSaveProject}
            className="flex-1 md:flex-none neo-button bg-chart-4 text-white hover:bg-emerald-600 h-12 px-6 text-lg"
          >
            <Save className="mr-2 h-5 w-5" /> Save Project
          </Button>
        </div>
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
                <div className="md:col-span-2 space-y-2">
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
                  <Label htmlFor="productionType" className="font-bold uppercase">Production Type</Label>
                  <Select value={productionType} onValueChange={(v: "Outsource" | "In-House") => setProductionType(v)}>
                    <SelectTrigger className="neo-input h-12 text-lg font-bold bg-white">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outsource">Outsource (ช่างนอก)</SelectItem>
                      <SelectItem value="In-House">In-House (โรงงานทำเอง)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectVersion" className="font-bold uppercase">Version</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 font-bold text-muted-foreground">v.</span>
                    <Input 
                      id="projectVersion" 
                      type="number"
                      min="1"
                      className="neo-input h-12 text-lg font-bold pl-8 text-center bg-white"
                      value={projectVersion}
                      onChange={(e) => setProjectVersion(Math.max(1, parseInt(e.target.value) || 1))}
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
                          type="text" 
                          inputMode="numeric"
                          placeholder="Cost" 
                          value={customCost === 0 ? "" : customCost} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d+(\.\d*)?$/.test(val)) {
                              setCustomCost(Number(val));
                            }
                          }}
                          className="bg-white border-black pr-8"
                        />
                        <span className="absolute right-2 top-2 text-xs font-bold text-muted-foreground">THB</span>
                      </div>
                      <div className="relative">
                        <Input 
                          type="text" 
                          inputMode="numeric"
                          placeholder="Ref Length" 
                          value={customRefQty === 0 ? "" : customRefQty} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^\d+(\.\d*)?$/.test(val)) {
                              setCustomRefQty(Number(val));
                            }
                          }}
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
                                type="text" 
                                inputMode="numeric"
                                value={item.usedLength === 0 ? "" : item.usedLength}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "" || /^\d+$/.test(val)) {
                                    updateItem(index, "usedLength", Number(val));
                                  }
                                }}
                                className="h-8 border-black/50 text-center font-bold"
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs font-mono">
                              {item.calculatedCost}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 p-0 border-black hover:bg-gray-100"
                                  onClick={() => {
                                    const currentQty = typeof item.quantity === 'number' ? item.quantity : 0;
                                    if (currentQty > 1) updateItem(index, "quantity", currentQty - 1);
                                  }}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input 
                                  type="text" 
                                  inputMode="numeric"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                      updateItem(index, "quantity", "");
                                    } else if (/^\d+$/.test(val)) {
                                      updateItem(index, "quantity", Number(val));
                                    }
                                  }}
                                  className="h-8 w-12 border-black text-center font-bold bg-white text-sm px-1"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 p-0 border-black hover:bg-gray-100"
                                  onClick={() => {
                                    const currentQty = typeof item.quantity === 'number' ? item.quantity : 0;
                                    updateItem(index, "quantity", currentQty + 1);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {(item.calculatedCost * (typeof item.quantity === 'number' ? item.quantity : 0)).toLocaleString()}
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
                              type="text" 
                              inputMode="numeric"
                              value={item.usedLength === 0 ? "" : item.usedLength}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || /^\d+$/.test(val)) {
                                  updateItem(index, "usedLength", Number(val));
                                }
                              }}
                              className="h-8 border-black text-center font-bold bg-white text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">Qty</Label>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 p-0 border-black hover:bg-gray-100 flex-shrink-0"
                                onClick={() => {
                                  const currentQty = typeof item.quantity === 'number' ? item.quantity : 0;
                                  if (currentQty > 1) updateItem(index, "quantity", currentQty - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input 
                                type="text" 
                                inputMode="numeric"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "") {
                                    updateItem(index, "quantity", "");
                                  } else if (/^\d+$/.test(val)) {
                                    updateItem(index, "quantity", Number(val));
                                  }
                                }}
                                className="h-8 border-black/50 text-center font-bold px-1"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 p-0 border-black hover:bg-gray-100 flex-shrink-0"
                                onClick={() => {
                                  const currentQty = typeof item.quantity === 'number' ? item.quantity : 0;
                                  updateItem(index, "quantity", currentQty + 1);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-right">
                            <Label className="text-[10px] uppercase text-muted-foreground">Total</Label>
                            <div className="font-black text-lg leading-8">
                              {(item.calculatedCost * (typeof item.quantity === 'number' ? item.quantity : 0)).toLocaleString()}
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
              {/* Waste & Carpenter Cost */}
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
                  <Label htmlFor="carpenterCost" className="font-bold uppercase">Carpenter Cost</Label>
                  <Input 
                    id="carpenterCost" 
                    type="number" 
                    min="0"
                    value={carpenterCost}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") setCarpenterCost("");
                      else setCarpenterCost(Math.max(0, parseInt(val) || 0));
                    }}
                    className="neo-input h-12 text-lg font-bold"
                    placeholder=""
                  />
                </div>
              </div>

              <div className="h-px bg-black/10 w-full"></div>

              {/* Other Costs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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

              {/* Profit Margin */}
              <div className="space-y-2">
                <Label htmlFor="margin" className="font-bold uppercase text-green-600">Net Margin (%)</Label>
                <div className="relative">
                  <Input 
                    id="margin" 
                    type="number" 
                    min="0"
                    value={marginPercentage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") setMarginPercentage("");
                      else setMarginPercentage(Math.max(0, parseInt(val) || 0));
                    }}
                    className="neo-input h-12 text-lg font-bold pr-8 border-green-200 focus:border-green-500"
                    placeholder=""
                  />
                  <span className="absolute right-3 top-3 font-bold text-muted-foreground">%</span>
                </div>
              </div>

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

          {/* Multi-Channel Pricing */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-purple-500 text-white py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <Store className="w-6 h-6" /> Sales Channels Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="space-y-4">
                {channels.map((channel, index) => {
                  const feeAmount = Math.ceil(channel.price * (channel.feePercent / 100));
                  const netPrice = channel.price - feeAmount;
                  const profit = netPrice - totalCost;
                  const margin = totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) : "0";
                  const isPositive = profit >= 0;

                  return (
                    <div key={channel.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 border-2 border-black/10 rounded-lg">
                      <div className="flex-1 w-full md:w-auto min-w-[200px]">
                        <Label className="text-[10px] uppercase text-muted-foreground">Channel Name</Label>
                        <div className="relative">
                           <Command className="border border-black rounded-md z-50 overflow-visible">
                            <CommandInput 
                              placeholder="Select or type..." 
                              value={channel.name}
                              onValueChange={(val) => updateChannel(index, "name", val)}
                              className="h-9 font-bold"
                            />
                            <CommandList className="absolute top-full left-0 w-full bg-white border-2 border-black rounded-md shadow-lg z-[100] hidden group-focus-within:block">
                              <CommandGroup>
                                {["Sp.De", "Sp.Tb", "Lazada", "Retail", "Wholesale"].map((option) => (
                                  <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                      updateChannel(index, "name", currentValue);
                                    }}
                                    className="cursor-pointer font-medium hover:bg-gray-100"
                                  >
                                    {option}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                          {/* Fallback simple input/select combo if Command is too complex for inline */}
                          <div className="flex gap-1 mt-1">
                             {["Sp.De", "Sp.Tb"].map(opt => (
                               <Badge 
                                 key={opt} 
                                 variant="outline" 
                                 className="cursor-pointer hover:bg-black hover:text-white"
                                 onClick={() => updateChannel(index, "name", opt)}
                               >
                                 {opt}
                               </Badge>
                             ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full md:w-[120px]">
                        <Label className="text-[10px] uppercase text-muted-foreground">Price</Label>
                        <div className="relative">
                          <Input 
                            type="number"
                            value={channel.price || ""} // Empty string if 0 to avoid leading zero
                            onChange={(e) => updateChannel(index, "price", parseFloat(e.target.value) || 0)}
                            className="h-9 bg-white border-black font-bold pr-1"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="w-full md:w-[100px]">
                        <Label className="text-[10px] uppercase text-muted-foreground">Fee %</Label>
                        <div className="relative">
                          <Input 
                            type="number"
                            value={channel.feePercent}
                            onChange={(e) => updateChannel(index, "feePercent", parseFloat(e.target.value) || 0)}
                            className="h-9 bg-white border-black font-bold pr-6"
                          />
                          <span className="absolute right-2 top-2 text-xs font-bold text-muted-foreground">%</span>
                        </div>
                      </div>

                      <div className="flex-1 w-full md:w-auto flex flex-col justify-center px-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Fee:</span>
                          <span className="font-bold text-red-500">-{feeAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Net:</span>
                          <span className="font-bold">{netPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1 pt-1 border-t border-black/10">
                          <span className="text-[10px] uppercase font-bold">Profit</span>
                          <span className={cn("font-bold", isPositive ? "text-green-600" : "text-red-600")}>
                            {profit.toLocaleString()} ({margin}%)
                          </span>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeChannel(index)}
                        className="text-red-500 hover:bg-red-100 self-end md:self-center"
                        disabled={channels.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <Button onClick={addChannel} variant="outline" className="w-full border-2 border-dashed border-black hover:bg-gray-50">
                <Plus className="w-4 h-4 mr-2" /> Add Sales Channel
              </Button>
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
