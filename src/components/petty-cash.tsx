// pages/petty-cash.tsx
import React, { useState, useEffect } from 'react';
import PettyCashManagement from '@/components/PettyCash/PettyCashManagement';

const PettyCashPage: React.FC = () => {
  return (
    <div className="min-h-screen ml-[30px]">
      <PettyCashManagement />
    </div>
  );
};

export default PettyCashPage;