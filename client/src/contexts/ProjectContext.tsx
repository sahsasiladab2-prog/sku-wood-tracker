import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export interface ChannelPricing {
  id: string;
  name: string;
  price: number;
  feePercent: number;
  profit: number;
  marginPercent: number;
}

export interface Project {
  id: string;
  name: string;
  version: number;
  status: "Idea" | "Prototype" | "Production" | "Discontinued";
  margin: number;
  totalCost: number;
  sellingPrice: number;
  channels?: ChannelPricing[];
  updatedAt: string;
  note?: string;
  productionType?: "Outsource" | "In-House";
  materials?: any[];
  costs?: any;
}

interface ProjectContextType {
  projects: Project[];
  addProject: (project: Omit<Project, "id" | "updatedAt">) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectVersion: (name: string) => number;
  isLoading: boolean;
  migrateFromLocalStorage: () => Promise<void>;
  hasPendingMigration: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Helper to convert DB project to frontend format
function dbToFrontend(dbProject: any): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    version: dbProject.version,
    status: "Production" as const,
    margin: 0,
    totalCost: dbProject.totalCost || 0,
    sellingPrice: 0,
    channels: dbProject.channels?.map((c: any, i: number) => ({
      id: `ch-${i}`,
      name: c.name,
      price: c.price,
      feePercent: c.feePercent,
      profit: 0,
      marginPercent: 0,
    })),
    updatedAt: dbProject.updatedAt?.toISOString?.() || new Date().toISOString(),
    note: dbProject.note || undefined,
    productionType: dbProject.productionType || "Outsource",
    materials: dbProject.materials || [],
    costs: {
      carpenter: dbProject.carpenterCost || 0,
      painting: dbProject.paintingCost || 0,
      packing: dbProject.packingCost || 0,
      waste: dbProject.wasteCost || 0,
    },
  };
}

// Helper to convert frontend project to DB format
function frontendToDb(project: Partial<Project>) {
  const result: any = {};
  
  if (project.name !== undefined) result.name = project.name;
  if (project.version !== undefined) result.version = project.version;
  if (project.productionType !== undefined) result.productionType = project.productionType;
  if (project.note !== undefined) result.note = project.note;
  if (project.totalCost !== undefined) result.totalCost = project.totalCost;
  
  if (project.materials !== undefined) {
    result.materials = project.materials.map(m => ({
      code: m.code || "",
      description: m.description || "",
      usage: m.usage || "",
      usedLength: m.usedLength || 0,
      refQty: m.refQty || 0,
      cost: m.cost || 0,
      quantity: typeof m.quantity === 'number' ? m.quantity : 0,
      calculatedCost: m.calculatedCost || 0,
      unit: m.unit || "cm",
      isCustom: m.isCustom || false,
    }));
  }
  
  if (project.costs !== undefined) {
    result.carpenterCost = project.costs.carpenter || 0;
    result.paintingCost = project.costs.painting || 0;
    result.packingCost = project.costs.packing || 0;
    result.wasteCost = project.costs.waste || 0;
  }
  
  if (project.channels !== undefined) {
    result.channels = project.channels.map(c => ({
      name: c.name,
      price: c.price,
      feePercent: c.feePercent,
    }));
  }
  
  return result;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [hasPendingMigration, setHasPendingMigration] = useState(false);
  
  // tRPC queries and mutations - always enabled (shared workspace, no auth required)
  const { data: dbProjects, isLoading, refetch } = trpc.project.list.useQuery(undefined);
  
  const createMutation = trpc.project.create.useMutation({
    onSuccess: () => refetch(),
  });
  
  const updateMutation = trpc.project.update.useMutation({
    onSuccess: () => refetch(),
  });
  
  const deleteMutation = trpc.project.delete.useMutation({
    onSuccess: () => refetch(),
  });
  
  const bulkImportMutation = trpc.project.bulkImport.useMutation({
    onSuccess: () => {
      refetch();
      // Clear localStorage after successful migration
      localStorage.removeItem("sku-projects");
      setHasPendingMigration(false);
      toast.success("ย้ายข้อมูลสำเร็จ! ข้อมูลของคุณถูกบันทึกในระบบออนไลน์แล้ว");
    },
    onError: (error) => {
      toast.error("ย้ายข้อมูลล้มเหลว: " + error.message);
    },
  });

  // Convert DB projects to frontend format
  const projects: Project[] = React.useMemo(() => {
    if (!dbProjects) return [];
    return dbProjects.map(dbToFrontend);
  }, [dbProjects]);

  // Check for pending migration on mount
  useEffect(() => {
    if (!authLoading) {
      const localData = localStorage.getItem("sku-projects");
      if (localData) {
        try {
          const localProjects = JSON.parse(localData);
          if (Array.isArray(localProjects) && localProjects.length > 0) {
            setHasPendingMigration(true);
          }
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, [authLoading]);

  const addProject = useCallback(async (projectData: Omit<Project, "id" | "updatedAt">) => {
    const dbData = frontendToDb(projectData);
    await createMutation.mutateAsync(dbData);
  }, [createMutation]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const dbData = frontendToDb(updates);
    await updateMutation.mutateAsync({ id, data: dbData });
  }, [updateMutation]);

  const deleteProject = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync({ id });
  }, [deleteMutation]);

  const getProjectVersion = useCallback((name: string) => {
    const existingProjects = projects.filter(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingProjects.length === 0) return 1;

    const maxVersion = Math.max(...existingProjects.map(p => p.version));
    return maxVersion + 1;
  }, [projects]);

  const migrateFromLocalStorage = useCallback(async () => {
    const localData = localStorage.getItem("sku-projects");
    if (!localData) {
      toast.info("ไม่พบข้อมูลในเครื่องที่ต้องย้าย");
      return;
    }

    try {
      const localProjects = JSON.parse(localData);
      if (!Array.isArray(localProjects) || localProjects.length === 0) {
        toast.info("ไม่พบข้อมูลในเครื่องที่ต้องย้าย");
        return;
      }

      // Convert local projects to DB format
      const projectsToImport = localProjects.map((p: any) => ({
        id: p.id || `MIGRATED-${Date.now()}`,
        name: p.name || "Unnamed",
        version: p.version || 1,
        productionType: p.productionType || "Outsource",
        note: p.note || null,
        materials: p.materials?.map((m: any) => ({
          code: m.code || "",
          description: m.description || "",
          usage: m.usage || "",
          usedLength: m.usedLength || 0,
          refQty: m.refQty || 0,
          cost: m.cost || 0,
          quantity: typeof m.quantity === 'number' ? m.quantity : 0,
          calculatedCost: m.calculatedCost || 0,
          unit: m.unit || "cm",
          isCustom: m.isCustom || false,
        })) || null,
        carpenterCost: p.costs?.carpenter || 0,
        paintingCost: p.costs?.painting || 0,
        packingCost: p.costs?.packing || 0,
        wasteCost: p.costs?.waste || 0,
        channels: p.channels?.map((c: any) => ({
          name: c.name,
          price: c.price,
          feePercent: c.feePercent,
        })) || null,
        totalCost: p.totalCost || 0,
      }));

      toast.info(`กำลังย้ายข้อมูล ${projectsToImport.length} รายการ...`);
      await bulkImportMutation.mutateAsync({ projects: projectsToImport });
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการย้ายข้อมูล");
      console.error("Migration error:", e);
    }
  }, [isAuthenticated, bulkImportMutation]);

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      updateProject, 
      deleteProject, 
      getProjectVersion,
      isLoading: isLoading,
      migrateFromLocalStorage,
      hasPendingMigration,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
}
