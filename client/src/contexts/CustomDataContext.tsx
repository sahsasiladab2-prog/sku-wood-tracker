import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { WoodItem, woodData as initialWoodData } from "@/lib/woodData";
import { trpc } from "@/lib/trpc";

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
  isLoadingPrices: boolean;
}

const CustomDataContext = createContext<CustomDataContextType | undefined>(undefined);

export function CustomDataProvider({ children }: { children: React.ReactNode }) {
  // Custom materials added by user (stored in localStorage)
  const [customMaterials, setCustomMaterials] = useState<WoodItem[]>(() => {
    const saved = localStorage.getItem("sku-custom-materials");
    return saved ? JSON.parse(saved) : [];
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

  // Fetch wood prices from database
  const { data: dbMaterials = [], isLoading: isLoadingPrices } = trpc.wood.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  // Build merged materials list: DB prices override local prices
  // Custom materials added by user are appended at the end
  const materials = useMemo<WoodItem[]>(() => {
    // Build a map of DB prices by code
    const dbPriceMap = new Map<string, number>();
    dbMaterials.forEach((m) => dbPriceMap.set(m.code, m.cost));

    // Apply DB prices to initial wood data
    const mergedBase = initialWoodData.map((w) => {
      const dbPrice = dbPriceMap.get(w.code);
      return dbPrice !== undefined ? { ...w, cost: dbPrice } : w;
    });

    // Add DB-only materials (not in local woodData)
    const localCodes = new Set(initialWoodData.map((w) => w.code));
    const dbOnlyMaterials = dbMaterials
      .filter((m) => !localCodes.has(m.code))
      .map((m) => ({
        code: m.code,
        description: m.description,
        unit: m.unit,
        refQty: m.refQty,
        cost: m.cost,
      }));

    // Merge: base + DB-only + custom user materials
    const allCodes = new Set([...mergedBase.map((w) => w.code), ...dbOnlyMaterials.map((m) => m.code)]);
    const uniqueCustom = customMaterials.filter((m) => !allCodes.has(m.code));

    return [...mergedBase, ...dbOnlyMaterials, ...uniqueCustom];
  }, [dbMaterials, customMaterials]);

  // Persist Custom Materials (Only the new ones added by user in Calculator)
  useEffect(() => {
    localStorage.setItem("sku-custom-materials", JSON.stringify(customMaterials));
  }, [customMaterials]);

  // Persist Usages
  useEffect(() => {
    localStorage.setItem("sku-custom-usages", JSON.stringify(usages));
  }, [usages]);

  // Persist Default Labor Costs
  useEffect(() => {
    localStorage.setItem("sku-default-labor-costs", JSON.stringify(defaultLaborCosts));
  }, [defaultLaborCosts]);

  const addMaterial = (material: WoodItem) => {
    setCustomMaterials(prev => {
      if (prev.some(m => m.code === material.code)) return prev;
      // Also check if it already exists in the main list
      if (initialWoodData.some(m => m.code === material.code)) return prev;
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
    <CustomDataContext.Provider value={{ materials, usages, defaultLaborCosts, addMaterial, addUsage, updateDefaultLaborCosts, isLoadingPrices }}>
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
