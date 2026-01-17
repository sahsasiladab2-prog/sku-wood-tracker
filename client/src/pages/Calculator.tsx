import { useState } from "react";
import { woodData, WoodItem } from "@/lib/woodData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Calculator as CalcIcon, Save, Package } from "lucide-react";
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
    
    toast.success(`Project "${projectName}" saved! Selling Price: ${sellingPrice.toLocaleString()} THB`);
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
            <CardHeader className="border-b-2 border-black bg-chart-3 text-white py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <Plus className="w-6 h-6" /> Add Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex gap-2">
                <Select onValueChange={addWood}>
                  <SelectTrigger className="neo-input h-12 text-lg w-full">
                    <SelectValue placeholder="Select Wood Item..." />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black shadow-[4px_4px_0px_0px_#000000] max-h-[300px]">
                    {woodData.map((wood) => (
                      <SelectItem key={wood.code} value={wood.code} className="font-medium cursor-pointer focus:bg-chart-1 focus:text-black py-3">
                        <span className="font-bold">{wood.code}</span> - {wood.description} ({wood.cost} THB)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedWoods.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block border-2 border-black mt-4">
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

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 mt-4">
                    {selectedWoods.map((item, index) => (
                      <div key={`${item.code}-${index}-mobile`} className="border-2 border-black p-3 bg-gray-50 shadow-[2px_2px_0px_0px_#000000] relative">
                        <div className="flex justify-between items-start mb-2 pr-8">
                          <div>
                            <div className="font-bold text-lg text-primary">{item.code}</div>
                            <div className="text-sm text-muted-foreground leading-tight">{item.description}</div>
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
                        
                        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-black/10">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-muted-foreground">Cost: {item.cost}</span>
                            <span className="text-xs text-muted-foreground">x</span>
                            <Input 
                              type="number" 
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                              className="h-8 w-16 border-2 border-black text-center font-bold bg-white"
                            />
                          </div>
                          <div className="font-black text-lg">
                            {(item.cost * item.quantity).toLocaleString()} ฿
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

          {/* Other Costs */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-5 text-white py-3 md:py-4">
              <CardTitle className="font-heading text-lg md:text-xl uppercase flex items-center gap-2">
                <CalcIcon className="w-6 h-6" /> Costs & Margins
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
                    <span className="font-medium">Labor</span>
                    <span className="font-bold text-blue-600">+{laborCost.toLocaleString()}</span>
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
