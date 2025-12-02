// Layout.tsx
import React, { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import Header from './Header';
import { Menu, X, Home, Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { FilterProvider, useFilter } from '@/contexts/FilterContext';

// Define types for hierarchy
interface HierarchyNode {
  first_name: string;
  email: string;
  reports_to: string;
  branch: string;
  username: string;
  hierarchy_level: number;
}

interface TreeDataNode {
  label: string;
  value: string;
  children?: TreeDataNode[];
}

interface LayoutProps {
  children: React.ReactNode;
}

// Inner component that uses the filter context
const LayoutContent: React.FC<LayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { setHierarchyTreeData } = useFilter();
  const { user } = useAuth();

  // Compute hierarchy tree data in the layout
  const hierarchyTreeData = useMemo((): TreeDataNode[] => {
    if (!user?.hierarchy) {
      setHierarchyTreeData([]);
      return [];
    }

    try {
      const hierarchy: HierarchyNode[] = JSON.parse(user.hierarchy);
      
      // Find the current user (hierarchy_level: 0)
      const currentUserNode = hierarchy.find(node => node.hierarchy_level === 0);
      if (!currentUserNode) {
        setHierarchyTreeData([]);
        return [];
      }

      // Function to build tree structure recursively
      const buildTreeForNode = (email: string): TreeDataNode[] => {
        const children = hierarchy.filter(node => node.reports_to === email);
        
        return children.map(child => {
          const employeeId = child.username.replace('SKY', '');
          const displayName = `${child.first_name} ${employeeId}`;
          
          return {
            label: displayName,
            value: child.email,
            children: buildTreeForNode(child.email)
          };
        });
      };

      // Check if current user is in HO branch (top-level manager)
      const isHeadOffice = currentUserNode.branch === 'HO';
      
      let computedTree: TreeDataNode[] = [];
      
      if (isHeadOffice) {
        // For HO users, create structure: HO > Other Branches
        const directReports = hierarchy.filter(node => node.reports_to === currentUserNode.email);
        const branchGroups: Record<string, HierarchyNode[]> = {};
        
        directReports.forEach(node => {
          const branch = node.branch || 'Other';
          if (!branchGroups[branch]) {
            branchGroups[branch] = [];
          }
          branchGroups[branch].push(node);
        });

        // Create branch nodes
        const branchNodes: TreeDataNode[] = Object.entries(branchGroups).map(([branch, managers]) => {
          return {
            label: branch,
            value: `branch-${branch}`,
            children: managers.map(manager => {
              const employeeId = manager.username.replace('SKY', '');
              const displayName = `${manager.first_name} ${employeeId}`;
              
              return {
                label: displayName,
                value: manager.email,
                children: buildTreeForNode(manager.email)
              };
            })
          };
        });

        // Create HO parent node
        const currentUserEmployeeId = currentUserNode.username.replace('SKY', '');
        const currentUserDisplayName = `${currentUserNode.first_name} ${currentUserEmployeeId}`;
        
        computedTree = [
          {
            label: 'HO',
            value: 'branch-HO',
            children: [
              {
                label: currentUserDisplayName,
                value: currentUserNode.email,
                children: branchNodes
              }
            ]
          }
        ];
      } else {
        // For non-HO users (branch managers)
        const currentUserEmployeeId = currentUserNode.username.replace('SKY', '');
        const currentUserDisplayName = `${currentUserNode.first_name} ${currentUserEmployeeId}`;
        
        computedTree = [
          {
            label: currentUserNode.branch,
            value: `branch-${currentUserNode.branch}`,
            children: [
              {
                label: currentUserDisplayName,
                value: currentUserNode.email,
                children: buildTreeForNode(currentUserNode.email)
              }
            ]
          }
        ];
      }
      
      setHierarchyTreeData(computedTree);
      return computedTree;
    } catch (error) {
      console.error('Error parsing hierarchy:', error);
      setHierarchyTreeData([]);
      return [];
    }
  }, [user?.hierarchy, user?.email, setHierarchyTreeData]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  // Mobile Navigation Items
  const mobileNavItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Users, label: 'Clients', href: '/' },
    { 
      icon: LogOut, 
      label: 'Logout', 
      onClick: handleLogout,
      className: 'text-red-600 hover:text-red-700'
    },
  ];

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col w-full">
        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Slide-out Menu */}
            <div className="lg:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <nav className="p-4 space-y-2">
                {mobileNavItems.map((item) => {
                  if (item.onClick) {
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.onClick?.();
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left ${item.className || ''}`}
                      >
                        <item.icon size={20} className={item.className?.includes('red') ? 'text-red-600' : 'text-gray-600'} />
                        <span className={item.className?.includes('red') ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}>{item.label}</span>
                      </button>
                    );
                  }
                  
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon size={20} className="text-gray-600" />
                      <span className="text-gray-900 font-medium">{item.label}</span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </>
        )}

        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden lg:block">
          <Header hierarchyTreeData={hierarchyTreeData} />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-0.5 lg:p-6 pb-16 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation - Compact and Fixed */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
          <nav className="flex items-center justify-around px-1 py-1.5">
            {mobileNavItems.map((item) => {
              if (item.onClick) {
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-w-0 flex-1 ${item.className || ''}`}
                  >
                    <item.icon 
                      size={18} 
                      className={item.className?.includes('red') ? 'text-red-600' : 'text-gray-600'} 
                    />
                    <span className={`text-[10px] truncate ${item.className?.includes('red') ? 'text-red-600' : 'text-gray-600'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              }
              
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors min-w-0 flex-1"
                >
                  <item.icon size={18} className="text-gray-600" />
                  <span className="text-[10px] text-gray-600 truncate">{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

// Main Layout component with providers
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <FilterProvider>
        <LayoutContent>{children}</LayoutContent>
      </FilterProvider>
    </SidebarProvider>
  );
};

export default Layout;