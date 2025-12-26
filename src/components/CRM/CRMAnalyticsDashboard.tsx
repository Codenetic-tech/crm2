// pages/CRMAnalyticsDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, User, BookText, CalendarCheck, CheckSquare, TrendingUp, BarChart3, Activity, RefreshCw, Wifi, WifiOff, Download, Filter, ChevronsUpDown, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/contexts/LeadContext';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckTreePicker } from 'rsuite';
import 'rsuite/CheckTreePicker/styles/index.css';
import { useFilter } from '@/contexts/FilterContext';
import CampaignLeadSourceChart from './CampaignLeadSourceChart';
import LeadStatusSankeyChart from './Lead Details/LeadStatusSankeyChart';
import RMWiseReport from './RMWiseReport';

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

const normalizeString = (str: string) => (str || '').toLowerCase().replace(/\s+/g, '');

const CRMAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { leads, isLoading: isLeadsLoading, refreshLeads } = useLeads();

  // Map context state to local names
  const isInitialLoading = isLeadsLoading;
  const isAutoRefreshing = false; // Analytics doesn't auto-refresh locally anymore
  const error = null; // Context handles errors conceptually, or we can expose it later

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedAssignedUser, setSelectedAssignedUser] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const { selectedHierarchy, setSelectedHierarchy, dateRange } = useFilter(); // Get from context

  // Combobox states
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [assignedUserOpen, setAssignedUserOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);

  const employeeId = user?.employeeId || '';
  const email = user?.email || '';
  // Removed autoRefreshTimeoutRef since we rely on context or manual refresh

  // Build hierarchy tree data grouped by branch
  const hierarchyTreeData = React.useMemo(() => {
    if (!user?.hierarchy) return [];

    try {
      const hierarchy: HierarchyNode[] = JSON.parse(user.hierarchy);

      // Find the current user (hierarchy_level: 0)
      const currentUserNode = hierarchy.find(node => node.hierarchy_level === 0);
      if (!currentUserNode) return [];

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

      if (isHeadOffice) {
        // For HO users, create structure: HO > Other Branches
        // Group all direct reports by their branches
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

        // Create HO parent node with current user and all branch nodes
        const currentUserEmployeeId = currentUserNode.username.replace('SKY', '');
        const currentUserDisplayName = `${currentUserNode.first_name} ${currentUserEmployeeId}`;

        return [
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
        // For non-HO users (branch managers), show their branch structure
        const branchNodes = hierarchy.filter(node => node.branch === currentUserNode.branch);

        const currentUserEmployeeId = currentUserNode.username.replace('SKY', '');
        const currentUserDisplayName = `${currentUserNode.first_name} ${currentUserEmployeeId}`;

        return [
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
    } catch (error) {
      console.error('Error parsing hierarchy:', error);
      return [];
    }
  }, [user?.hierarchy, user?.email]);

  // Fetching logic removed - controlled by LeadContext

  // Get unique campaigns from leads - Normalized to handle spaces/casing
  const campaigns = React.useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const normalizedMap = new Map<string, string>(); // normalized -> original display name

    safeLeads.forEach(lead => {
      const name = lead.campaign || 'Uncategorized';
      const normalized = normalizeString(name);
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, name);
      }
    });

    const campaignList = Array.from(normalizedMap.values()).sort();
    return ['all', ...campaignList];
  }, [leads]);

  // Get unique assigned users from leads
  const assignedUsers = React.useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const userSet = new Set<string>();

    safeLeads.forEach(lead => {
      if (lead._assign) {
        try {
          const assignArray = JSON.parse(lead._assign);
          if (Array.isArray(assignArray)) {
            assignArray.forEach(user => {
              if (user && typeof user === 'string') {
                // Filter out the specific email if needed, or show all
                if (user !== "gokul.krishna.687@gopocket.in") {
                  userSet.add(user);
                }
              }
            });
          }
        } catch (error) {
          console.error('Error parsing _assign:', error);
        }
      }
    });

    const userList = Array.from(userSet).sort();
    return ['all', ...userList];
  }, [leads]);

  // Get unique sources from leads - Normalized to handle spaces/casing
  const sources = React.useMemo(() => {
    const safeLeads = Array.isArray(leads) ? leads : [];
    const normalizedMap = new Map<string, string>();

    safeLeads.forEach(lead => {
      const name = lead.source || 'Unknown';
      const normalized = normalizeString(name);
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, name);
      }
    });

    const sourceList = Array.from(normalizedMap.values()).sort();
    return ['all', ...sourceList];
  }, [leads]);

  // Helper function to get all emails under selected branches and individuals
  const getSelectedEmails = React.useMemo(() => {
    if (selectedHierarchy.length === 0) return [];

    const emailSet = new Set<string>();

    // Function to recursively collect all emails from a tree node
    const collectEmails = (node: TreeDataNode) => {
      if (!node.value.startsWith('branch-')) {
        emailSet.add(node.value);
      }
      if (node.children) {
        node.children.forEach(child => collectEmails(child));
      }
    };

    // Function to recursively search for a node in the tree
    const findNodeInTree = (nodes: TreeDataNode[], targetValue: string): TreeDataNode | null => {
      for (const node of nodes) {
        if (node.value === targetValue) {
          return node;
        }
        if (node.children) {
          const found = findNodeInTree(node.children, targetValue);
          if (found) return found;
        }
      }
      return null;
    };

    selectedHierarchy.forEach(selectedValue => {
      if (selectedValue.startsWith('branch-')) {
        // Find the branch node anywhere in the tree (could be nested)
        const branchNode = findNodeInTree(hierarchyTreeData, selectedValue);
        if (branchNode) {
          collectEmails(branchNode);
        }
      } else {
        // Direct email selection
        emailSet.add(selectedValue);

        // Find this email node and collect all children
        const emailNode = findNodeInTree(hierarchyTreeData, selectedValue);
        if (emailNode) {
          collectEmails(emailNode);
        }
      }
    });

    return Array.from(emailSet);
  }, [selectedHierarchy, hierarchyTreeData]);

  // Filter leads by selected campaign, assigned user, hierarchy, and source
  const filteredLeads = React.useMemo(() => {
    let filtered = leads;

    // Filter by campaign - uses normalized comparison
    if (selectedCampaign !== 'all') {
      const normalizedSelected = normalizeString(selectedCampaign);
      filtered = filtered.filter(lead =>
        normalizeString(lead.campaign || 'Uncategorized') === normalizedSelected
      );
    }

    // Filter by assigned user
    if (selectedAssignedUser !== 'all') {
      filtered = filtered.filter(lead => {
        if (!lead._assign) return false;

        try {
          const assignArray = JSON.parse(lead._assign);
          return Array.isArray(assignArray) && assignArray.includes(selectedAssignedUser);
        } catch (error) {
          console.error('Error parsing _assign for filtering:', error);
          return false;
        }
      });
    }

    // Filter by source - uses normalized comparison
    if (selectedSource !== 'all') {
      const normalizedSelected = normalizeString(selectedSource);
      filtered = filtered.filter(lead =>
        normalizeString(lead.source || 'Unknown') === normalizedSelected
      );
    }

    // Filter by hierarchy - use expanded email list
    if (getSelectedEmails.length > 0) {
      filtered = filtered.filter(lead => {
        if (!lead._assign) return false;

        try {
          const assignArray = JSON.parse(lead._assign);
          return Array.isArray(assignArray) && assignArray.some(user => getSelectedEmails.includes(user));
        } catch (error) {
          console.error('Error parsing _assign for hierarchy filtering:', error);
          return false;
        }
      });
    }

    return filtered;
  }, [leads, selectedCampaign, selectedAssignedUser, selectedSource, getSelectedEmails]);

  // Calculate status distribution with safe defaults
  const statusDistribution = React.useMemo(() => {
    const safeLeads = Array.isArray(filteredLeads) ? filteredLeads : [];

    const statusCounts = {
      new: 0,
      followup: 0,
      won: 0,
      'Not Interested': 0,
      'Call Back': 0,
      'Switch off': 0,
      'RNR': 0
    };

    safeLeads.forEach(lead => {
      if (lead && lead.status) {
        if (statusCounts.hasOwnProperty(lead.status)) {
          statusCounts[lead.status]++;
        }
      }
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      count
    }));
  }, [filteredLeads]);

  // Calculate source distribution with safe defaults
  const sourceDistribution = React.useMemo(() => {
    const safeLeads = Array.isArray(filteredLeads) ? filteredLeads : [];
    const sourceCounts: Record<string, number> = {};

    safeLeads.forEach(lead => {
      if (lead && lead.source) {
        const source = lead.source || 'Unknown';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      }
    });

    return Object.entries(sourceCounts).map(([source, count]) => ({
      name: source,
      value: count,
      count
    }));
  }, [filteredLeads]);

  // Calculate summary data with safe defaults
  const summaryData = React.useMemo(() => {
    const safeLeads = Array.isArray(filteredLeads) ? filteredLeads : [];

    const totalLeads = safeLeads.length;
    const newLeads = safeLeads.filter(lead => lead?.status === 'new').length;
    const followup = safeLeads.filter(lead => lead?.status === 'followup').length;
    const wonLeads = safeLeads.filter(lead => lead?.status === 'won').length;
    const notInterested = safeLeads.filter(lead => lead?.status === 'Not Interested').length;
    const callBack = safeLeads.filter(lead => lead?.status === 'Call Back').length;
    const switchOff = safeLeads.filter(lead => lead?.status === 'Switch off').length;
    const rnr = safeLeads.filter(lead => lead?.status === 'RNR').length;

    const conversionRate = Math.round((safeLeads.filter(lead =>
      lead?.status && ['qualified', 'won'].includes(lead.status)
    ).length / Math.max(totalLeads, 1)) * 100);

    return {
      totalLeads,
      newLeads,
      followup,
      wonLeads,
      notInterested,
      callBack,
      switchOff,
      rnr,
      conversionRate
    };
  }, [filteredLeads]);

  // Performance chart data (leads by status)
  const performanceChartData = statusDistribution.map(item => ({
    name: item.name,
    leads: item.count,
    percentage: Math.round((item.count / Math.max(summaryData.totalLeads, 1)) * 100)
  }));

  // Custom bar chart label
  const renderCustomBarLabel = ({ x, y, width, value }: any) => {
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        fill="#374151"
        textAnchor="middle"
        fontSize={11}
        fontWeight="500"
      >
        {value > 1000 ? `${(value / 1000).toFixed(0)}K` : value}
      </text>
    );
  };

  // Status colors
  const statusColors = [
    "#3b82f6", // blue-500 - New
    "#f59e0b", // yellow-500 - Followup
    "#059669", // emerald-600 - Won
    "#dc2626", // red-600 - Not Interested
    "#f97316", // orange-500 - Call Back
    "#6b7280", // gray-500 - Switch off
    "#4f46e5", // indigo-600 - RNR
  ];

  const sourceColors = [
    "#3b82f6", // blue-500
    "#10b981", // green-500
    "#f59e0b", // yellow-500
    "#ef4444", // red-500
    "#8b5cf6", // purple-500
    "#06b6d4", // cyan-500
    "#f97316", // orange-500
  ];

  const handleClearCacheAndRefresh = async () => {
    if (!employeeId || !email) return;
    await refreshLeads();
  };

  // Helper function to get display name from email
  const getDisplayName = (email: string) => {
    if (email === 'all') return 'All Users';
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part =>
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  // Helper function to get display name from source
  const getSourceDisplayName = (source: string) => {
    if (source === 'all') return 'All Sources';
    return source;
  };

  // Get display value for campaign combobox
  const getCampaignDisplayValue = () => {
    if (selectedCampaign === 'all') return 'All Campaigns';
    return selectedCampaign;
  };

  // Get display value for assigned user combobox
  const getAssignedUserDisplayValue = () => {
    if (selectedAssignedUser === 'all') return 'All Users';
    return getDisplayName(selectedAssignedUser);
  };

  // Get display value for source combobox
  const getSourceDisplayValue = () => {
    if (selectedSource === 'all') return 'All Sources';
    return selectedSource;
  };

  // Handle hierarchy selection
  const handleHierarchyChange = (value: string[]) => {
    setSelectedHierarchy(value);
  };

  // Clear hierarchy filter
  const clearHierarchyFilter = () => {
    setSelectedHierarchy([]);
  };

  // Get count of selected individuals (excluding branches)
  const getSelectedIndividualsCount = () => {
    return selectedHierarchy.filter(value => !value.startsWith('branch-')).length;
  };

  return (
    <div className="min-h-screen ml-[30px]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Campaign Filter - Searchable Combobox */}
          <div className="flex items-center gap-2">
            <Popover open={campaignOpen} onOpenChange={setCampaignOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={campaignOpen}
                  className="w-[220px] justify-between bg-white border-slate-300 rounded-xl shadow-sm hover:bg-slate-50"
                >
                  {getCampaignDisplayValue()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0 max-h-90 overflow-hidden">
                <Command className="max-h-90">
                  <CommandInput placeholder="Search campaigns..." className="h-9" />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty>No campaign found.</CommandEmpty>
                    <CommandGroup>
                      {campaigns.map((campaign) => (
                        <CommandItem
                          key={campaign}
                          value={campaign}
                          onSelect={() => {
                            setSelectedCampaign(campaign === selectedCampaign ? "all" : campaign);
                            setCampaignOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCampaign === campaign ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {campaign === 'all' ? 'All Campaigns' : campaign}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Source Filter - Searchable Combobox */}
          <div className="flex items-center gap-2">
            <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={sourceOpen}
                  className="w-[200px] justify-between bg-white border-slate-300 rounded-xl shadow-sm hover:bg-slate-50"
                >
                  {getSourceDisplayValue()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 max-h-90 overflow-hidden">
                <Command className="max-h-90">
                  <CommandInput placeholder="Search sources..." className="h-9" />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty>No source found.</CommandEmpty>
                    <CommandGroup>
                      {sources.map((source) => (
                        <CommandItem
                          key={source}
                          value={source}
                          onSelect={() => {
                            setSelectedSource(source === selectedSource ? "all" : source);
                            setSourceOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSource === source ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {source === 'all' ? 'All Sources' : source}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Assigned User Filter - Searchable Combobox */}
          {/* <div className="flex items-center gap-2">
            <Popover open={assignedUserOpen} onOpenChange={setAssignedUserOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assignedUserOpen}
                  className="w-[280px] justify-between bg-white border-slate-300 rounded-xl shadow-sm hover:bg-slate-50"
                >
                  {getAssignedUserDisplayValue()}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 max-h-90 overflow-hidden">
                <Command className="max-h-90">
                  <CommandInput placeholder="Search users..." className="h-9" />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {assignedUsers.map((user) => (
                        <CommandItem
                          key={user}
                          value={user}
                          onSelect={(currentValue) => {
                            setSelectedAssignedUser(currentValue === selectedAssignedUser ? "all" : currentValue);
                            setAssignedUserOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAssignedUser === user ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {getDisplayName(user)}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div> */}

          <button
            onClick={handleClearCacheAndRefresh}
            disabled={isInitialLoading}
            className="px-4 py-2 text-slate-700 bg-white rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md"
          >
            <RefreshCw size={18} className={isInitialLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>


      {/* Charts Row - Only show when data is loaded and has leads */}
      {!isInitialLoading && Array.isArray(leads) && leads.length > 0 && (
        <>
          {/* First Row: 3-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* First Column: Lead Status Distribution Pie Chart */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Lead Status Distribution
                    {(selectedCampaign !== 'all' || selectedAssignedUser !== 'all' || selectedSource !== 'all') && (
                      <span className="text-sm font-normal text-blue-600 ml-2">
                        ({selectedCampaign !== 'all' ? selectedCampaign : 'All Campaigns'}
                        {selectedAssignedUser !== 'all' ? ` • ${getDisplayName(selectedAssignedUser)}` : ''}
                        {selectedSource !== 'all' ? ` • ${selectedSource}` : ''})
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">Breakdown of leads by current status</p>
                </div>
              </div>

              <div className="relative">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={statusColors[index % statusColors.length]}
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="hover:opacity-80 cursor-pointer transition-opacity duration-200"
                        />
                      ))}
                    </Pie>

                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      className="text-2xl font-bold fill-gray-900"
                    >
                      {summaryData.totalLeads}
                    </text>
                    <text
                      x="50%"
                      y="55%"
                      textAnchor="middle"
                      className="text-sm fill-gray-500"
                    >
                      Total Leads
                    </text>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #ffffffff',
                        borderRadius: '0.75rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '0.3rem'
                      }}
                      itemStyle={{
                        color: '#1f2937',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                      labelStyle={{
                        color: '#111827',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                      formatter={(value, name, props) => {
                        const percentage = ((Number(value) / summaryData.totalLeads) * 100).toFixed(1);
                        return [
                          <div key="value" className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: props.color }}
                            />
                            <span className="font-semibold text-gray-900">
                              {name} : {value} leads
                            </span>
                          </div>,
                          <div key="percentage" className="text-blue-600 font-semibold">
                            {percentage}%
                          </div>
                        ];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap gap-3 justify-center mt-6 pt-6 border-t border-gray-100">
                {statusDistribution.map((entry, index) => {
                  const percentage = ((entry.value / summaryData.totalLeads) * 100).toFixed(1);

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusColors[index % statusColors.length] }}
                      />
                      <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                      <span className="text-sm text-gray-500 font-medium">({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Second Column: Stacked Charts - Lead Performance and Lead Source Distribution */}
            <div className="flex flex-col gap-6">
              {/* Lead Performance Bar Chart */}
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      Lead Performance
                      {(selectedCampaign !== 'all' || selectedAssignedUser !== 'all' || selectedSource !== 'all') && (
                        <span className="text-sm font-normal text-blue-600">
                          ({selectedCampaign !== 'all' ? selectedCampaign : 'All Campaigns'}
                          {selectedAssignedUser !== 'all' ? ` • ${getDisplayName(selectedAssignedUser)}` : ''}
                          {selectedSource !== 'all' ? ` • ${selectedSource}` : ''})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">Leads distribution across status categories</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />

                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickFormatter={(value) => value > 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '0.75rem'
                      }}
                      formatter={(value, name) => {
                        const formattedValue = value.toLocaleString();

                        return [
                          <div key={name} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: '#3b82f6' }}
                            />
                            <span className="font-semibold text-gray-900">{formattedValue} leads</span>
                          </div>,
                          'Count'
                        ];
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconSize={10}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-xs font-medium text-gray-700 capitalize">{value}</span>
                      )}
                      wrapperStyle={{
                        paddingBottom: '1rem'
                      }}
                    />

                    <Bar
                      dataKey="leads"
                      name="leads"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                      label={renderCustomBarLabel}
                    />
                  </BarChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap gap-4 justify-center mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Leads Count</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-gray-700">Conversion Rate: {summaryData.conversionRate}%</span>
                  </div>
                </div>
              </div>

              {/* Lead Source Distribution */}
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Lead Source Distribution
                      {(selectedCampaign !== 'all' || selectedAssignedUser !== 'all' || selectedSource !== 'all') && (
                        <span className="text-sm font-normal text-blue-600 ml-2">
                          ({selectedCampaign !== 'all' ? selectedCampaign : 'All Campaigns'}
                          {selectedAssignedUser !== 'all' ? ` • ${getDisplayName(selectedAssignedUser)}` : ''}
                          {selectedSource !== 'all' ? ` • ${selectedSource}` : ''})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">Breakdown of leads by acquisition source</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sourceDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />

                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.75rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '0.75rem'
                      }}
                      formatter={(value, name, props) => {
                        const percentage = ((Number(value) / summaryData.totalLeads) * 100).toFixed(1);
                        return [
                          <div key="value" className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: sourceColors[props.payload.index % sourceColors.length] }}
                            />
                            <span className="font-semibold text-gray-900">
                              {value} leads
                            </span>
                          </div>,
                          <div key="percentage" className="text-blue-600 font-semibold">
                            {percentage}%
                          </div>
                        ];
                      }}
                    />

                    <Bar
                      dataKey="count"
                      name="leads"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    >
                      {sourceDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={sourceColors[index % sourceColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <CampaignLeadSourceChart leads={filteredLeads} />
          </div>

          {/* Second Row: 2-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Calendar (1 column) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl shadow-blue-50 p-6 border border-gray-100 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Calendar</h3>
                    <p className="text-sm text-gray-500">Schedule and track activities</p>
                  </div>
                  <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    <span className="text-sm font-semibold text-blue-700">
                      Today
                    </span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Activities</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-700">Team Meeting</span>
                      <span className="text-xs text-gray-500 ml-auto">10:00 AM</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-700">Client Call</span>
                      <span className="text-xs text-gray-500 ml-auto">2:30 PM</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-orange-50">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-sm text-gray-700">Follow-up</span>
                      <span className="text-xs text-gray-500 ml-auto">4:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sankey Chart (2 columns) */}
            <div className="lg:col-span-2">
              <LeadStatusSankeyChart leads={filteredLeads} />
            </div>
          </div>

          {/* Third Row: RM Wise Report */}
          <div className="mb-6">
            <RMWiseReport
              leads={filteredLeads}
              teamMembers={user?.team ? JSON.parse(user.team) : []}
            />
          </div>
        </>
      )}

      {/* Loading State */}
      {isInitialLoading && (
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-12 border border-gray-100 text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading CRM analytics data...</p>
        </div>
      )}

      {/* Empty State */}
      {!isInitialLoading && (!Array.isArray(leads) || leads.length === 0) && (
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-12 border border-gray-100 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Data</h3>
          <p className="text-gray-600">Start adding leads to see analytics and insights</p>
        </div>
      )}

      {/* Campaign/User/Source-specific empty state */}
      {!isInitialLoading && Array.isArray(leads) && leads.length > 0 && filteredLeads.length === 0 && (
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-12 border border-gray-100 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Match Filters</h3>
          <p className="text-gray-600 mb-4">
            No leads found for:
            {selectedCampaign !== 'all' && <strong> Campaign: {selectedCampaign}</strong>}
            {selectedCampaign !== 'all' && selectedAssignedUser !== 'all' && ' and '}
            {selectedAssignedUser !== 'all' && <strong> Assigned To: {getDisplayName(selectedAssignedUser)}</strong>}
            {selectedSource !== 'all' && <strong> Source: {selectedSource}</strong>}
          </p>
          <div className="flex gap-2 justify-center">
            {selectedCampaign !== 'all' && (
              <button
                onClick={() => setSelectedCampaign('all')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Campaigns
              </button>
            )}
            {selectedAssignedUser !== 'all' && (
              <button
                onClick={() => setSelectedAssignedUser('all')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Users
              </button>
            )}
            {selectedSource !== 'all' && (
              <button
                onClick={() => setSelectedSource('all')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                View All Sources
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMAnalyticsDashboard;