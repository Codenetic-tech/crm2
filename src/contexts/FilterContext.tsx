// contexts/FilterContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateRange {
  start: string;
  end: string;
}

interface TreeDataNode {
  label: string;
  value: string;
  children?: TreeDataNode[];
}

interface FilterContextType {
  selectedHierarchy: string[];
  setSelectedHierarchy: (hierarchy: string[]) => void;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  hierarchyTreeData: TreeDataNode[];
  setHierarchyTreeData: (data: TreeDataNode[]) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedHierarchy, setSelectedHierarchy] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [hierarchyTreeData, setHierarchyTreeData] = useState<TreeDataNode[]>([]);

  return (
    <FilterContext.Provider value={{
      selectedHierarchy,
      setSelectedHierarchy,
      dateRange,
      setDateRange,
      hierarchyTreeData,
      setHierarchyTreeData
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};