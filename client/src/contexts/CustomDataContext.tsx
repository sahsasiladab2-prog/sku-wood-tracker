import React, { createContext, useContext, useEffect, useState } from "react";
import { WoodItem, woodData as initialWoodData } from "@/lib/woodData";

interface DefaultLaborCosts {
  carpenter: number;
  painting: number;
  packing: number;
}

interface CustomDataContextType {
  materials: WoodItem[];
  usages: string[];
  defaultLaborCosts: DefaultLaborCosts;
  addMaterial: (material: WoodItem) => void;
  addUsage: (usage: string) => void;
  updateDefaultLaborCosts: (costs: DefaultLaborCosts) => void;
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

  // Default Labor Costs State
  const [defaultLaborCosts, setDefaultLaborCosts] = useState<DefaultLaborCosts>(() => {
    const saved = localStorage.getItem("sku-default-labor-costs");
    return saved ? JSON.parse(saved) : { carpenter: 0, painting: 0, packing: 20 };
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

  // Persist Default Labor Costs
  useEffect(() => {
    localStorage.setItem("sku-default-labor-costs", JSON.stringify(defaultLaborCosts));
  }, [defaultLaborCosts]);

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

  const updateDefaultLaborCosts = (costs: DefaultLaborCosts) => {
    setDefaultLaborCosts(costs);
  };

  return (
    <CustomDataContext.Provider value={{ materials, usages, defaultLaborCosts, addMaterial, addUsage, updateDefaultLaborCosts }}>
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
