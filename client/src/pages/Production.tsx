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
import { useProjects } from "@/contexts/ProjectContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus, ClipboardList, Clock, CheckCircle2, XCircle,
  AlertTriangle, ArrowUpDown, Search, Trash2, Edit3,
  Factory, Play, Pause, ChevronRight,
} from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  in_progress: { label: "กำลังผลิต", color: "bg-blue-100 text-blue-800 border-blue-300", icon: Play },
  completed: { label: "เสร็จสิ้น", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle2 },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
};

const PRIORITY_CONFIG = {
  low: { label: "ต่ำ", color: "bg-gray-100 text-gray-700 border-gray-300" },
  normal: { label: "ปกติ", color: "bg-blue-50 text-blue-700 border-blue-200" },
  high: { label: "สูง", color: "bg-orange-100 text-orange-700 border-orange-300" },
  urgent: { label: "เร่งด่วน", color: "bg-red-100 text-red-700 border-red-300" },
};

export default function Production() {
  const { projects } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    projectId: "",
    orderNumber: "",
    quantity: 1,
    status: "pending" as "pending" | "in_progress" | "completed" | "cancelled",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    deadline: "",
    notes: "",
  });

  const { data: orders = [], isLoading, refetch } = trpc.production.list.useQuery();
  const { data: workersList = [] } = trpc.worker.list.useQuery();

  const createMutation = trpc.production.create.useMutation({
    onSuccess: () => { refetch(); setIsCreateOpen(false); resetForm(); toast.success("สร้างใบสั่งผลิตสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  const updateMutation = trpc.production.update.useMutation({
    onSuccess: () => { refetch(); setEditingOrder(null); resetForm(); toast.success("อัปเดตสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  const deleteMutation = trpc.production.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("ลบใบสั่งผลิตสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  function resetForm() {
    setFormData({ projectId: "", orderNumber: "", quantity: 1, status: "pending", priority: "normal", deadline: "", notes: "" });
  }

  function handleCreate() {
    if (!formData.projectId || !formData.orderNumber) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    createMutation.mutate({
      projectId: formData.projectId,
      orderNumber: formData.orderNumber,
      quantity: formData.quantity,
      status: formData.status,
      priority: formData.priority,
      deadline: formData.deadline || null,
      notes: formData.notes || null,
    });
  }

  function handleUpdate() {
    if (!editingOrder) return;
    updateMutation.mutate({
      id: editingOrder.id,
      data: {
        projectId: formData.projectId || undefined,
        orderNumber: formData.orderNumber || undefined,
        quantity: formData.quantity,
        completedQty: editingOrder.completedQty,
        status: formData.status,
        priority: formData.priority,
        deadline: formData.deadline || null,
        notes: formData.notes || null,
      },
    });
  }

  function openEdit(order: any) {
    setEditingOrder(order);
    setFormData({
      projectId: order.projectId,
      orderNumber: order.orderNumber,
      quantity: order.quantity,
      status: order.status,
      priority: order.priority,
      deadline: order.deadline ? new Date(order.deadline).toISOString().split("T")[0] : "",
      notes: order.notes || "",
    });
  }

  function handleQuickStatusUpdate(orderId: number, newStatus: string, completedQty?: number) {
    const data: any = { status: newStatus };
    if (completedQty !== undefined) data.completedQty = completedQty;
    updateMutation.mutate({ id: orderId, data });
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const matchSearch = !searchTerm ||
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.projectId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const pending = orders.filter((o: any) => o.status === "pending").length;
    const inProgress = orders.filter((o: any) => o.status === "in_progress").length;
    const completed = orders.filter((o: any) => o.status === "completed").length;
    const totalQty = orders.filter((o: any) => o.status !== "cancelled").reduce((s: number, o: any) => s + o.quantity, 0);
    const completedQty = orders.reduce((s: number, o: any) => s + (o.completedQty || 0), 0);
    return { pending, inProgress, completed, totalQty, completedQty };
  }, [orders]);

  const getProjectName = (projectId: string) => {
    const p = projects.find(proj => proj.id === projectId);
    return p ? p.name : projectId;
  };

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div>
        <Label className="font-bold">สินค้า (SKU)</Label>
        <Select value={formData.projectId} onValueChange={v => setFormData(f => ({ ...f, projectId: v }))}>
          <SelectTrigger className="border-2 border-black"><SelectValue placeholder="เลือกสินค้า..." /></SelectTrigger>
          <SelectContent>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name} (v.{p.version})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-bold">เลขที่ใบสั่งผลิต</Label>
          <Input className="border-2 border-black" value={formData.orderNumber} onChange={e => setFormData(f => ({ ...f, orderNumber: e.target.value }))} placeholder="PO-001" />
        </div>
        <div>
          <Label className="font-bold">จำนวน (ชิ้น)</Label>
          <Input type="number" min={1} className="border-2 border-black" value={formData.quantity} onChange={e => setFormData(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-bold">ลำดับความสำคัญ</Label>
          <Select value={formData.priority} onValueChange={(v: any) => setFormData(f => ({ ...f, priority: v }))}>
            <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">ต่ำ</SelectItem>
              <SelectItem value="normal">ปกติ</SelectItem>
              <SelectItem value="high">สูง</SelectItem>
              <SelectItem value="urgent">เร่งด่วน</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-bold">กำหนดส่ง</Label>
          <Input type="date" className="border-2 border-black" value={formData.deadline} onChange={e => setFormData(f => ({ ...f, deadline: e.target.value }))} />
        </div>
      </div>
      {isEdit && (
        <div>
          <Label className="font-bold">สถานะ</Label>
          <Select value={formData.status} onValueChange={(v: any) => setFormData(f => ({ ...f, status: v }))}>
            <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">รอดำเนินการ</SelectItem>
              <SelectItem value="in_progress">กำลังผลิต</SelectItem>
              <SelectItem value="completed">เสร็จสิ้น</SelectItem>
              <SelectItem value="cancelled">ยกเลิก</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label className="font-bold">หมายเหตุ</Label>
        <Textarea className="border-2 border-black" value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="รายละเอียดเพิ่มเติม..." />
      </div>
      <Button
        className="w-full neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 text-lg font-bold"
        onClick={isEdit ? handleUpdate : handleCreate}
        disabled={createMutation.isPending || updateMutation.isPending}
      >
        {isEdit ? "บันทึกการแก้ไข" : "สร้างใบสั่งผลิต"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black">
            การจัดการการผลิต
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            จัดการใบสั่งผลิตและติดตามความคืบหน้า
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 px-6 text-lg">
              <Plus className="w-5 h-5 mr-2" /> สร้างใบสั่งผลิต
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_#000000] max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-xl uppercase">สร้างใบสั่งผลิตใหม่</DialogTitle></DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="neo-card bg-yellow-50">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
            <div className="font-heading text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">รอดำเนินการ</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-blue-50">
          <CardContent className="p-4 text-center">
            <Play className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <div className="font-heading text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">กำลังผลิต</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <div className="font-heading text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">เสร็จสิ้น</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-white">
          <CardContent className="p-4 text-center">
            <ClipboardList className="w-6 h-6 mx-auto mb-1 text-gray-600" />
            <div className="font-heading text-2xl font-bold">{stats.totalQty}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">ชิ้นทั้งหมด</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-purple-50">
          <CardContent className="p-4 text-center">
            <Factory className="w-6 h-6 mx-auto mb-1 text-purple-600" />
            <div className="font-heading text-2xl font-bold">{stats.completedQty}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">ผลิตแล้ว</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10 border-2 border-black h-11" placeholder="ค้นหาเลขที่ใบสั่ง..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 border-2 border-black h-11">
            <SelectValue placeholder="สถานะทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="pending">รอดำเนินการ</SelectItem>
            <SelectItem value="in_progress">กำลังผลิต</SelectItem>
            <SelectItem value="completed">เสร็จสิ้น</SelectItem>
            <SelectItem value="cancelled">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
      ) : filteredOrders.length === 0 ? (
        <Card className="neo-card bg-white">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading text-xl font-bold mb-2">ยังไม่มีใบสั่งผลิต</h3>
            <p className="text-muted-foreground">คลิก "สร้างใบสั่งผลิต" เพื่อเริ่มต้น</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order: any) => {
            const statusCfg = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
            const priorityCfg = PRIORITY_CONFIG[order.priority as keyof typeof PRIORITY_CONFIG];
            const StatusIcon = statusCfg.icon;
            const progress = order.quantity > 0 ? Math.round((order.completedQty / order.quantity) * 100) : 0;
            const isOverdue = order.deadline && new Date(order.deadline) < new Date() && order.status !== "completed" && order.status !== "cancelled";

            return (
              <Card key={order.id} className={cn("neo-card bg-white hover:translate-y-[-2px] transition-all", isOverdue && "border-red-500")}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-heading font-bold text-lg uppercase">{order.orderNumber}</span>
                        <Badge className={cn("text-[10px] border", statusCfg.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" /> {statusCfg.label}
                        </Badge>
                        <Badge className={cn("text-[10px] border", priorityCfg.color)}>
                          {priorityCfg.label}
                        </Badge>
                        {isOverdue && (
                          <Badge className="text-[10px] border bg-red-100 text-red-700 border-red-300">
                            <AlertTriangle className="w-3 h-3 mr-1" /> เลยกำหนด
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">SKU: {getProjectName(order.projectId)}</span>
                        <span>จำนวน: {order.completedQty}/{order.quantity} ชิ้น</span>
                        {order.deadline && (
                          <span>กำหนดส่ง: {new Date(order.deadline).toLocaleDateString("th-TH")}</span>
                        )}
                      </div>
                      {order.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{order.notes}</p>}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full md:w-32">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>ความคืบหน้า</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 border border-black rounded-sm overflow-hidden">
                        <div
                          className={cn("h-full transition-all", progress >= 100 ? "bg-green-500" : progress > 50 ? "bg-blue-500" : "bg-yellow-500")}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {order.status === "pending" && (
                        <Button size="sm" variant="outline" className="border-2 border-black text-xs" onClick={() => handleQuickStatusUpdate(order.id, "in_progress")}>
                          <Play className="w-3 h-3 mr-1" /> เริ่มผลิต
                        </Button>
                      )}
                      {order.status === "in_progress" && (
                        <Button size="sm" variant="outline" className="border-2 border-black text-xs" onClick={() => handleQuickStatusUpdate(order.id, "completed", order.quantity)}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> เสร็จสิ้น
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="border-2 border-black" onClick={() => openEdit(order)}>
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => { if (confirm("ต้องการลบใบสั่งผลิตนี้?")) deleteMutation.mutate({ id: order.id }); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={v => { if (!v) { setEditingOrder(null); resetForm(); } }}>
        <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_#000000] max-w-lg">
          <DialogHeader><DialogTitle className="font-heading text-xl uppercase">แก้ไขใบสั่งผลิต</DialogTitle></DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
