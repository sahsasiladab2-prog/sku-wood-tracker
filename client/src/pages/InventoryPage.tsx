import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { woodData } from "@/lib/woodData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus, Package, Search, Trash2, Edit3,
  AlertTriangle, ArrowDown, ArrowUp, RotateCcw,
  Warehouse, TrendingDown, ShoppingCart,
} from "lucide-react";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [transactionItem, setTransactionItem] = useState<any>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    materialCode: "",
    materialName: "",
    currentStock: 0,
    unit: "ซม.",
    minStock: 10,
    costPerUnit: 0,
  });

  // Transaction form state
  const [txForm, setTxForm] = useState({
    type: "in" as "in" | "out" | "adjustment",
    quantity: 0,
    note: "",
  });

  const { data: items = [], isLoading, refetch } = trpc.inventory.list.useQuery();

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => { refetch(); setIsCreateOpen(false); resetForm(); toast.success("เพิ่มวัตถุดิบสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  const updateMutation = trpc.inventory.update.useMutation({
    onSuccess: () => { refetch(); setEditingItem(null); resetForm(); toast.success("อัปเดตสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("ลบวัตถุดิบสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  const txMutation = trpc.inventory.addTransaction.useMutation({
    onSuccess: () => { refetch(); setTransactionItem(null); setTxForm({ type: "in", quantity: 0, note: "" }); toast.success("บันทึกรายการสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  function resetForm() {
    setFormData({ materialCode: "", materialName: "", currentStock: 0, unit: "ซม.", minStock: 10, costPerUnit: 0 });
  }

  function handleCreate() {
    if (!formData.materialName) { toast.error("กรุณากรอกชื่อวัตถุดิบ"); return; }
    createMutation.mutate(formData);
  }

  function handleUpdate() {
    if (!editingItem) return;
    updateMutation.mutate({ id: editingItem.id, data: formData });
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setFormData({
      materialCode: item.materialCode,
      materialName: item.materialName,
      currentStock: item.currentStock,
      unit: item.unit,
      minStock: item.minStock,
      costPerUnit: item.costPerUnit,
    });
  }

  function handleTransaction() {
    if (!transactionItem || txForm.quantity <= 0) { toast.error("กรุณากรอกจำนวนที่ถูกต้อง"); return; }
    txMutation.mutate({
      inventoryId: transactionItem.id,
      type: txForm.type,
      quantity: txForm.quantity,
      note: txForm.note || null,
    });
  }

  function selectWoodPreset(code: string) {
    const wood = woodData.find(w => w.code === code);
    if (wood) {
      setFormData(f => ({
        ...f,
        materialCode: wood.code,
        materialName: wood.description,
        unit: wood.unit,
        costPerUnit: wood.cost,
      }));
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const matchSearch = !searchTerm ||
        item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materialCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLowStock = !showLowStockOnly || item.currentStock <= item.minStock;
      return matchSearch && matchLowStock;
    });
  }, [items, searchTerm, showLowStockOnly]);

  // Stats
  const stats = useMemo(() => {
    const totalItems = items.length;
    const lowStock = items.filter((i: any) => i.currentStock <= i.minStock && i.minStock > 0).length;
    const totalValue = items.reduce((s: number, i: any) => s + (i.currentStock * i.costPerUnit), 0);
    const outOfStock = items.filter((i: any) => i.currentStock <= 0).length;
    return { totalItems, lowStock, totalValue, outOfStock };
  }, [items]);

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-4">
      {!isEdit && (
        <div>
          <Label className="font-bold">เลือกจากรายการไม้</Label>
          <Select onValueChange={selectWoodPreset}>
            <SelectTrigger className="border-2 border-black"><SelectValue placeholder="เลือกไม้จากรายการ (85 รายการ)..." /></SelectTrigger>
            <SelectContent className="max-h-60">
              {woodData.map(w => (
                <SelectItem key={w.code} value={w.code}>{w.description} - ฿{w.cost}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">หรือกรอกข้อมูลเองด้านล่าง</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-bold">รหัสวัตถุดิบ</Label>
          <Input className="border-2 border-black" value={formData.materialCode} onChange={e => setFormData(f => ({ ...f, materialCode: e.target.value }))} placeholder="WD-001" />
        </div>
        <div>
          <Label className="font-bold">หน่วย</Label>
          <Input className="border-2 border-black" value={formData.unit} onChange={e => setFormData(f => ({ ...f, unit: e.target.value }))} placeholder="ซม." />
        </div>
      </div>
      <div>
        <Label className="font-bold">ชื่อ/รายละเอียด</Label>
        <Input className="border-2 border-black" value={formData.materialName} onChange={e => setFormData(f => ({ ...f, materialName: e.target.value }))} placeholder="4 x 1.7ซม.x 100" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="font-bold">สต็อกปัจจุบัน</Label>
          <Input type="number" min={0} className="border-2 border-black" value={formData.currentStock} onChange={e => setFormData(f => ({ ...f, currentStock: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div>
          <Label className="font-bold">สต็อกขั้นต่ำ</Label>
          <Input type="number" min={0} className="border-2 border-black" value={formData.minStock} onChange={e => setFormData(f => ({ ...f, minStock: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div>
          <Label className="font-bold">ราคา/หน่วย</Label>
          <Input type="number" min={0} className="border-2 border-black" value={formData.costPerUnit} onChange={e => setFormData(f => ({ ...f, costPerUnit: parseFloat(e.target.value) || 0 }))} />
        </div>
      </div>
      <Button className="w-full neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 text-lg font-bold" onClick={isEdit ? handleUpdate : handleCreate} disabled={createMutation.isPending || updateMutation.isPending}>
        {isEdit ? "บันทึกการแก้ไข" : "เพิ่มวัตถุดิบ"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black">
            จัดการสต็อกวัตถุดิบ
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            ติดตามวัตถุดิบ สต็อกคงเหลือ และแจ้งเตือนสต็อกต่ำ
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 px-6 text-lg">
              <Plus className="w-5 h-5 mr-2" /> เพิ่มวัตถุดิบ
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_#000000] max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-xl uppercase">เพิ่มวัตถุดิบใหม่</DialogTitle></DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neo-card bg-white">
          <CardContent className="p-4 text-center">
            <Warehouse className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <div className="font-heading text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">รายการทั้งหมด</p>
          </CardContent>
        </Card>
        <Card className={cn("neo-card", stats.lowStock > 0 ? "bg-orange-50 border-orange-400" : "bg-white")}>
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-6 h-6 mx-auto mb-1 text-orange-600" />
            <div className={cn("font-heading text-2xl font-bold", stats.lowStock > 0 && "text-orange-600")}>{stats.lowStock}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">สต็อกต่ำ</p>
          </CardContent>
        </Card>
        <Card className={cn("neo-card", stats.outOfStock > 0 ? "bg-red-50 border-red-400" : "bg-white")}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-600" />
            <div className={cn("font-heading text-2xl font-bold", stats.outOfStock > 0 && "text-red-600")}>{stats.outOfStock}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">หมดสต็อก</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-green-50">
          <CardContent className="p-4 text-center">
            <ShoppingCart className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <div className="font-heading text-2xl font-bold">฿{stats.totalValue.toLocaleString()}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">มูลค่ารวม</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10 border-2 border-black h-11" placeholder="ค้นหาวัตถุดิบ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button
          variant={showLowStockOnly ? "default" : "outline"}
          className={cn("border-2 border-black h-11", showLowStockOnly && "bg-orange-500 hover:bg-orange-600 text-white")}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          สต็อกต่ำ ({stats.lowStock})
        </Button>
      </div>

      {/* Inventory List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
      ) : filteredItems.length === 0 ? (
        <Card className="neo-card bg-white">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading text-xl font-bold mb-2">ยังไม่มีวัตถุดิบ</h3>
            <p className="text-muted-foreground">คลิก "เพิ่มวัตถุดิบ" หรือเลือกจากรายการไม้ 85 รายการ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item: any) => {
            const isLow = item.minStock > 0 && item.currentStock <= item.minStock;
            const isOut = item.currentStock <= 0;

            return (
              <Card key={item.id} className={cn("neo-card bg-white", isOut && "border-red-400", isLow && !isOut && "border-orange-400")}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{item.materialName}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{item.materialCode}</p>
                    </div>
                    <div className="flex gap-1">
                      {isOut && <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]">หมดสต็อก</Badge>}
                      {isLow && !isOut && <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[10px]">สต็อกต่ำ</Badge>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-gray-50 p-2 rounded border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">คงเหลือ</p>
                      <p className={cn("font-bold text-lg", isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-green-600")}>
                        {item.currentStock} <span className="text-xs font-normal">{item.unit}</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">ขั้นต่ำ</p>
                      <p className="font-bold text-lg">{item.minStock} <span className="text-xs font-normal">{item.unit}</span></p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-3">
                    ราคา: ฿{item.costPerUnit.toLocaleString()}/{item.unit} | มูลค่า: ฿{(item.currentStock * item.costPerUnit).toLocaleString()}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-600 text-white hover:bg-green-700 text-xs" onClick={() => { setTransactionItem(item); setTxForm({ type: "in", quantity: 0, note: "" }); }}>
                      <ArrowDown className="w-3 h-3 mr-1" /> รับเข้า
                    </Button>
                    <Button size="sm" className="flex-1 bg-orange-600 text-white hover:bg-orange-700 text-xs" onClick={() => { setTransactionItem(item); setTxForm({ type: "out", quantity: 0, note: "" }); }}>
                      <ArrowUp className="w-3 h-3 mr-1" /> เบิกออก
                    </Button>
                    <Button size="sm" variant="outline" className="border-2 border-black" onClick={() => openEdit(item)}>
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-2 border-red-300 text-red-600 hover:bg-red-50" onClick={() => { if (confirm("ต้องการลบวัตถุดิบนี้?")) deleteMutation.mutate({ id: item.id }); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={v => { if (!v) { setEditingItem(null); resetForm(); } }}>
        <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_#000000] max-w-lg">
          <DialogHeader><DialogTitle className="font-heading text-xl uppercase">แก้ไขวัตถุดิบ</DialogTitle></DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={!!transactionItem} onOpenChange={v => { if (!v) { setTransactionItem(null); setTxForm({ type: "in", quantity: 0, note: "" }); } }}>
        <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_#000000] max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase">
              {txForm.type === "in" ? "รับเข้าสต็อก" : txForm.type === "out" ? "เบิกออกจากสต็อก" : "ปรับสต็อก"}
            </DialogTitle>
          </DialogHeader>
          {transactionItem && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 border-2 border-black rounded">
                <p className="font-bold">{transactionItem.materialName}</p>
                <p className="text-sm text-muted-foreground">สต็อกปัจจุบัน: {transactionItem.currentStock} {transactionItem.unit}</p>
              </div>
              <div>
                <Label className="font-bold">ประเภท</Label>
                <Select value={txForm.type} onValueChange={(v: any) => setTxForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">รับเข้า (เพิ่มสต็อก)</SelectItem>
                    <SelectItem value="out">เบิกออก (ลดสต็อก)</SelectItem>
                    <SelectItem value="adjustment">ปรับยอด (ตั้งค่าใหม่)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-bold">จำนวน</Label>
                <Input type="number" min={0} className="border-2 border-black" value={txForm.quantity} onChange={e => setTxForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="font-bold">หมายเหตุ</Label>
                <Textarea className="border-2 border-black" value={txForm.note} onChange={e => setTxForm(f => ({ ...f, note: e.target.value }))} placeholder="เช่น ซื้อจากร้าน xxx..." />
              </div>
              <Button className="w-full neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 text-lg font-bold" onClick={handleTransaction} disabled={txMutation.isPending}>
                {txForm.type === "in" ? "รับเข้า" : txForm.type === "out" ? "เบิกออก" : "ปรับยอด"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
