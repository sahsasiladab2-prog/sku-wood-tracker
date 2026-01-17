import { useState } from "react";
import { woodData, WoodItem } from "@/lib/woodData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Calculator as CalcIcon, Save } from "lucide-react";
import { toast } from "sonner";

interface SelectedWood extends WoodItem {
  quantity: number;
}

export default function Calculator() {
  const [selectedWoods, setSelectedWoods] = useState<SelectedWood[]>([]);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [wastePercentage, setWastePercentage] = useState<number>(10);
  const [marginPercentage, setMarginPercentage] = useState<number>(30);
  const [projectName, setProjectName] = useState<string>("");

  const addWood = (code: string) => {
    const wood = woodData.find((w) => w.code === code);
    if (wood) {
      setSelectedWoods([...selectedWoods, { ...wood, quantity: 1 }]);
    }
  };

  const updateQuantity = (index: number, qty: number) => {
    const newWoods = [...selectedWoods];
    newWoods[index].quantity = Math.max(1, Math.ceil(qty));
    setSelectedWoods(newWoods);
  };

  const removeWood = (index: number) => {
    const newWoods = [...selectedWoods];
    newWoods.splice(index, 1);
    setSelectedWoods(newWoods);
  };

  // Calculation Logic (All Integers, Round Up)
  const totalWoodCost = selectedWoods.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const wasteCost = Math.ceil(totalWoodCost * (wastePercentage / 100));
  const totalMaterialCost = totalWoodCost + wasteCost;
  const totalCost = totalMaterialCost + laborCost;
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
    
    // In a real app, this would save to a database
    toast.success(`Project "${projectName}" saved! Selling Price: ${sellingPrice.toLocaleString()} THB`);
    
    // Reset for demo
    // setProjectName("");
    // setSelectedWoods([]);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            Wood Cost Calculator
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Calculate costs, add margins, and get rich!
          </p>
        </div>
        <Button 
          onClick={handleSaveProject}
          className="neo-button bg-chart-4 text-white hover:bg-emerald-600 h-12 px-6 text-lg"
        >
          <Save className="mr-2 h-5 w-5" /> Save Project
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Info */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-1">
              <CardTitle className="font-heading text-xl uppercase flex items-center gap-2">
                <span className="w-3 h-3 bg-black inline-block"></span> Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="font-bold uppercase">Project Name</Label>
                <Input 
                  id="projectName" 
                  placeholder="e.g. Modern Coffee Table" 
                  className="neo-input h-12 text-lg"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Wood Selection */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-3 text-white">
              <CardTitle className="font-heading text-xl uppercase flex items-center gap-2">
                <Plus className="w-6 h-6" /> Add Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-2">
                <Select onValueChange={addWood}>
                  <SelectTrigger className="neo-input h-12 text-lg w-full">
                    <SelectValue placeholder="Select Wood Item..." />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black shadow-[4px_4px_0px_0px_#000000]">
                    {woodData.map((wood) => (
                      <SelectItem key={wood.code} value={wood.code} className="font-medium cursor-pointer focus:bg-chart-1 focus:text-black">
                        {wood.code} - {wood.description} ({wood.cost} THB)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedWoods.length > 0 ? (
                <div className="border-2 border-black mt-4">
                  <Table>
                    <TableHeader className="bg-muted border-b-2 border-black">
                      <TableRow className="hover:bg-muted">
                        <TableHead className="text-black font-bold uppercase">Code</TableHead>
                        <TableHead className="text-black font-bold uppercase">Description</TableHead>
                        <TableHead className="text-black font-bold uppercase text-right">Cost</TableHead>
                        <TableHead className="text-black font-bold uppercase text-center w-[100px]">Qty</TableHead>
                        <TableHead className="text-black font-bold uppercase text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWoods.map((item, index) => (
                        <TableRow key={`${item.code}-${index}`} className="border-b border-black/20 hover:bg-blue-50">
                          <TableCell className="font-medium">{item.code}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.cost}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                              className="h-8 border-2 border-black text-center font-bold"
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {(item.cost * item.quantity).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeWood(index)}
                              className="hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-none bg-gray-50">
                  <p className="text-muted-foreground">No wood items added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Costs */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-5 text-white">
              <CardTitle className="font-heading text-xl uppercase flex items-center gap-2">
                <CalcIcon className="w-6 h-6" /> Costs & Margins
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="laborCost" className="font-bold uppercase">Labor Cost (THB)</Label>
                <Input 
                  id="laborCost" 
                  type="number" 
                  min="0"
                  value={laborCost}
                  onChange={(e) => setLaborCost(Math.max(0, parseInt(e.target.value) || 0))}
                  className="neo-input h-12 text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waste" className="font-bold uppercase">Waste (%)</Label>
                <div className="relative">
                  <Input 
                    id="waste" 
                    type="number" 
                    min="0"
                    value={wastePercentage}
                    onChange={(e) => setWastePercentage(Math.max(0, parseInt(e.target.value) || 0))}
                    className="neo-input h-12 text-lg font-bold pr-8"
                  />
                  <span className="absolute right-3 top-3 font-bold text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin" className="font-bold uppercase">Profit Margin (%)</Label>
                <div className="relative">
                  <Input 
                    id="margin" 
                    type="number" 
                    min="0"
                    value={marginPercentage}
                    onChange={(e) => setMarginPercentage(Math.max(0, parseInt(e.target.value) || 0))}
                    className="neo-input h-12 text-lg font-bold pr-8"
                  />
                  <span className="absolute right-3 top-3 font-bold text-muted-foreground">%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <Card className="neo-card bg-chart-1 border-black shadow-[8px_8px_0px_0px_#000000]">
              <CardHeader className="border-b-2 border-black pb-4">
                <CardTitle className="font-heading text-2xl uppercase text-center">
                  Total Price
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-center space-y-2">
                <div className="text-5xl font-black font-heading tracking-tighter">
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
                <div className="divide-y-2 divide-black">
                  <div className="flex justify-between p-4">
                    <span className="font-medium">Wood Cost</span>
                    <span className="font-bold">{totalWoodCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-red-50">
                    <span className="font-medium">Waste ({wastePercentage}%)</span>
                    <span className="font-bold text-red-600">+{wasteCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-blue-50">
                    <span className="font-medium">Labor</span>
                    <span className="font-bold text-blue-600">+{laborCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-100 font-bold border-t-4 border-black">
                    <span className="uppercase">Total Cost</span>
                    <span>{totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-green-50">
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
