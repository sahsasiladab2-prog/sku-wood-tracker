import React, { createContext, useContext, useEffect, useState } from "react";
import { WoodItem, woodData as initialWoodData } from "@/lib/woodData";

interface CustomDataContextType {
  materials: WoodItem[];
  usages: string[];
  addMaterial: (material: WoodItem) => void;
  addUsage: (usage: string) => void;
}

const CustomDataContext = createContext<CustomDataContextType | undefined>(undefined);

export function CustomDataProvider({ children }: { children: React.ReactNode }) {
  // Materials State
  const [materials, setMaterials] = useState<WoodItem[]>(() => {
    const saved = localStorage.getItem("sku-custom-materials");
    return saved ? [...initialWoodData, ...JSON.parse(saved)] : initialWoodData;
  });

  // Usages State
  const [usages, setUsages] = useState<string[]>(() => {
    const saved = localStorage.getItem("sku-custom-usages");
    return saved ? JSON.parse(saved) : ["Leg", "Top", "Frame", "Shelf", "Door", "Drawer"];
  });

  // Persist Custom Materials (Only the new ones)
  useEffect(() => {
    const customOnly = materials.filter(m => !initialWoodData.some(i => i.code === m.code));
    localStorage.setItem("sku-custom-materials", JSON.stringify(customOnly));
  }, [materials]);

  // Persist Usages
  useEffect(() => {
    localStorage.setItem("sku-custom-usages", JSON.stringify(usages));
  }, [usages]);

  const addMaterial = (material: WoodItem) => {
    setMaterials(prev => {
      if (prev.some(m => m.code === material.code)) return prev;
      return [...prev, material];
    });
  };

  const addUsage = (usage: string) => {
    setUsages(prev => {
      if (prev.includes(usage)) return prev;
      return [...prev, usage];
    });
  };

  return (
    <CustomDataContext.Provider value={{ materials, usages, addMaterial, addUsage }}>
      {children}
    </CustomDataContext.Provider>
  );
}

export function useCustomData() {
  const context = useContext(CustomDataContext);
  if (context === undefined) {
    throw new Error("useCustomData must be used within a CustomDataProvider");
  }
  return context;
}
