import { useState, useMemo } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCompare, Factory, Wrench, TrendingUp, TrendingDown, DollarSign, Percent, Package, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Compare() {
  const { projects } = useProjects();
  const [selectedSku, setSelectedSku] = useState<string>("");

  // Get unique SKU names that have both Outsource and In-House versions
  const skusWithBothTypes = useMemo(() => {
    const skuMap = new Map<string, { outsource: boolean; inHouse: boolean }>();
    
    projects.forEach(p => {
      const current = skuMap.get(p.name) || { outsource: false, inHouse: false };
      if (p.productionType === "In-House") {
        current.inHouse = true;
      } else {
        current.outsource = true;
      }
      skuMap.set(p.name, current);
    });

    return Array.from(skuMap.entries())
      .filter(([_, types]) => types.outsource && types.inHouse)
      .map(([name]) => name)
      .sort();
  }, [projects]);

  // Get all unique SKU names for selection
  const allSkuNames = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.name))).sort();
  }, [projects]);

  // Get latest versions for selected SKU
  const comparisonData = useMemo(() => {
    if (!selectedSku) return null;

    const skuProjects = projects.filter(p => p.name === selectedSku);
    
    // Get latest Outsource version
    const outsourceVersions = skuProjects
      .filter(p => p.productionType !== "In-House")
      .sort((a, b) => b.version - a.version);
    
    // Get latest In-House version
    const inHouseVersions = skuProjects
      .filter(p => p.productionType === "In-House")
      .sort((a, b) => b.version - a.version);

    return {
      outsource: outsourceVersions[0] || null,
      inHouse: inHouseVersions[0] || null,
    };
  }, [selectedSku, projects]);

  // Calculate best margin for a project
  const getBestMargin = (project: typeof projects[0] | null) => {
    if (!project) return { margin: 0, channelName: "-", profit: 0 };
    
    if (project.channels && project.channels.length > 0) {
      const calculatedChannels = project.channels.map(c => {
        const price = c.price || 0;
        const feePercent = c.feePercent || 0;
        const fee = Math.ceil(price * (feePercent / 100));
        const totalCost = project.totalCost || 0;
        const netProfit = price - totalCost - fee;
        const margin = price > 0 ? parseFloat(((netProfit / price) * 100).toFixed(1)) : 0;
        return { ...c, realMargin: margin, realProfit: netProfit };
      });

      const bestChannel = calculatedChannels.reduce((prev, current) => 
        (current.realMargin > prev.realMargin) ? current : prev
      );

      return {
        margin: bestChannel.realMargin,
        channelName: bestChannel.name,
        profit: bestChannel.realProfit,
      };
    }

    return { margin: 0, channelName: "-", profit: 0 };
  };

  const outsourceStats = comparisonData?.outsource ? getBestMargin(comparisonData.outsource) : null;
  const inHouseStats = comparisonData?.inHouse ? getBestMargin(comparisonData.inHouse) : null;

  // Calculate differences
  const costDiff = comparisonData?.outsource && comparisonData?.inHouse 
    ? comparisonData.outsource.totalCost - comparisonData.inHouse.totalCost 
    : 0;
  
  const marginDiff = outsourceStats && inHouseStats 
    ? inHouseStats.margin - outsourceStats.margin 
    : 0;

  const profitDiff = outsourceStats && inHouseStats 
    ? inHouseStats.profit - outsourceStats.profit 
    : 0;

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
            เปรียบเทียบต้นทุน
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">
            เปรียบเทียบ Outsource vs In-House เพื่อตัดสินใจที่ดีที่สุด
          </p>
        </div>
        <Link href="/tracker">
          <Button variant="outline" className="neo-button bg-white text-black border-2 border-black hover:bg-gray-100 h-12 px-4">
            <ArrowLeft className="mr-2 h-5 w-5" /> กลับ Tracker
          </Button>
        </Link>
      </div>

      {/* SKU Selector */}
      <Card className="neo-card bg-gradient-to-r from-purple-100 to-blue-100">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-14 h-14 bg-purple-500 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
              <GitCompare className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-heading text-xl font-bold uppercase">เลือก SKU ที่ต้องการเปรียบเทียบ</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {skusWithBothTypes.length > 0 
                  ? `มี ${skusWithBothTypes.length} SKU ที่มีทั้ง Outsource และ In-House`
                  : "ยังไม่มี SKU ที่มีทั้ง 2 แบบ"}
              </p>
            </div>
            <div className="w-full md:w-[300px]">
              <Select value={selectedSku} onValueChange={setSelectedSku}>
                <SelectTrigger className="h-14 border-2 border-black shadow-[3px_3px_0px_0px_#000000] font-bold text-lg">
                  <SelectValue placeholder="เลือก SKU..." />
                </SelectTrigger>
                <SelectContent>
                  {allSkuNames.map(name => (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        {name}
                        {skusWithBothTypes.includes(name) && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            มีทั้ง 2 แบบ
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedSku && comparisonData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={cn(
              "neo-card",
              costDiff > 0 ? "bg-green-50 border-green-300" : costDiff < 0 ? "bg-red-50 border-red-300" : "bg-gray-50"
            )}>
              <CardContent className="p-6 text-center">
                <DollarSign className={cn(
                  "w-10 h-10 mx-auto mb-2",
                  costDiff > 0 ? "text-green-600" : costDiff < 0 ? "text-red-600" : "text-gray-600"
                )} />
                <p className="text-sm font-bold uppercase text-muted-foreground">ส่วนต่างต้นทุน</p>
                <h3 className={cn(
                  "font-heading text-3xl font-bold mt-1",
                  costDiff > 0 ? "text-green-600" : costDiff < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  ฿{Math.abs(costDiff).toLocaleString()}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {costDiff > 0 ? "In-House ถูกกว่า" : costDiff < 0 ? "Outsource ถูกกว่า" : "เท่ากัน"}
                </p>
              </CardContent>
            </Card>

            <Card className={cn(
              "neo-card",
              marginDiff > 0 ? "bg-green-50 border-green-300" : marginDiff < 0 ? "bg-red-50 border-red-300" : "bg-gray-50"
            )}>
              <CardContent className="p-6 text-center">
                <Percent className={cn(
                  "w-10 h-10 mx-auto mb-2",
                  marginDiff > 0 ? "text-green-600" : marginDiff < 0 ? "text-red-600" : "text-gray-600"
                )} />
                <p className="text-sm font-bold uppercase text-muted-foreground">ส่วนต่าง Margin</p>
                <h3 className={cn(
                  "font-heading text-3xl font-bold mt-1",
                  marginDiff > 0 ? "text-green-600" : marginDiff < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  {marginDiff.toFixed(1)}%
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {marginDiff > 0 ? "In-House ดีกว่า" : marginDiff < 0 ? "Outsource ดีกว่า" : "เท่ากัน"}
                </p>
              </CardContent>
            </Card>

            <Card className={cn(
              "neo-card",
              profitDiff > 0 ? "bg-green-50 border-green-300" : profitDiff < 0 ? "bg-red-50 border-red-300" : "bg-gray-50"
            )}>
              <CardContent className="p-6 text-center">
                <TrendingUp className={cn(
                  "w-10 h-10 mx-auto mb-2",
                  profitDiff > 0 ? "text-green-600" : profitDiff < 0 ? "text-red-600" : "text-gray-600"
                )} />
                <p className="text-sm font-bold uppercase text-muted-foreground">ส่วนต่างกำไร</p>
                <h3 className={cn(
                  "font-heading text-3xl font-bold mt-1",
                  profitDiff > 0 ? "text-green-600" : profitDiff < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  ฿{profitDiff.toLocaleString()}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {profitDiff > 0 ? "In-House ดีกว่า" : profitDiff < 0 ? "Outsource ดีกว่า" : "เท่ากัน"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Outsource Card */}
            <Card className={cn(
              "neo-card overflow-hidden",
              !comparisonData.outsource ? "opacity-50" : ""
            )}>
              <CardHeader className="bg-orange-400 text-white py-4 border-b-2 border-black">
                <CardTitle className="font-heading text-xl uppercase flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
                    <Wrench className="w-5 h-5" />
                  </div>
                  Outsource (ช่างนอก)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {comparisonData.outsource ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-muted-foreground">Version</span>
                      <span className="font-bold">v.{comparisonData.outsource.version}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-muted-foreground">ต้นทุนรวม</span>
                      <span className="font-heading text-2xl font-bold">฿{comparisonData.outsource.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-muted-foreground">Net Margin</span>
                      <span className={cn(
                        "font-bold text-lg px-3 py-1 rounded",
                        outsourceStats && outsourceStats.margin >= 20 ? "bg-green-100 text-green-700" :
                        outsourceStats && outsourceStats.margin >= 10 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {outsourceStats?.margin || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-muted-foreground">กำไรสุทธิ</span>
                      <span className="font-bold text-lg">฿{outsourceStats?.profit.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-muted-foreground">ช่องทาง</span>
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{outsourceStats?.channelName || "-"}</span>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="mt-4 pt-4 border-t-2 border-dashed">
                      <h4 className="font-bold uppercase text-sm text-muted-foreground mb-3">รายละเอียดต้นทุน</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>ค่าช่าง</span>
                          <span>฿{comparisonData.outsource.costs?.carpenter?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ค่าทาสี</span>
                          <span>฿{comparisonData.outsource.costs?.painting?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ค่าแพ็ค</span>
                          <span>฿{comparisonData.outsource.costs?.packing?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ค่าเสียหาย</span>
                          <span>฿{comparisonData.outsource.costs?.waste?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>ยังไม่มีข้อมูล Outsource สำหรับ SKU นี้</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* In-House Card */}
            <Card className={cn(
              "neo-card overflow-hidden",
              !comparisonData.inHouse ? "opacity-50" : ""
            )}>
              <CardHeader className="bg-blue-500 text-white py-4 border-b-2 border-black">
                <CardTitle className="font-heading text-xl uppercase flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
                    <Factory className="w-5 h-5" />
                  </div>
                  In-House (โรงงาน)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {comparisonData.inHouse ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-muted-foreground">Version</span>
                      <span className="font-bold">v.{comparisonData.inHouse.version}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-muted-foreground">ต้นทุนรวม</span>
                      <span className="font-heading text-2xl font-bold">฿{comparisonData.inHouse.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-muted-foreground">Net Margin</span>
                      <span className={cn(
                        "font-bold text-lg px-3 py-1 rounded",
                        inHouseStats && inHouseStats.margin >= 20 ? "bg-green-100 text-green-700" :
                        inHouseStats && inHouseStats.margin >= 10 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {inHouseStats?.margin || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium text-muted-foreground">กำไรสุทธิ</span>
                      <span className="font-bold text-lg">฿{inHouseStats?.profit.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-muted-foreground">ช่องทาง</span>
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{inHouseStats?.channelName || "-"}</span>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="mt-4 pt-4 border-t-2 border-dashed">
                      <h4 className="font-bold uppercase text-sm text-muted-foreground mb-3">รายละเอียดต้นทุน</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>ค่าช่าง</span>
                          <span>฿{comparisonData.inHouse.costs?.carpenter?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ค่าทาสี</span>
                          <span>฿{comparisonData.inHouse.costs?.painting?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ค่าแพ็ค</span>
                          <span>฿{comparisonData.inHouse.costs?.packing?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ค่าเสียหาย</span>
                          <span>฿{comparisonData.inHouse.costs?.waste?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>ยังไม่มีข้อมูล In-House สำหรับ SKU นี้</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommendation */}
          {comparisonData.outsource && comparisonData.inHouse && (
            <Card className="neo-card bg-gradient-to-r from-green-100 to-emerald-100 border-green-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-500 border-2 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_#000000]">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold uppercase">คำแนะนำ</h3>
                    <p className="text-muted-foreground mt-1">
                      {marginDiff > 5 
                        ? `In-House ให้ Margin ดีกว่า ${marginDiff.toFixed(1)}% แนะนำให้ผลิตเองถ้ามีกำลังการผลิตเพียงพอ`
                        : marginDiff < -5
                        ? `Outsource ให้ Margin ดีกว่า ${Math.abs(marginDiff).toFixed(1)}% แนะนำให้จ้างช่างนอก`
                        : `Margin ใกล้เคียงกัน (ต่างกัน ${Math.abs(marginDiff).toFixed(1)}%) เลือกตามความสะดวกและกำลังการผลิต`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Empty State */}
      {!selectedSku && (
        <Card className="neo-card bg-gray-50 border-dashed">
          <CardContent className="p-12 text-center">
            <GitCompare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading text-xl font-bold text-gray-500 mb-2">เลือก SKU เพื่อเริ่มเปรียบเทียบ</h3>
            <p className="text-muted-foreground">
              เลือก SKU จากรายการด้านบนเพื่อดูการเปรียบเทียบระหว่าง Outsource และ In-House
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
