import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus, Users, Search, Trash2, Edit3, UserCheck, UserX,
  Hammer, Paintbrush, PackageCheck, Shield, Wrench, Phone, Banknote,
} from "lucide-react";

const ROLE_CONFIG = {
  carpenter: { label: "ช่างไม้", icon: Hammer, color: "bg-amber-100 text-amber-800 border-amber-300" },
  painter: { label: "ช่างทาสี", icon: Paintbrush, color: "bg-blue-100 text-blue-800 border-blue-300" },
  packer: { label: "ช่างแพ็ค", icon: PackageCheck, color: "bg-green-100 text-green-800 border-green-300" },
  supervisor: { label: "หัวหน้า", icon: Shield, color: "bg-purple-100 text-purple-800 border-purple-300" },
  general: { label: "ทั่วไป", icon: Wrench, color: "bg-gray-100 text-gray-800 border-gray-300" },
};

export default function Workers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    role: "general" as "carpenter" | "painter" | "packer" | "supervisor" | "general",
    phone: "",
    dailyWage: 0,
    status: "active" as "active" | "inactive",
  });

  const { data: workersList = [], isLoading, refetch } = trpc.worker.list.useQuery();

  const createMutation = trpc.worker.create.useMutation({
    onSuccess: () => { refetch(); setIsCreateOpen(false); resetForm(); toast.success("เพิ่มพนักงานสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  const updateMutation = trpc.worker.update.useMutation({
    onSuccess: () => { refetch(); setEditingWorker(null); resetForm(); toast.success("อัปเดตสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  const deleteMutation = trpc.worker.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("ลบพนักงานสำเร็จ"); },
    onError: (e) => toast.error("เกิดข้อผิดพลาด: " + e.message),
  });

  function resetForm() {
    setFormData({ name: "", role: "general", phone: "", dailyWage: 0, status: "active" });
  }

  function handleCreate() {
    if (!formData.name) { toast.error("กรุณากรอกชื่อพนักงาน"); return; }
    createMutation.mutate({
      name: formData.name,
      role: formData.role,
      phone: formData.phone || null,
      dailyWage: formData.dailyWage,
      status: formData.status,
    });
  }

  function handleUpdate() {
    if (!editingWorker) return;
    updateMutation.mutate({
      id: editingWorker.id,
      data: {
        name: formData.name,
        role: formData.role,
        phone: formData.phone || null,
        dailyWage: formData.dailyWage,
        status: formData.status,
      },
    });
  }

  function openEdit(worker: any) {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      role: worker.role,
      phone: worker.phone || "",
      dailyWage: worker.dailyWage,
      status: worker.status,
    });
  }

  function toggleStatus(worker: any) {
    const newStatus = worker.status === "active" ? "inactive" : "active";
    updateMutation.mutate({ id: worker.id, data: { status: newStatus } });
  }

  const filteredWorkers = useMemo(() => {
    return workersList.filter((w: any) => {
      const matchSearch = !searchTerm || w.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === "all" || w.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [workersList, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    const total = workersList.length;
    const active = workersList.filter((w: any) => w.status === "active").length;
    const totalWage = workersList.filter((w: any) => w.status === "active").reduce((s: number, w: any) => s + w.dailyWage, 0);
    const byRole = Object.keys(ROLE_CONFIG).reduce((acc, role) => {
      acc[role] = workersList.filter((w: any) => w.role === role && w.status === "active").length;
      return acc;
    }, {} as Record<string, number>);
    return { total, active, totalWage, byRole };
  }, [workersList]);

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-4">
      <div>
        <Label className="font-bold">ชื่อ-สกุล</Label>
        <Input className="border-2 border-black" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} placeholder="ชื่อพนักงาน" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-bold">ตำแหน่ง</Label>
          <Select value={formData.role} onValueChange={(v: any) => setFormData(f => ({ ...f, role: v }))}>
            <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="carpenter">ช่างไม้</SelectItem>
              <SelectItem value="painter">ช่างทาสี</SelectItem>
              <SelectItem value="packer">ช่างแพ็ค</SelectItem>
              <SelectItem value="supervisor">หัวหน้า</SelectItem>
              <SelectItem value="general">ทั่วไป</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-bold">สถานะ</Label>
          <Select value={formData.status} onValueChange={(v: any) => setFormData(f => ({ ...f, status: v }))}>
            <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">ทำงานอยู่</SelectItem>
              <SelectItem value="inactive">พักงาน</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-bold">เบอร์โทร</Label>
          <Input className="border-2 border-black" value={formData.phone} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} placeholder="08x-xxx-xxxx" />
        </div>
        <div>
          <Label className="font-bold">ค่าแรง/วัน (บาท)</Label>
          <Input type="number" min={0} className="border-2 border-black" value={formData.dailyWage} onChange={e => setFormData(f => ({ ...f, dailyWage: parseFloat(e.target.value) || 0 }))} />
        </div>
      </div>
      <Button className="w-full neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 text-lg font-bold" onClick={isEdit ? handleUpdate : handleCreate} disabled={createMutation.isPending || updateMutation.isPending}>
        {isEdit ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน"}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold uppercase text-black">
            จัดการพนักงาน
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            จัดการข้อมูลพนักงานในโรงงาน
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={v => { setIsCreateOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="neo-button bg-chart-3 text-white hover:bg-blue-700 h-12 px-6 text-lg">
              <Plus className="w-5 h-5 mr-2" /> เพิ่มพนักงาน
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_#000000] max-w-lg">
            <DialogHeader><DialogTitle className="font-heading text-xl uppercase">เพิ่มพนักงานใหม่</DialogTitle></DialogHeader>
            {renderForm(false)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="neo-card bg-white">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <div className="font-heading text-2xl font-bold">{stats.total}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">พนักงานทั้งหมด</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-green-50">
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <div className="font-heading text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">ทำงานอยู่</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-amber-50">
          <CardContent className="p-4 text-center">
            <Banknote className="w-6 h-6 mx-auto mb-1 text-amber-600" />
            <div className="font-heading text-2xl font-bold">฿{stats.totalWage.toLocaleString()}</div>
            <p className="text-xs font-bold uppercase text-muted-foreground">ค่าแรง/วัน</p>
          </CardContent>
        </Card>
        <Card className="neo-card bg-white">
          <CardContent className="p-4 text-center">
            <Hammer className="w-6 h-6 mx-auto mb-1 text-gray-600" />
            <div className="font-heading text-sm font-bold leading-tight mt-1">
              {Object.entries(stats.byRole).filter(([, v]) => v > 0).map(([k, v]) => (
                <span key={k} className="block">{ROLE_CONFIG[k as keyof typeof ROLE_CONFIG].label}: {v}</span>
              ))}
              {Object.values(stats.byRole).every(v => v === 0) && <span className="text-muted-foreground">-</span>}
            </div>
            <p className="text-xs font-bold uppercase text-muted-foreground mt-1">ตามตำแหน่ง</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10 border-2 border-black h-11" placeholder="ค้นหาพนักงาน..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-48 border-2 border-black h-11">
            <SelectValue placeholder="ตำแหน่งทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="carpenter">ช่างไม้</SelectItem>
            <SelectItem value="painter">ช่างทาสี</SelectItem>
            <SelectItem value="packer">ช่างแพ็ค</SelectItem>
            <SelectItem value="supervisor">หัวหน้า</SelectItem>
            <SelectItem value="general">ทั่วไป</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workers List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
      ) : filteredWorkers.length === 0 ? (
        <Card className="neo-card bg-white">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="font-heading text-xl font-bold mb-2">ยังไม่มีพนักงาน</h3>
            <p className="text-muted-foreground">คลิก "เพิ่มพนักงาน" เพื่อเริ่มต้น</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkers.map((worker: any) => {
            const roleCfg = ROLE_CONFIG[worker.role as keyof typeof ROLE_CONFIG];
            const RoleIcon = roleCfg.icon;
            const isActive = worker.status === "active";

            return (
              <Card key={worker.id} className={cn("neo-card bg-white", !isActive && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-12 h-12 rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000000]", isActive ? "bg-chart-4" : "bg-gray-300")}>
                        <RoleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{worker.name}</h4>
                        <Badge className={cn("text-[10px] border", roleCfg.color)}>
                          {roleCfg.label}
                        </Badge>
                      </div>
                    </div>
                    <Badge className={cn("text-[10px] border", isActive ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300")}>
                      {isActive ? "ทำงานอยู่" : "พักงาน"}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    {worker.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{worker.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Banknote className="w-4 h-4" />
                      <span>ค่าแรง: ฿{worker.dailyWage.toLocaleString()}/วัน</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className={cn("flex-1 border-2 text-xs", isActive ? "border-orange-300 text-orange-600 hover:bg-orange-50" : "border-green-300 text-green-600 hover:bg-green-50")} onClick={() => toggleStatus(worker)}>
                      {isActive ? <><UserX className="w-3 h-3 mr-1" /> พักงาน</> : <><UserCheck className="w-3 h-3 mr-1" /> เรียกกลับ</>}
                    </Button>
                    <Button size="sm" variant="outline" className="border-2 border-black" onClick={() => openEdit(worker)}>
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-2 border-red-300 text-red-600 hover:bg-red-50" onClick={() => { if (confirm("ต้องการลบพนักงานนี้?")) deleteMutation.mutate({ id: worker.id }); }}>
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
      <Dialog open={!!editingWorker} onOpenChange={v => { if (!v) { setEditingWorker(null); resetForm(); } }}>
        <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_#000000] max-w-lg">
          <DialogHeader><DialogTitle className="font-heading text-xl uppercase">แก้ไขข้อมูลพนักงาน</DialogTitle></DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
