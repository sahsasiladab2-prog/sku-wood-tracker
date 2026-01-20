import React, { createContext, useContext, useEffect, useState } from "react";
import { nanoid } from "nanoid";

export interface Project {
  id: string;
  name: string;
  version: number;
  status: "Idea" | "Prototype" | "Production" | "Discontinued";
  margin: number;
  totalCost: number;
  sellingPrice: number;
  updatedAt: string;
  note?: string;
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
    return existingProjects.length + 1;
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
