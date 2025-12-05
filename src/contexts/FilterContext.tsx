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

  // Initialize date range with current month start to today
  const getInitialDateRange = (): DateRange => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(firstDayOfMonth),
      end: formatDate(today)
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange());
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