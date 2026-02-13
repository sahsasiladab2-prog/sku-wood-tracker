import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjects } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  Factory, Package, Users, ClipboardList, Warehouse,
  TrendingUp, AlertTriangle, ArrowRight, CheckCircle2,
  Clock, Play, DollarSign, Hammer, Paintbrush, PackageCheck,
  BarChart3,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function FactoryDashboard() {
  const { projects } = useProjects();
  const { data: orders = [] } = trpc.production.list.useQuery();
  const { data: inventoryItems = [] } = trpc.inventory.list.useQuery();
  const { data: workersList = [] } = trpc.worker.list.useQuery();

  // Production stats
  const productionStats = useMemo(() => {
    const pending = orders.filter((o: any) => o.status === "pending").length;
    const inProgress = orders.filter((o: any) => o.status === "in_progress").length;
    const completed = orders.filter((o: any) => o.status === "completed").length;
    const overdue = orders.filter((o: any) =>
      o.deadline && new Date(o.deadline) < new Date() && o.status !== "completed" && o.status !== "cancelled"
    ).length;
    const totalQty = orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + o.quantity, 0);
    const completedQty = orders.reduce((s: number, o: any) => s + (o.completedQty || 0), 0);
    return { pending, inProgress, completed, overdue, totalQty, completedQty };
  }, [orders]);

  // Inventory stats
  const inventoryStats = useMemo(() => {
    const total = inventoryItems.length;
    const lowStock = inventoryItems.filter((i: any) => i.minStock > 0 && i.currentStock <= i.minStock).length;
    const outOfStock = inventoryItems.filter((i: any) => i.currentStock <= 0).length;
    const totalValue = inventoryItems.reduce((s: number, i: any) => s + (i.currentStock * i.costPerUnit), 0);
    return { total, lowStock, outOfStock, totalValue };
  }, [inventoryItems]);

  // Worker stats
  const workerStats = useMemo(() => {
    const active = workersList.filter((w: any) => w.status === "active").length;
    const totalWage = workersList.filter((w: any) => w.status === "active").reduce((s: number, w: any) => s + w.dailyWage, 0);
    const byRole: Record<string, number> = {};
    workersList.filter((w: any) => w.status === "active").forEach((w: any) => {
      byRole[w.role] = (byRole[w.role] || 0) + 1;
    });
    return { active, total: workersList.length, totalWage, byRole };
  }, [workersList]);

  // SKU stats
  const skuStats = useMemo(() => {
    const totalSkus = projects.length;
    const avgCost = totalSkus > 0 ? projects.reduce((s, p) => s + p.totalCost, 0) / totalSkus : 0;
    return { totalSkus, avgCost };
  }, [projects]);

  // Production status chart data
  const productionChartData = [
    { name: "รอดำเนินการ", value: productionStats.pending, color: "#EAB308" },
    { name: "กำลังผลิต", value: productionStats.inProgress, color: "#3B82F6" },
    { name: "เสร็จสิ้น", value: productionStats.completed, color: "#22C55E" },
  ].filter(d => d.value > 0);

  // Worker role chart data
  const roleLabels: Record<string, string> = {
    carpenter: "ช่างไม้",
    painter: "ช่างทาสี",
    packer: "ช่างแพ็ค",
    supervisor: "หัวหน้า",
    general: "ทั่วไป",
  };
  const workerChartData = Object.entries(workerStats.byRole).map(([role, count]) => ({
    name: roleLabels[role] || role,
    count,
  }));

  // Recent orders
  const recentOrders = orders.slice(0, 5);

  // Low stock alerts
  const lowStockItems = inventoryItems.filter((i: any) => i.minStock > 0 && i.currentStock <= i.minStock).slice(0, 5);

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
          แดชบอร์ดโรงงาน
        </h1>
        <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">
          ภาพรวมทั้งหมดของโรงงานเฟอร์นิเจอร์ - การผลิต, สต็อก, พนักงาน
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neo-card bg-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-bold mt-1">{productionStats.inProgress + productionStats.pending}</h3>
            <p className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-muted-foreground">งานที่ต้องทำ</p>
          </CardContent>
        </Card>

        <Card className={cn("neo-card", inventoryStats.lowStock > 0 ? "bg-orange-50" : "bg-white")}>
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className={cn("w-10 h-10 md:w-12 md:h-12 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]", inventoryStats.lowStock > 0 ? "bg-orange-500" : "bg-green-500")}>
              <Warehouse className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h3 className={cn("font-heading text-2xl md:text-3xl font-bold mt-1", inventoryStats.lowStock > 0 && "text-orange-600")}>{inventoryStats.lowStock}</h3>
            <p className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-muted-foreground">สต็อกต่ำ</p>
          </CardContent>
        </Card>

        <Card className="neo-card bg-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-bold mt-1">{workerStats.active}</h3>
            <p className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-muted-foreground">พนักงาน</p>
          </CardContent>
        </Card>

        <Card className="neo-card bg-white">
          <CardContent className="p-4 md:p-6 flex flex-col items-center text-center gap-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-bold mt-1">{skuStats.totalSkus}</h3>
            <p className="font-bold uppercase text-[10px] md:text-xs tracking-widest text-muted-foreground">สินค้า SKU</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue & Alerts */}
      {(productionStats.overdue > 0 || inventoryStats.outOfStock > 0) && (
        <Card className="neo-card bg-red-50 border-red-400">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div className="flex flex-wrap gap-4 text-sm font-bold">
                {productionStats.overdue > 0 && (
                  <span className="text-red-700">ใบสั่งผลิตเลยกำหนด: {productionStats.overdue} รายการ</span>
                )}
                {inventoryStats.outOfStock > 0 && (
                  <span className="text-red-700">วัตถุดิบหมดสต็อก: {inventoryStats.outOfStock} รายการ</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Overview */}
        <Card className="neo-card bg-white lg:col-span-2">
          <CardHeader className="border-b-2 border-black bg-blue-500 text-white py-3">
            <CardTitle className="font-heading text-lg uppercase flex items-center justify-between">
              <span className="flex items-center gap-2"><Factory className="w-5 h-5" /> สถานะการผลิต</span>
              <Link href="/production">
                <Button size="sm" variant="secondary" className="text-xs border border-white/30">
                  ดูทั้งหมด <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Production Progress */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                <div className="font-heading text-xl font-bold">{productionStats.pending}</div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">รอ</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <Play className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <div className="font-heading text-xl font-bold">{productionStats.inProgress}</div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">กำลังผลิต</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
                <div className="font-heading text-xl font-bold">{productionStats.completed}</div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground">เสร็จ</p>
              </div>
            </div>

            {/* Total production */}
            <div className="p-3 bg-gray-50 rounded-lg border mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold">ผลิตรวม</span>
                <span className="text-sm font-bold">{productionStats.completedQty}/{productionStats.totalQty} ชิ้น</span>
              </div>
              <div className="h-4 bg-gray-200 border border-black rounded-sm overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${productionStats.totalQty > 0 ? (productionStats.completedQty / productionStats.totalQty) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Recent orders */}
            {recentOrders.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">ใบสั่งผลิตล่าสุด</h4>
                <div className="space-y-2">
                  {recentOrders.map((order: any) => {
                    const proj = projects.find(p => p.id === order.projectId);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{order.orderNumber}</span>
                          <span className="text-muted-foreground">{proj?.name || order.projectId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{order.completedQty}/{order.quantity}</span>
                          <Badge className={cn("text-[9px]",
                            order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            order.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                            order.status === "completed" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-700"
                          )}>
                            {order.status === "pending" ? "รอ" : order.status === "in_progress" ? "ผลิต" : order.status === "completed" ? "เสร็จ" : "ยกเลิก"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {recentOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Factory className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">ยังไม่มีใบสั่งผลิต</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <Card className={cn("neo-card", lowStockItems.length > 0 ? "bg-orange-50 border-orange-400" : "bg-white")}>
            <CardHeader className="border-b-2 border-black py-3">
              <CardTitle className="font-heading text-lg uppercase flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className={cn("w-5 h-5", lowStockItems.length > 0 ? "text-orange-600" : "text-gray-400")} />
                  แจ้งเตือนสต็อก
                </span>
                <Link href="/inventory">
                  <Button size="sm" variant="outline" className="text-xs border-2 border-black">ดู</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {lowStockItems.length > 0 ? (
                <div className="space-y-2">
                  {lowStockItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border text-sm">
                      <span className="font-medium truncate flex-1">{item.materialName}</span>
                      <span className={cn("font-bold ml-2", item.currentStock <= 0 ? "text-red-600" : "text-orange-600")}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm">สต็อกทุกรายการอยู่ในระดับปกติ</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Worker Summary */}
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black py-3">
              <CardTitle className="font-heading text-lg uppercase flex items-center justify-between">
                <span className="flex items-center gap-2"><Users className="w-5 h-5" /> พนักงาน</span>
                <Link href="/workers">
                  <Button size="sm" variant="outline" className="text-xs border-2 border-black">ดู</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <div className="font-heading text-3xl font-bold">{workerStats.active}<span className="text-lg text-muted-foreground">/{workerStats.total}</span></div>
                <p className="text-xs text-muted-foreground font-bold uppercase">พนักงานที่ทำงาน</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center mb-3">
                <DollarSign className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <div className="font-bold text-lg">฿{workerStats.totalWage.toLocaleString()}</div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">ค่าแรงรวม/วัน</p>
              </div>

              {workerChartData.length > 0 ? (
                <div className="h-[150px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workerChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={10} />
                      <YAxis dataKey="name" type="category" fontSize={10} width={60} />
                      <Tooltip contentStyle={{ border: '2px solid black', borderRadius: '0px' }} />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">ยังไม่มีข้อมูลพนักงาน</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="neo-card bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="font-heading text-2xl font-bold text-green-600">฿{inventoryStats.totalValue.toLocaleString()}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground mt-1">มูลค่าสต็อกวัตถุดิบ</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6 text-center">
            <Hammer className="w-8 h-8 mx-auto mb-2 text-amber-600" />
            <div className="font-heading text-2xl font-bold text-amber-600">฿{(workerStats.totalWage * 26).toLocaleString()}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground mt-1">ค่าแรงโดยประมาณ/เดือน</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="font-heading text-2xl font-bold text-blue-600">฿{Math.round(skuStats.avgCost).toLocaleString()}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground mt-1">ต้นทุนเฉลี่ย/SKU</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/production">
          <Card className="neo-card bg-blue-500 text-white cursor-pointer hover:translate-y-[-2px] transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardList className="w-8 h-8" />
              <div>
                <p className="font-bold text-sm">สร้างใบสั่งผลิต</p>
                <p className="text-[10px] text-blue-100">จัดการการผลิต</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/inventory">
          <Card className="neo-card bg-green-600 text-white cursor-pointer hover:translate-y-[-2px] transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <Warehouse className="w-8 h-8" />
              <div>
                <p className="font-bold text-sm">จัดการสต็อก</p>
                <p className="text-[10px] text-green-100">รับเข้า-เบิกออก</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/calculator">
          <Card className="neo-card bg-amber-500 text-white cursor-pointer hover:translate-y-[-2px] transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="w-8 h-8" />
              <div>
                <p className="font-bold text-sm">คำนวณต้นทุน</p>
                <p className="text-[10px] text-amber-100">สร้าง SKU ใหม่</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/workers">
          <Card className="neo-card bg-purple-600 text-white cursor-pointer hover:translate-y-[-2px] transition-all">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8" />
              <div>
                <p className="font-bold text-sm">จัดการพนักงาน</p>
                <p className="text-[10px] text-purple-100">เพิ่ม-แก้ไข</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
