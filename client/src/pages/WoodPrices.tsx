import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { woodData } from "@/lib/woodData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Layers,
  Search,
  Edit2,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Plus,
  Save,
  X,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Tag,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function WoodPrices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editMarketPrice, setEditMarketPrice] = useState<string>("");
  const [editNote, setEditNote] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ code: "", description: "", unit: "ซม.", refQty: 100, cost: "", marketPrice: "" });
  const [isSeedingAll, setIsSeedingAll] = useState(false);

  const utils = trpc.useUtils();

  // Fetch all wood materials from DB
  const { data: dbMaterials = [], isLoading, refetch } = trpc.wood.getAll.useQuery();

  // Fetch all price history
  const { data: priceHistory = [], isLoading: historyLoading } = trpc.wood.getPriceHistory.useQuery({ code: undefined });

  // Mutations
  const updatePriceMutation = trpc.wood.updatePrice.useMutation({
    onSuccess: () => {
      utils.wood.getAll.invalidate();
      utils.wood.getPriceHistory.invalidate();
      toast.success("อัปเดตราคาสำเร็จ!", { description: "ราคาใหม่จะใช้กับโปรเจกต์ใหม่เท่านั้น" });
      setEditingCode(null);
      setEditPrice("");
      setEditMarketPrice("");
      setEditNote("");
    },
    onError: (err) => {
      toast.error("เกิดข้อผิดพลาด", { description: err.message });
    },
  });

  const upsertMutation = trpc.wood.upsert.useMutation({
    onSuccess: () => {
      utils.wood.getAll.invalidate();
      utils.wood.getPriceHistory.invalidate();
      toast.success("บันทึกรายการสำเร็จ!");
      setAddDialogOpen(false);
      setNewItem({ code: "", description: "", unit: "ซม.", refQty: 100, cost: "", marketPrice: "" });
    },
    onError: (err) => {
      toast.error("เกิดข้อผิดพลาด", { description: err.message });
    },
  });

  const seedMutation = trpc.wood.seed.useMutation({
    onSuccess: (data) => {
      utils.wood.getAll.invalidate();
      utils.wood.getPriceHistory.invalidate();
      toast.success(`Seed สำเร็จ! เพิ่ม ${data.seeded} รายการ`);
      setIsSeedingAll(false);
    },
    onError: (err) => {
      toast.error("Seed ล้มเหลว", { description: err.message });
      setIsSeedingAll(false);
    },
  });

  // Build a map of DB materials by code for quick lookup
  const dbMap = useMemo(() => {
    const map = new Map<string, typeof dbMaterials[0]>();
    dbMaterials.forEach((m) => map.set(m.code, m));
    return map;
  }, [dbMaterials]);

  // Merge woodData with DB data - DB takes priority for price
  const mergedMaterials = useMemo(() => {
    const allCodes = new Set([
      ...woodData.map((w) => w.code),
      ...dbMaterials.map((m) => m.code),
    ]);

    return Array.from(allCodes).map((code) => {
      const local = woodData.find((w) => w.code === code);
      const db = dbMap.get(code);
      return {
        code,
        description: db?.description || local?.description || code,
        unit: db?.unit || local?.unit || "ซม.",
        refQty: db?.refQty || local?.refQty || 100,
        dbCost: db ? db.cost : null,
        marketPrice: db?.marketPrice ?? null,
        currentCost: db ? db.cost : (local?.cost ?? 0),
        inDb: !!db,
        updatedAt: db?.updatedAt ?? null,
      };
    }).sort((a, b) => a.code.localeCompare(b.code));
  }, [dbMaterials, dbMap]);

  // Filter by search
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return mergedMaterials;
    const q = searchQuery.toLowerCase();
    return mergedMaterials.filter(
      (m) =>
        m.code.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [mergedMaterials, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const inDb = mergedMaterials.filter((m) => m.inDb).length;
    const notInDb = mergedMaterials.filter((m) => !m.inDb).length;
    const withMarket = mergedMaterials.filter((m) => m.marketPrice !== null).length;
    const savings = mergedMaterials.reduce((sum, m) => {
      if (m.marketPrice !== null && m.dbCost !== null) {
        const diff = m.marketPrice - m.dbCost;
        if (diff > 0) return sum + diff;
      }
      return sum;
    }, 0);
    return { total: mergedMaterials.length, inDb, notInDb, withMarket, savings };
  }, [mergedMaterials]);

  const handleStartEdit = (code: string, currentCost: number, currentMarketPrice: number | null) => {
    setEditingCode(code);
    setEditPrice(String(currentCost));
    setEditMarketPrice(currentMarketPrice !== null ? String(currentMarketPrice) : "");
    setEditNote("");
  };

  const handleSavePrice = (code: string) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      toast.error("กรุณาใส่ราคาที่ถูกต้อง");
      return;
    }
    const marketPriceVal = editMarketPrice.trim() !== "" ? parseFloat(editMarketPrice) : undefined;
    updatePriceMutation.mutate({
      code,
      newPrice: Math.ceil(price),
      note: editNote || undefined,
      marketPrice: marketPriceVal !== undefined && !isNaN(marketPriceVal) ? Math.ceil(marketPriceVal) : undefined,
    });
  };

  const handleSeedAll = () => {
    setIsSeedingAll(true);
    seedMutation.mutate(
      woodData.map((w) => ({
        code: w.code,
        description: w.description,
        unit: w.unit,
        refQty: w.refQty,
        cost: w.cost,
      }))
    );
  };

  const handleAddNew = () => {
    const cost = parseFloat(newItem.cost);
    if (!newItem.code || !newItem.description || isNaN(cost)) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const marketPriceVal = newItem.marketPrice.trim() !== "" ? parseFloat(newItem.marketPrice) : undefined;
    upsertMutation.mutate({
      code: newItem.code,
      description: newItem.description,
      unit: newItem.unit,
      refQty: newItem.refQty,
      cost: Math.ceil(cost),
      marketPrice: marketPriceVal !== undefined && !isNaN(marketPriceVal) ? Math.ceil(marketPriceVal) : undefined,
    });
  };

  // Badge showing savings vs market price
  const getSavingsBadge = (item: typeof mergedMaterials[0]) => {
    if (item.marketPrice === null || item.dbCost === null) return null;
    const savings = item.marketPrice - item.dbCost;
    if (savings > 0) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px] font-bold gap-1 ml-1">
          <Sparkles className="w-3 h-3" />
          ประหยัด {savings}฿
        </Badge>
      );
    }
    if (savings < 0) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-bold gap-1 ml-1">
          <TrendingUp className="w-3 h-3" />
          แพงกว่าตลาด {Math.abs(savings)}฿
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] font-bold gap-1 ml-1">
        <Minus className="w-3 h-3" />
        เท่ากัน
      </Badge>
    );
  };

  // Filter history
  const filteredHistory = useMemo(() => {
    if (!historyFilter.trim()) return priceHistory;
    const q = historyFilter.toLowerCase();
    return priceHistory.filter((h) => h.woodCode.toLowerCase().includes(q));
  }, [priceHistory, historyFilter]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)] flex items-center gap-3">
            <Layers className="w-8 h-8 text-chart-3" />
            ราคาไม้
          </h1>
          <p className="text-muted-foreground font-medium mt-1 text-sm md:text-base">
            จัดการราคาไม้ทุกชนิด — เปรียบเทียบราคาตลาดกับราคาที่คุณได้มา
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="border-2 border-black shadow-[2px_2px_0px_0px_#000000] font-bold"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          {stats.notInDb > 0 && (
            <Button
              className="neo-button bg-chart-2 text-white hover:bg-green-700 font-bold"
              onClick={handleSeedAll}
              disabled={isSeedingAll || seedMutation.isPending}
            >
              <Database className="w-4 h-4 mr-2" />
              {isSeedingAll ? "กำลัง Seed..." : `Seed ไม้ทั้งหมด (${stats.notInDb})`}
            </Button>
          )}
          <Button
            className="neo-button bg-chart-3 text-white hover:bg-blue-700 font-bold"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มรายการใหม่
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neo-card bg-white">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <div className="w-10 h-10 bg-chart-1 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Layers className="w-5 h-5 text-black" />
            </div>
            <h3 className="font-heading text-2xl font-bold">{stats.total}</h3>
            <p className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">รายการทั้งหมด</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-white">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <div className="w-10 h-10 bg-chart-2 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-green-600">{stats.inDb}</h3>
            <p className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">ใน Database</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-white">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <div className="w-10 h-10 bg-emerald-400 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-emerald-600">{stats.withMarket}</h3>
            <p className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">มีราคาตลาด</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-white">
          <CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <div className="w-10 h-10 bg-chart-4 border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-blue-600">฿{stats.savings}</h3>
            <p className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">ประหยัดรวม/100ซม.</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Price Table | History */}
      <Tabs defaultValue="prices">
        <TabsList className="border-2 border-black shadow-[2px_2px_0px_0px_#000000] bg-white">
          <TabsTrigger value="prices" className="font-bold data-[state=active]:bg-chart-3 data-[state=active]:text-white">
            <Layers className="w-4 h-4 mr-2" />
            ตารางราคาไม้
          </TabsTrigger>
          <TabsTrigger value="history" className="font-bold data-[state=active]:bg-chart-4 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-2" />
            ประวัติการเปลี่ยนราคา
          </TabsTrigger>
        </TabsList>

        {/* ===== PRICE TABLE TAB ===== */}
        <TabsContent value="prices" className="mt-4">
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-3 text-white py-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <CardTitle className="font-heading text-lg uppercase flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  ราคาไม้ทั้งหมด ({filteredMaterials.length} รายการ)
                </CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  <Input
                    placeholder="ค้นหารหัส / ชื่อไม้..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-2 border-white/50 bg-white/20 text-white placeholder:text-white/60 focus:border-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  กำลังโหลดข้อมูล...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-black bg-gray-50">
                        <TableHead className="font-bold text-black uppercase text-xs w-32">รหัสไม้</TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs text-right w-36">
                          <div className="flex items-center justify-end gap-1">
                            <Tag className="w-3 h-3 text-amber-600" />
                            <span className="text-amber-700">ราคาตลาด</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs text-right w-40">
                          <div className="flex items-center justify-end gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">ราคาที่ได้ (DB)</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs text-center w-36">ส่วนต่าง</TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs text-center w-24">สถานะ</TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs text-center w-24">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMaterials.map((item) => (
                        <TableRow
                          key={item.code}
                          className={cn(
                            "border-b border-black/10 hover:bg-yellow-50 transition-colors",
                            editingCode === item.code && "bg-blue-50"
                          )}
                        >
                          <TableCell className="font-mono font-bold text-sm text-chart-3">
                            {item.code}
                          </TableCell>

                          {/* ราคาตลาด column */}
                          <TableCell className="text-right">
                            {editingCode === item.code ? (
                              <div className="flex items-center gap-1 justify-end">
                                <span className="text-xs text-amber-600 font-bold">฿</span>
                                <Input
                                  type="number"
                                  value={editMarketPrice}
                                  onChange={(e) => setEditMarketPrice(e.target.value)}
                                  placeholder="ราคาตลาด"
                                  className="w-20 h-7 text-sm border-2 border-amber-400 text-right"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSavePrice(item.code);
                                    if (e.key === "Escape") setEditingCode(null);
                                  }}
                                />
                              </div>
                            ) : (
                              <span className="font-mono text-sm text-amber-700 font-semibold">
                                {item.marketPrice !== null ? `฿${item.marketPrice}` : (
                                  <span className="text-gray-300 text-xs italic">-</span>
                                )}
                              </span>
                            )}
                          </TableCell>

                          {/* ราคาที่ได้ (DB) column */}
                          <TableCell className="text-right">
                            {editingCode === item.code ? (
                              <div className="flex items-center gap-1 justify-end">
                                <span className="text-sm font-bold text-emerald-600">฿</span>
                                <Input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-20 h-7 text-sm border-2 border-emerald-500 text-right"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSavePrice(item.code);
                                    if (e.key === "Escape") setEditingCode(null);
                                  }}
                                />
                              </div>
                            ) : (
                              <span className={cn(
                                "font-mono font-bold text-sm",
                                item.inDb ? "text-emerald-700" : "text-muted-foreground italic"
                              )}>
                                {item.inDb ? `฿${item.dbCost}` : `฿${item.currentCost}`}
                              </span>
                            )}
                          </TableCell>

                          {/* ส่วนต่าง column */}
                          <TableCell className="text-center">
                            {getSavingsBadge(item)}
                          </TableCell>

                          {/* สถานะ column */}
                          <TableCell className="text-center">
                            {item.inDb ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                DB
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Local
                              </Badge>
                            )}
                          </TableCell>

                          {/* จัดการ column */}
                          <TableCell className="text-center">
                            {editingCode === item.code ? (
                              <div className="flex items-center gap-1 justify-center">
                                <Button
                                  size="sm"
                                  className="h-7 px-2 bg-green-500 hover:bg-green-600 text-white border-2 border-black shadow-[1px_1px_0px_0px_#000000]"
                                  onClick={() => handleSavePrice(item.code)}
                                  disabled={updatePriceMutation.isPending}
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 border-2 border-black shadow-[1px_1px_0px_0px_#000000]"
                                  onClick={() => setEditingCode(null)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 border-2 border-black shadow-[1px_1px_0px_0px_#000000] hover:bg-yellow-100"
                                onClick={() => handleStartEdit(item.code, item.currentCost, item.marketPrice)}
                                title="แก้ไขราคา"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredMaterials.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      ไม่พบรายการที่ค้นหา
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inline note + save bar when editing */}
          {editingCode && (
            <Card className="neo-card bg-blue-50 border-2 border-chart-3 mt-2">
              <CardContent className="p-3 flex flex-col md:flex-row items-center gap-3">
                <span className="text-sm font-bold text-chart-3 whitespace-nowrap">
                  แก้ไข: <code className="font-mono">{editingCode}</code>
                </span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                  <Tag className="w-4 h-4 text-amber-500" />
                  ราคาตลาด: ฿{editMarketPrice || "—"}
                  <span className="mx-1">→</span>
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  ราคาที่ได้: ฿{editPrice || "—"}
                  {editMarketPrice && editPrice && !isNaN(parseFloat(editMarketPrice)) && !isNaN(parseFloat(editPrice)) && (
                    <Badge className={cn(
                      "text-[10px] font-bold ml-1",
                      parseFloat(editMarketPrice) - parseFloat(editPrice) > 0
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-red-100 text-red-700 border-red-200"
                    )}>
                      {parseFloat(editMarketPrice) - parseFloat(editPrice) > 0
                        ? `ประหยัด ${Math.ceil(parseFloat(editMarketPrice) - parseFloat(editPrice))}฿`
                        : `แพงกว่า ${Math.abs(Math.ceil(parseFloat(editMarketPrice) - parseFloat(editPrice)))}฿`}
                    </Badge>
                  )}
                </div>
                <Input
                  placeholder="หมายเหตุ เช่น ต่อราคาลุงบาน 2026/04"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="flex-1 border-2 border-chart-3 text-sm h-8"
                />
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_#000000] font-bold whitespace-nowrap"
                  onClick={() => handleSavePrice(editingCode)}
                  disabled={updatePriceMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  บันทึก
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-2 border-black shadow-[2px_2px_0px_0px_#000000]"
                  onClick={() => setEditingCode(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== HISTORY TAB ===== */}
        <TabsContent value="history" className="mt-4">
          <Card className="neo-card bg-white">
            <CardHeader className="border-b-2 border-black bg-chart-4 text-white py-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <CardTitle className="font-heading text-lg uppercase flex items-center gap-2">
                  <History className="w-5 h-5" />
                  ประวัติการเปลี่ยนแปลงราคา ({filteredHistory.length} รายการ)
                </CardTitle>
                <div className="relative w-full md:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                  <Input
                    placeholder="กรองตามรหัสไม้..."
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="pl-9 border-2 border-white/50 bg-white/20 text-white placeholder:text-white/60 focus:border-white text-sm h-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  กำลังโหลดประวัติ...
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>ยังไม่มีประวัติการเปลี่ยนแปลงราคา</p>
                  <p className="text-xs mt-1">ลอง Seed ข้อมูลก่อน หรือแก้ไขราคาไม้เพื่อสร้างประวัติ</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b-2 border-black bg-gray-50">
                        <TableHead className="font-bold text-black uppercase text-xs w-32">รหัสไม้</TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs text-right w-32">ราคาเดิม</TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs text-right w-32">ราคาใหม่</TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs text-center w-28">การเปลี่ยน</TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs">หมายเหตุ</TableHead>
                        <TableHead className="font-bold text-black uppercase text-xs w-48">วันที่เปลี่ยน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((h) => {
                        const diff = h.oldPrice !== null ? h.newPrice - h.oldPrice : null;
                        return (
                          <TableRow key={h.id} className="border-b border-black/10 hover:bg-blue-50 transition-colors">
                            <TableCell className="font-mono font-bold text-sm text-chart-3">
                              {h.woodCode}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground">
                              {h.oldPrice !== null ? `฿${h.oldPrice}` : (
                                <span className="italic text-xs">ราคาเริ่มต้น</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-sm">
                              ฿{h.newPrice}
                            </TableCell>
                            <TableCell className="text-center">
                              {diff === null ? (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold gap-1">
                                  <Plus className="w-3 h-3" />
                                  ใหม่
                                </Badge>
                              ) : diff > 0 ? (
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] font-bold gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  +{diff}
                                </Badge>
                              ) : diff < 0 ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-bold gap-1">
                                  <TrendingDown className="w-3 h-3" />
                                  {diff}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] font-bold gap-1">
                                  <Minus className="w-3 h-3" />
                                  ไม่เปลี่ยน
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {h.note || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(h.changedAt).toLocaleString("th-TH", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add New Material Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="border-2 border-black shadow-[4px_4px_0px_0px_#000000] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase flex items-center gap-2">
              <Plus className="w-5 h-5 text-chart-3" />
              เพิ่มรายการไม้ใหม่
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">รหัสไม้ *</label>
              <Input
                placeholder="เช่น 4s6200"
                value={newItem.code}
                onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                className="border-2 border-black"
              />
            </div>
            <div>
              <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">คำอธิบาย *</label>
              <Input
                placeholder="เช่น 4 x 6สลึง x 200"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="border-2 border-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">หน่วย</label>
                <Input
                  placeholder="ซม."
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="border-2 border-black"
                />
              </div>
              <div>
                <label className="text-sm font-bold uppercase text-muted-foreground mb-1 block">ปริมาณอ้างอิง</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={newItem.refQty}
                  onChange={(e) => setNewItem({ ...newItem, refQty: parseInt(e.target.value) || 100 })}
                  className="border-2 border-black"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold uppercase text-amber-700 mb-1 block flex items-center gap-1">
                  <Tag className="w-3 h-3" /> ราคาตลาด (บาท)
                </label>
                <Input
                  type="number"
                  placeholder="เช่น 25"
                  value={newItem.marketPrice}
                  onChange={(e) => setNewItem({ ...newItem, marketPrice: e.target.value })}
                  className="border-2 border-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-bold uppercase text-emerald-700 mb-1 block flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ราคาที่ได้ (บาท) *
                </label>
                <Input
                  type="number"
                  placeholder="เช่น 23"
                  value={newItem.cost}
                  onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                  className="border-2 border-emerald-500"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-2 border-black"
              onClick={() => setAddDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button
              className="neo-button bg-chart-3 text-white hover:bg-blue-700 font-bold"
              onClick={handleAddNew}
              disabled={upsertMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
