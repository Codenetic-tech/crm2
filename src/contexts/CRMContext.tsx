// contexts/CRMContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';

interface CRMContextType {
  refreshLeads: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

interface CRMProviderProps {
  children: ReactNode;
  refreshLeads: () => void;
}

export const CRMProvider: React.FC<CRMProviderProps> = ({ 
  children, 
  refreshLeads 
}) => {
  return (
    <CRMContext.Provider value={{ refreshLeads }}>
      {children}
    </CRMContext.Provider>
  );
};