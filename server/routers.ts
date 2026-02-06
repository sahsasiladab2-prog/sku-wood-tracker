import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getProjectsByUserId, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  bulkCreateProjects,
  getAllProjects,
  getAllProjectsShared,
  bulkCreatePriceHistory,
  getPriceHistoryByProjectId
} from "./db";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

// Zod schemas for validation
const materialSchema = z.object({
  code: z.string(),
  description: z.string(),
  usage: z.string(),
  usedLength: z.number(),
  refQty: z.number(),
  cost: z.number(),
  quantity: z.number(),
  calculatedCost: z.number(),
  unit: z.string().optional(),
  isCustom: z.boolean().optional(),
});

const channelSchema = z.object({
  name: z.string(),
  price: z.number(),
  feePercent: z.number(),
});

const projectInputSchema = z.object({
  name: z.string().min(1),
  version: z.number().default(1),
  productionType: z.enum(["Outsource", "In-House"]).default("Outsource"),
  note: z.string().optional().nullable(),
  materials: z.array(materialSchema).optional().nullable(),
  carpenterCost: z.number().default(0),
  paintingCost: z.number().default(0),
  packingCost: z.number().default(0),
  wasteCost: z.number().default(0),
  channels: z.array(channelSchema).optional().nullable(),
  totalCost: z.number().default(0),
});

const projectUpdateSchema = projectInputSchema.partial();

// Schema for bulk import (with id)
const projectImportSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  version: z.number().default(1),
  productionType: z.enum(["Outsource", "In-House"]).default("Outsource"),
  note: z.string().optional().nullable(),
  materials: z.array(materialSchema).optional().nullable(),
  carpenterCost: z.number().default(0),
  paintingCost: z.number().default(0),
  packingCost: z.number().default(0),
  wasteCost: z.number().default(0),
  channels: z.array(channelSchema).optional().nullable(),
  totalCost: z.number().default(0),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Project routes
  project: router({
    // List all projects (shared workspace - everyone sees the same data)
    list: publicProcedure.query(async () => {
      const projects = await getAllProjectsShared();
      // Convert decimal strings back to numbers for frontend
      return projects.map(p => ({
        ...p,
        carpenterCost: Number(p.carpenterCost) || 0,
        paintingCost: Number(p.paintingCost) || 0,
        packingCost: Number(p.packingCost) || 0,
        wasteCost: Number(p.wasteCost) || 0,
        totalCost: Number(p.totalCost) || 0,
      }));
    }),

    // Get a single project by ID (shared - anyone can view)
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const project = await getProjectById(input.id);
        if (!project) return null;
        return {
          ...project,
          carpenterCost: Number(project.carpenterCost) || 0,
          paintingCost: Number(project.paintingCost) || 0,
          packingCost: Number(project.packingCost) || 0,
          wasteCost: Number(project.wasteCost) || 0,
          totalCost: Number(project.totalCost) || 0,
        };
      }),

    // Create a new project (shared - anyone can create)
    create: publicProcedure
      .input(projectInputSchema)
      .mutation(async ({ ctx, input }) => {
        const project = await createProject({
          id: nanoid(8).toUpperCase(),
          userId: ctx.user?.id || 0,
          name: input.name,
          version: input.version,
          productionType: input.productionType,
          note: input.note || null,
          materials: input.materials || null,
          carpenterCost: String(input.carpenterCost),
          paintingCost: String(input.paintingCost),
          packingCost: String(input.packingCost),
          wasteCost: String(input.wasteCost),
          channels: input.channels || null,
          totalCost: String(input.totalCost),
        });
        return {
          ...project,
          carpenterCost: Number(project.carpenterCost) || 0,
          paintingCost: Number(project.paintingCost) || 0,
          packingCost: Number(project.packingCost) || 0,
          wasteCost: Number(project.wasteCost) || 0,
          totalCost: Number(project.totalCost) || 0,
        };
      }),

    // Update an existing project (shared - anyone can edit)
    update: publicProcedure
      .input(z.object({ id: z.string(), data: projectUpdateSchema }))
      .mutation(async ({ ctx, input }) => {
        const updateData: Record<string, any> = {};
        
        if (input.data.name !== undefined) updateData.name = input.data.name;
        if (input.data.version !== undefined) updateData.version = input.data.version;
        if (input.data.productionType !== undefined) updateData.productionType = input.data.productionType;
        if (input.data.note !== undefined) updateData.note = input.data.note;
        if (input.data.materials !== undefined) updateData.materials = input.data.materials;
        if (input.data.carpenterCost !== undefined) updateData.carpenterCost = String(input.data.carpenterCost);
        if (input.data.paintingCost !== undefined) updateData.paintingCost = String(input.data.paintingCost);
        if (input.data.packingCost !== undefined) updateData.packingCost = String(input.data.packingCost);
        if (input.data.wasteCost !== undefined) updateData.wasteCost = String(input.data.wasteCost);
        if (input.data.channels !== undefined) updateData.channels = input.data.channels;
        if (input.data.totalCost !== undefined) updateData.totalCost = String(input.data.totalCost);

        const project = await updateProject(input.id, ctx.user?.id || 0, updateData);
        if (!project) return null;
        return {
          ...project,
          carpenterCost: Number(project.carpenterCost) || 0,
          paintingCost: Number(project.paintingCost) || 0,
          packingCost: Number(project.packingCost) || 0,
          wasteCost: Number(project.wasteCost) || 0,
          totalCost: Number(project.totalCost) || 0,
        };
      }),

    // Delete a project (shared - anyone can delete)
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await deleteProject(input.id);
        return { success: true };
      }),

    // Bulk import projects (for migrating from localStorage)
    bulkImport: publicProcedure
      .input(z.object({ projects: z.array(projectImportSchema) }))
      .mutation(async ({ ctx, input }) => {
        const projectsToInsert = input.projects.map(p => ({
          id: p.id,
          userId: ctx.user?.id || 0,
          name: p.name,
          version: p.version,
          productionType: p.productionType,
          note: p.note || null,
          materials: p.materials || null,
          carpenterCost: String(p.carpenterCost),
          paintingCost: String(p.paintingCost),
          packingCost: String(p.packingCost),
          wasteCost: String(p.wasteCost),
          channels: p.channels || null,
          totalCost: String(p.totalCost),
        }));

        const count = await bulkCreateProjects(projectsToInsert);
        return { success: true, count };
      }),

    // Send backup email to owner with JSON download link
    sendBackupEmail: publicProcedure
      .mutation(async () => {
        // Get all projects (shared workspace)
        const projects = await getAllProjectsShared();
        
        // Convert to export format (full data)
        const exportData = projects.map(p => ({
          id: p.id,
          name: p.name,
          version: p.version,
          productionType: p.productionType,
          note: p.note,
          materials: p.materials,
          costs: {
            carpenter: Number(p.carpenterCost) || 0,
            painting: Number(p.paintingCost) || 0,
            packing: Number(p.packingCost) || 0,
            waste: Number(p.wasteCost) || 0,
          },
          channels: p.channels,
          totalCost: Number(p.totalCost) || 0,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));

        // Create backup summary
        const totalSkus = projects.length;
        const totalCost = exportData.reduce((sum, p) => sum + p.totalCost, 0);
        const backupDate = new Date().toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Generate unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const randomId = nanoid(8);
        const fileName = `backups/sku-backup-${timestamp}-${randomId}.json`;

        // Upload full JSON data to S3
        let downloadUrl = '';
        try {
          const jsonData = JSON.stringify(exportData, null, 2);
          const { url } = await storagePut(fileName, jsonData, 'application/json');
          downloadUrl = url;
        } catch (error) {
          console.error('Failed to upload backup to S3:', error);
          // Continue without download link if upload fails
        }

        // Create email content with download link
        const title = `📦 SKU Wood Tracker - Backup (${new Date().toLocaleDateString('th-TH')})`;
        const content = `
🔔 **รายงานสำรองข้อมูล**

📅 วันที่: ${backupDate}
📊 จำนวน SKU ทั้งหมด: ${totalSkus} รายการ
💰 มูลค่าต้นทุนรวม: ฿${totalCost.toLocaleString()}

---

📋 **รายการ SKU ล่าสุด (5 รายการแรก):**
${exportData.slice(0, 5).map((p, i) => 
  `${i + 1}. ${p.name} (v.${p.version}) - ฿${p.totalCost.toLocaleString()}`
).join('\n')}
${totalSkus > 5 ? `\n... และอีก ${totalSkus - 5} รายการ` : ''}

---

📥 **ดาวน์โหลดข้อมูลฉบับเต็ม (JSON):**
${downloadUrl ? `🔗 ${downloadUrl}` : '⚠️ ไม่สามารถสร้างลิงก์ดาวน์โหลดได้ กรุณาใช้ปุ่ม Export Data ในระบบแทน'}

${downloadUrl ? `✅ **ลิงก์นี้ไม่มีวันหมดอายุ** - สามารถดาวน์โหลดได้ตลอดเวลา

💡 **เคล็ดลับ:** เก็บไฟล์ JSON ไว้ใน Google Drive หรือ Dropbox เพื่อความปลอดภัยเพิ่มเติม` : ''}

---
ระบบสำรองข้อมูล SKU Wood Tracker
        `.trim();

        // Send notification
        const sent = await notifyOwner({ title, content });
        
        return { 
          success: sent, 
          totalSkus, 
          backupDate,
          downloadUrl,
          message: sent ? 'Backup email sent successfully with download link' : 'Failed to send backup email'
        };
      }),

    // Import projects from JSON file (exported data)
    importFromJson: publicProcedure
      .input(z.object({ 
        projects: z.array(z.any()),
        mode: z.enum(["merge", "replace"]).default("merge")
      }))
      .mutation(async ({ ctx, input }) => {
        // Transform exported JSON format to DB format
        const projectsToInsert = input.projects.map((p: any) => {
          // Generate new ID to avoid conflicts
          const newId = nanoid(8).toUpperCase();
          
          // Handle materials - convert from export format
          let materials = null;
          if (p.materials && Array.isArray(p.materials)) {
            materials = p.materials.map((m: any) => ({
              code: m.code || "CUSTOM",
              description: m.description || "Imported Item",
              usage: m.usage || "",
              usedLength: m.usedLength || m.length || 0,
              refQty: m.refQty || 100,
              cost: m.cost || m.pricePerUnit || m.calculatedCost || 0,
              quantity: typeof m.quantity === 'number' ? m.quantity : 1,
              calculatedCost: m.calculatedCost || 0,
              unit: m.unit || "cm",
              isCustom: m.isCustom || false,
            }));
          }
          
          // Handle channels
          let channels = null;
          if (p.channels && Array.isArray(p.channels)) {
            channels = p.channels.map((c: any) => ({
              name: c.name || "Default",
              price: c.price || 0,
              feePercent: c.feePercent || 0,
            }));
          }
          
          // Handle costs - support both old and new format
          const carpenterCost = p.costs?.carpenter || p.carpenterCost || 0;
          const paintingCost = p.costs?.painting || p.paintingCost || 0;
          const packingCost = p.costs?.packing || p.packingCost || 0;
          const wasteCost = p.costs?.waste || p.wasteCost || 0;
          
          return {
            id: newId,
            userId: ctx.user?.id || 0,
            name: p.name || "Imported Project",
            version: p.version || 1,
            productionType: p.productionType || "Outsource",
            note: p.note || null,
            materials,
            carpenterCost: String(carpenterCost),
            paintingCost: String(paintingCost),
            packingCost: String(packingCost),
            wasteCost: String(wasteCost),
            channels,
            totalCost: String(p.totalCost || 0),
          };
        });

        const count = await bulkCreateProjects(projectsToInsert);
        return { success: true, count, imported: projectsToInsert.length };
      }),

    // Update prices and record history (shared - anyone can update prices)
    updatePricesWithHistory: publicProcedure
      .input(z.object({
        projectId: z.string(),
        oldChannels: z.array(channelSchema),
        newChannels: z.array(channelSchema),
      }))
      .mutation(async ({ ctx, input }) => {
        // Find changed channels and record history
        const historyRecords: Array<{
          projectId: string;
          userId: number;
          channelName: string;
          oldPrice: string;
          newPrice: string;
          oldFeePercent: string;
          newFeePercent: string;
        }> = [];

        for (const newChannel of input.newChannels) {
          const oldChannel = input.oldChannels.find(c => c.name === newChannel.name);
          
          // Record if price or fee changed
          if (oldChannel && (oldChannel.price !== newChannel.price || oldChannel.feePercent !== newChannel.feePercent)) {
            historyRecords.push({
              projectId: input.projectId,
              userId: ctx.user?.id || 0,
              channelName: newChannel.name,
              oldPrice: String(oldChannel.price),
              newPrice: String(newChannel.price),
              oldFeePercent: String(oldChannel.feePercent),
              newFeePercent: String(newChannel.feePercent),
            });
          }
        }

        // Save history records
        if (historyRecords.length > 0) {
          await bulkCreatePriceHistory(historyRecords);
        }

        // Update project with new channels
        const project = await updateProject(input.projectId, ctx.user?.id || 0, {
          channels: input.newChannels,
        });

        return {
          success: true,
          historyCount: historyRecords.length,
          project: project ? {
            ...project,
            carpenterCost: Number(project.carpenterCost) || 0,
            paintingCost: Number(project.paintingCost) || 0,
            packingCost: Number(project.packingCost) || 0,
            wasteCost: Number(project.wasteCost) || 0,
            totalCost: Number(project.totalCost) || 0,
          } : null,
        };
      }),

    // Get price history for a project (shared - anyone can view)
    getPriceHistory: publicProcedure
      .input(z.object({ projectId: z.string() }))
      .query(async ({ input }) => {
        const history = await getPriceHistoryByProjectId(input.projectId);
        return history.map(h => ({
          ...h,
          oldPrice: Number(h.oldPrice) || 0,
          newPrice: Number(h.newPrice) || 0,
          oldFeePercent: Number(h.oldFeePercent) || 0,
          newFeePercent: Number(h.newFeePercent) || 0,
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
