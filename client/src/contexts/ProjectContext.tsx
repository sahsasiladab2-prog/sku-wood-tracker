import React, { createContext, useContext, useEffect, useState } from "react";
import { nanoid } from "nanoid";

export interface ChannelPricing {
  id: string;
  name: string; // e.g., "Shopee A", "Lazada", "Retail"
  price: number;
  feePercent: number; // Platform fee percentage
  profit: number;
  marginPercent: number;
}

export interface Project {
  id: string;
  name: string;
  version: number;
  status: "Idea" | "Prototype" | "Production" | "Discontinued";
  margin: number; // Keep for backward compatibility or as "Default/Target Margin"
  totalCost: number;
  sellingPrice: number; // Keep for backward compatibility (maybe as "Base Price")
  channels?: ChannelPricing[]; // New field for multi-channel pricing
  updatedAt: string;
  note?: string;
  productionType?: "Outsource" | "In-House";
  materials?: any[];
  costs?: any;
}

interface ProjectContextType {
  projects: Project[];
  addProject: (project: Omit<Project, "id" | "updatedAt">) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProjectVersion: (name: string) => number;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem("sku-projects");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("sku-projects", JSON.stringify(projects));
  }, [projects]);

  const addProject = (projectData: Omit<Project, "id" | "updatedAt">) => {
    const newProject: Project = {
      ...projectData,
      id: nanoid(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const getProjectVersion = (name: string) => {
    const existingProjects = projects.filter(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingProjects.length === 0) return 1;

    // Find the highest version number
    const maxVersion = Math.max(...existingProjects.map(p => p.version));
    return maxVersion + 1;
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProject, deleteProject, getProjectVersion }}>
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
