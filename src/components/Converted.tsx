import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, User, PhoneIcon, MessageCircle,
  Check, Wifi, WifiOff,
  Clock, ChevronsUpDown, ArrowUpDown, ChevronDown,
  MoreVertical, RefreshCw, CalendarCheck, PhoneMissed, CheckSquare,
  Building2, Search, Filter, TrendingUp, BookText
} from 'lucide-react';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tooltip } from '@radix-ui/react-tooltip';

// Import the actual useAuth hook
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/contexts/LeadContext';
import { type Lead, clearAllCache } from '@/utils/crm';
import { SummaryCard } from './SummaryCard';
import { AddLeadDialog } from './AddLeadDialog';
import CommentModal from '@/components/CRM/CommentModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import shadcn table components
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import combobox components
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Import Refactored Components
import {
  CampaignFilter,
  SourceFilter,
  AssignedUserFilter,
  statusOptions,
  getStatusColor
} from './Filters';
import { DashboardTable } from './DashboardTable';
import {
  MobileHeader,
  MobileSearchBar,
  MobileFilterPanel,
  MobileFiltersModal,
  MobileColumnVisibilityModal,
  MobileMenu,
  MobileLeadList,
  SummaryData
} from './MobileView';

// Rate limiting constants
const REFRESH_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes in milliseconds

// Custom filter functions for TanStack Table
const globalFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
  const search = filterValue.toLowerCase();
  const lead = row.original;

  return (
    lead.name?.toLowerCase().includes(search) ||
    lead.company?.toLowerCase().includes(search) ||
    lead.email?.toLowerCase().includes(search) ||
    lead.phone?.toLowerCase().includes(search) ||
    lead.city?.toLowerCase().includes(search) ||
    lead.source?.toLowerCase().includes(search) ||
    lead.campaign?.toLowerCase().includes(search) ||
    lead.status?.toLowerCase().includes(search) ||
    false
  );
};

const statusFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
  if (filterValue === 'all' || !filterValue) return true;
  return row.original.status === filterValue;
};

const campaignFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  const campaign = row.original.campaign || '';
  return campaign.toLowerCase().includes(filterValue.toLowerCase());
};

const assignedUserFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
  if (!filterValue || filterValue === 'all') return true;
  const assignData = row.original._assign as string;
  try {
    const assignedUsers = JSON.parse(assignData || "[]") as string[];
    return assignedUsers.some(user =>
      user.toLowerCase().includes(filterValue.toLowerCase())
    );
  } catch {
    return false;
  }
};

const Converted: React.FC = () => {
  const { user } = useAuth();
  const { leads, isLoading: isLeadsLoading, isRefreshing: isLeadsRefreshing, refreshLeads, updateLead } = useLeads();
  const navigate = useNavigate();

  // Map context state to local names
  const isInitialLoading = isLeadsLoading;
  const isManualRefreshing = isLeadsRefreshing;

  // Local UI State
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedLeadForComment, setSelectedLeadForComment] = useState<Lead | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Refresh interval state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(120000); // 2 minutes default

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Missing states for filters and refresh
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedAssignedUser, setSelectedAssignedUser] = useState('all');
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [canRefresh, setCanRefresh] = useState(true);

  // Helper functions for cooldown
  const formatCooldownTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCooldownRemaining = () => {
    if (!lastRefreshTime) return 0;
    const timeSinceLastRefresh = Date.now() - lastRefreshTime;
    return Math.max(0, REFRESH_COOLDOWN_MS - timeSinceLastRefresh);
  };


  // Mobile menu states
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileColumnVisibilityOpen, setMobileColumnVisibilityOpen] = useState(false);

  const handleRateLimitedRefresh = async () => {
    if (!canRefresh) return;

    setCanRefresh(false);
    setCooldownRemaining(REFRESH_COOLDOWN_MS / 1000);

    try {
      await handleClearCacheAndRefresh();
    } finally {
      // Start cooldown timer
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);

      cooldownIntervalRef.current = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
            setCanRefresh(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(() => {
        if (canRefresh && !isLeadsRefreshing) {
          handleRateLimitedRefresh();
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, canRefresh, isLeadsRefreshing]);

  // Column Visibility State with Local Storage
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedVisibility = localStorage.getItem('crm-clients-column-visibility');
        if (savedVisibility) {
          return JSON.parse(savedVisibility);
        }
      } catch (error) {
        console.error('Error loading column visibility from localStorage:', error);
      }
    }
    return {
      other_brokers: false // Default if nothing in localStorage
    };
  });

  // Persist column visibility
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('crm-clients-column-visibility', JSON.stringify(columnVisibility));
      } catch (error) {
        console.error('Error saving column visibility to localStorage:', error);
      }
    }
  }, [columnVisibility]);

  const handleClearCacheAndRefresh = async () => {
    try {
      await refreshLeads();
    } catch (err) {
      console.error("Failed to refresh leads:", err);
    }
  };

  const [rowSelection, setRowSelection] = useState({});


  // Get actual user credentials from auth context
  const employeeId = user?.employeeId || '';
  const email = user?.email || '';

  // Helper function to get display name from email
  const getDisplayName = (email: string) => {
    if (email === 'all') return 'All Users';
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part =>
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  // Comment functions
  const openCommentModal = (lead: Lead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLeadForComment(lead);
    setNewComment('');
    setIsCommentModalOpen(true);
  };

  const postComment = React.useCallback(async () => {
    if (!selectedLeadForComment || !newComment.trim()) return;

    setIsPostingComment(true);
    try {
      const response = await fetch('https://n8n.gopocket.in/webhook/hrms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'postcomments',
          employeeId: employeeId,
          email: email,
          leadid: selectedLeadForComment.id,
          content: newComment.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to post comment: ${response.status}`);
      }

      setNewComment('');
      setIsCommentModalOpen(false);
      handleClearCacheAndRefresh();

    } catch (error: any) {
      console.error('Error posting comment:', error);
      setError(`Failed to post comment: ${error.message}`);
    } finally {
      setIsPostingComment(false);
    }
  }, [selectedLeadForComment, newComment, employeeId, email]);

  const closeCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedLeadForComment(null);
    setNewComment('');
  };

  // Get unique campaigns and assigned users
  const campaignOptions = useMemo(() => {
    const campaigns = Array.from(new Set(
      leads
        .map(lead => lead.campaign)
        .filter(Boolean)
        .sort()
    )).map(campaign => ({
      value: campaign,
      label: campaign
    }));

    return [{ value: 'all', label: 'All Campaigns' }, ...campaigns];
  }, [leads]);

  const sourceOptions = useMemo(() => {
    const source = Array.from(new Set(
      leads
        .map(lead => lead.source)
        .filter(Boolean)
        .sort()
    )).map(source => ({
      value: source,
      label: source
    }));

    return [{ value: 'all', label: 'All Source' }, ...source];
  }, [leads]);

  const assignedUserOptions = useMemo(() => {
    const users = new Set<string>();
    leads.forEach(lead => {
      try {
        const assignData = JSON.parse(lead._assign || "[]") as string[];
        assignData.forEach(user => {
          if (user !== "Administrator") {
            users.add(user);
          }
        });
      } catch (e) {
        // ignore parsing errors
      }
    });

    const userOptions = Array.from(users).sort().map(user => ({
      value: user,
      label: getDisplayName(user)
    }));

    return [{ value: 'all', label: 'All Users' }, ...userOptions];
  }, [leads]);

  // Column definitions
  const columns: ColumnDef<Lead>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="hidden lg:flex"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
          className="hidden lg:flex"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Lead Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {lead.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "ucc",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            UCC
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 hidden lg:block font-normal">
          {row.getValue("ucc") || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: "source",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Source
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 hidden lg:block font-normal">
          {row.getValue("source") || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: "campaign",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Campaign
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 hidden lg:block font-normal">
          {row.getValue("campaign") || 'N/A'}
        </div>
      ),
      filterFn: campaignFilterFn,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Contact
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <PhoneIcon size={14} className="text-gray-400" />
          <span className="text-sm text-gray-900 font-normal">{row.getValue("phone")}</span>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            City
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-gray-400" />
          <span className="text-sm text-gray-900 font-normal">{row.getValue("city") || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: "branchCode",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Branch
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 hidden lg:block font-normal">
          {row.original.branchCode || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: "other_brokers",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Other Brokers
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            <span className="text-sm text-gray-900 font-normal">{row.getValue("other_brokers") || 'N/A'}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const status = row.getValue("status") as Lead['status'];
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      },
      filterFn: statusFilterFn,
    },
    {
      accessorKey: "lastActivity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Last Modified
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 font-normal hidden lg:block">
          {row.getValue("lastActivity")}
        </div>
      ),
    },
    {
      accessorKey: "_comments",
      header: () => (
        <div className="font-medium text-sm text-gray-900 hidden lg:flex">
          Comment
        </div>
      ),
      cell: ({ row }) => {
        const commentsRaw = row.getValue("_comments") as string;

        let latestComment = null;
        let commentCount = 0;

        try {
          const commentsArray = JSON.parse(commentsRaw || "[]");
          if (Array.isArray(commentsArray) && commentsArray.length > 0) {
            latestComment = commentsArray[commentsArray.length - 1];
            commentCount = commentsArray.length;
          }
        } catch (e) {
          console.error("Invalid comments JSON", e);
        }

        return (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="truncate max-w-[160px] inline-block cursor-default text-sm text-gray-900 hover:bg-gray-50 px-2 py-1 rounded"
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle size={14} className="text-blue-400" />
                    <span>
                      {latestComment ? (
                        <span className="truncate">{latestComment.comment}</span>
                      ) : (
                        'No comments'
                      )}
                    </span>
                    {commentCount > 0 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
                        {commentCount}
                      </span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="center"
                sideOffset={6}
                className="bg-black text-white px-2 py-1 rounded-md shadow-md text-xs max-w-[200px] break-words"
              >
                {latestComment ? (
                  <>
                    <div className="font-medium">{latestComment.by}</div>
                    <div className="text-gray-300 text-xs mt-1">
                      Commented
                    </div>
                    <div className="mt-1">{latestComment.comment}</div>
                  </>
                ) : (
                  'No comments'
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "_assign",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Assigned To
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const assignData = row.getValue("_assign") as string;
        const users: string[] = JSON.parse(assignData || "[]");

        const emailRegex =
          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

        return (
          <div className="flex -space-x-2">
            {users
              .filter((user) => user && user !== "Administrator")
              .map((user, index) => {
                const match = user.match(emailRegex);
                const email = match ? match[0] : user;
                const firstLetter =
                  (user && user.charAt(0).toUpperCase()) || "?";

                return (
                  <TooltipProvider key={index} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium border-2 border-white cursor-pointer"
                        >
                          {firstLetter}
                        </div>
                      </TooltipTrigger>

                      <TooltipContent
                        side="right"
                        align="start"
                        sideOffset={12}
                        className="bg-black text-white px-2 py-2 rounded-md shadow-md text-xs"
                      >
                        {email}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
          </div>
        );
      },
      filterFn: assignedUserFilterFn,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50"
          >
            Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return (
          <div className="hidden lg:block">
            <p className="text-sm text-gray-900 font-normal">{date.toLocaleDateString('en-GB')}</p>
            {row.original.firstRespondedOn && (
              <p className="text-xs text-gray-500 mt-0.5">
                First response: {new Date(row.original.firstRespondedOn).toLocaleDateString()}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === lead.id ? null : lead.id);
                }}
                disabled={isChangingStatus === lead.id}
              >
                {isChangingStatus === lead.id ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <MoreVertical size={16} />
                )}
              </button>

              {openDropdown === lead.id && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1 hidden lg:block">
                  <button
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCommentModal(lead, e);
                      setOpenDropdown(null);
                    }}
                  >
                    <MessageCircle size={14} className="text-blue-500" />
                    <span className="font-normal">Add Comment</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      },
      enableHiding: false,
    },
  ];

  // Filter leads to only include 'won'
  const filteredLeads = useMemo(() => {
    return leads.filter(lead =>
      ['won'].includes(lead.status)
    );
  }, [leads]);

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredLeads,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
  });

  // Apply filters
  useEffect(() => {
    if (selectedCampaign && selectedCampaign !== 'all') {
      table.getColumn('campaign')?.setFilterValue(selectedCampaign);
    } else {
      table.getColumn('campaign')?.setFilterValue('');
    }
  }, [selectedCampaign, table]);

  useEffect(() => {
    if (selectedSource && selectedSource !== 'all') {
      table.getColumn('source')?.setFilterValue(selectedSource);
    } else {
      table.getColumn('source')?.setFilterValue('');
    }
  }, [selectedSource, table]);

  useEffect(() => {
    if (selectedAssignedUser && selectedAssignedUser !== 'all') {
      table.getColumn('_assign')?.setFilterValue(selectedAssignedUser);
    } else {
      table.getColumn('_assign')?.setFilterValue('');
    }
  }, [selectedAssignedUser, table]);



  const changeLeadStatus = async (leadId: string, newStatus: string, leadName: string) => {
    setIsChangingStatus(leadId);
    setOpenDropdown(null);

    try {
      const response = await fetch('https://n8n.gopocket.in/webhook/hrms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'Statuschange',
          name: leadName,
          status: newStatus,
          leadId: leadId,
          employeeId: employeeId,
          email: email,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const leadToUpdate = leads.find(l => l.id === leadId);
      if (leadToUpdate) {
        updateLead({ ...leadToUpdate, status: newStatus as Lead['status'] });
      }

    } catch (error: any) {
      console.error('Error changing lead status:', error);
      setError(`Failed to change status: ${error.message}`);
    } finally {
      setIsChangingStatus(null);
      setOpenDropdown(null);
      handleClearCacheAndRefresh();
    }
  };

  const summaryData = useMemo(() => {
    if (isInitialLoading) {
      return {
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        followup: 0,
        qualifiedLeads: 0,
        wonleads: 0,
        totalValue: 0,
        conversionRate: 0,
        firstTradedClients: 0,
        notinterested: 0,
        existingclient: 0,
        rnr: 0,
        switchoff: 0,
        callback: 0,
        won: 0,
      };
    }
    // Get filtered leads from table
    const currentLeads = table.getFilteredRowModel().rows.map(row => row.original);

    // Calculate summary from filtered leads
    return {
      totalLeads: leads.length,
      newLeads: currentLeads.filter(lead => lead.status === 'new').length,
      contactedLeads: currentLeads.filter(lead => lead.status === 'Contacted').length,
      followup: currentLeads.filter(lead => lead.status === 'followup').length,
      wonleads: currentLeads.filter(lead => lead.status === 'won').length,
      qualifiedLeads: currentLeads.filter(lead => lead.status === 'qualified').length,
      totalValue: currentLeads.reduce((sum, lead) => sum + lead.value, 0),
      firstTradedClients: currentLeads.filter(lead => lead.tradeDone === "TRUE").length,
      conversionRate: Math.round((currentLeads.filter(lead => ['qualified', 'negotiation', 'won'].includes(lead.status)).length / Math.max(currentLeads.length, 1)) * 100),
      notinterested: currentLeads.filter(lead => lead.status === 'Not Interested').length,
      existingclient: currentLeads.filter(lead => lead.status === 'won').length,
      rnr: currentLeads.filter(lead => lead.status === 'RNR').length,
      switchoff: currentLeads.filter(lead => lead.status === 'Switch off').length,
      callback: currentLeads.filter(lead => lead.status === 'Call Back').length,
      won: currentLeads.filter(lead => lead.status === 'won').length,
    };
  }, [leads, isInitialLoading, columnFilters, globalFilter, table]);

  const handleLeadAdded = async () => {
    await handleClearCacheAndRefresh();
  };

  const toggleDropdown = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === leadId ? null : leadId);
  };

  const handleLeadClick = (leadId: string) => {
    if (table.getFilteredSelectedRowModel().rows.length === 0) {
      navigate(`/crm/leads/${leadId}`);
    }
  };

  const RefreshButton = () => {
    const isRefreshing = isManualRefreshing;
    const isDisabled = !canRefresh || isRefreshing || isInitialLoading;

    let buttonContent;
    if (isRefreshing) {
      buttonContent = (
        <>
          <RefreshCw size={16} className="animate-spin" />
          Refreshing...
        </>
      );
    } else if (!canRefresh && cooldownRemaining > 0) {
      buttonContent = (
        <>
          <Clock size={16} />
          {formatCooldownTime(cooldownRemaining)}
        </>
      );
    } else {
      buttonContent = (
        <>
          <RefreshCw size={16} />
          Refresh
        </>
      );
    }

    return (
      <button
        onClick={handleRateLimitedRefresh}
        disabled={isDisabled}
        className="px-4 py-2 text-gray-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed relative group shadow-sm hover:shadow-md"
        title={!canRefresh ? `Available in ${formatCooldownTime(cooldownRemaining)}` : 'Refresh leads'}
      >
        {buttonContent}

        {!canRefresh && cooldownRemaining > 0 && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg z-10">
            Available in {formatCooldownTime(cooldownRemaining)}
          </div>
        )}
      </button>
    );
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatName = (name = "") => {
    return name
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('.');
  };

  return (
    <div className="">
      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={closeCommentModal}
        lead={selectedLeadForComment}
        comment={newComment}
        onCommentChange={setNewComment}
        onPostComment={postComment}
        isPosting={isPostingComment}
      />

      {/* Mobile Header */}
      <MobileHeader setMobileMenuOpen={setMobileMenuOpen} summaryData={summaryData} />


      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards - Responsive Grid - Hidden on mobile */}
      <div className="hidden lg:grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">

        <SummaryCard
          title="Total Converted Leads" value={summaryData.wonleads} icon={User} color="blue" shadowColor="blue" trend={{ value: 8.2, isPositive: true }} showTrend={true} className="h-full" />

        <SummaryCard
          title="First Traded Clients" value={summaryData.firstTradedClients} icon={BookText} color="blue" shadowColor="blue" trend={{ value: 22.1, isPositive: true }}
          showTrend={true} className="h-full" />

        <SummaryCard
          title="Payin Done Clients" value={summaryData.followup} icon={CalendarCheck} color="blue" shadowColor="blue" trend={{ value: 22.1, isPositive: true }}
          showTrend={true} className="h-full" />

        <SummaryCard
          title="Conversion Rate" value={summaryData.conversionRate} icon={TrendingUp} color="red" shadowColor="red" trend={{ value: 5.7, isPositive: true }}
          showTrend={true} suffix="%" className="h-full" />
      </div>

      {/* Mobile Search */}
      <MobileSearchBar globalFilter={globalFilter} setGlobalFilter={setGlobalFilter} />

      {/* Mobile Filter Panel */}
      <MobileFilterPanel
        setMobileFilterOpen={setMobileFilterOpen}
        setMobileColumnVisibilityOpen={setMobileColumnVisibilityOpen}
        selectedCampaign={selectedCampaign}
        setSelectedCampaign={setSelectedCampaign}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        selectedAssignedUser={selectedAssignedUser}
        setSelectedAssignedUser={setSelectedAssignedUser}
        table={table}
        campaignOptions={campaignOptions}
        sourceOptions={sourceOptions}
        assignedUserOptions={assignedUserOptions}
      />

      {/* Mobile Modals */}
      <MobileFiltersModal
        mobileFilterOpen={mobileFilterOpen}
        setMobileFilterOpen={setMobileFilterOpen}
        selectedCampaign={selectedCampaign}
        setSelectedCampaign={setSelectedCampaign}
        selectedAssignedUser={selectedAssignedUser}
        setSelectedAssignedUser={setSelectedAssignedUser}
        table={table}
        campaignOptions={campaignOptions}
        assignedUserOptions={assignedUserOptions}
      />
      <MobileColumnVisibilityModal
        mobileColumnVisibilityOpen={mobileColumnVisibilityOpen}
        setMobileColumnVisibilityOpen={setMobileColumnVisibilityOpen}
        table={table}
      />

      {/* Desktop Filters */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search all leads..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3"
              />
            </div>

            {/* Campaign Filter */}
            <CampaignFilter
              value={selectedCampaign}
              onChange={setSelectedCampaign}
              options={campaignOptions}
            />

            {/* Source Filter */}
            <SourceFilter
              value={selectedSource}
              onChange={setSelectedSource}
              options={sourceOptions}
            />

            {/* Assigned User Filter */}
            <AssignedUserFilter
              value={selectedAssignedUser}
              onChange={setSelectedAssignedUser}
              options={assignedUserOptions}
            />

            {/* Status Filter using TanStack Table */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="px-4 py-3">
                  <Filter className="mr-2 h-4 w-4" />
                  Status: {table.getColumn('status')?.getFilterValue() ?
                    statusOptions.find(s => s.value === table.getColumn('status')?.getFilterValue())?.label :
                    'All'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={!table.getColumn('status')?.getFilterValue()}
                  onCheckedChange={() => table.getColumn('status')?.setFilterValue('')}
                >
                  All Status
                </DropdownMenuCheckboxItem>
                {statusOptions.filter(s => ['won', 'client'].includes(s.value)).map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.value}
                    checked={table.getColumn('status')?.getFilterValue() === status.value}
                    onCheckedChange={() => {
                      table.getColumn('status')?.setFilterValue(
                        table.getColumn('status')?.getFilterValue() === status.value ? '' : status.value
                      );
                    }}
                  >
                    {status.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex gap-2">
            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Leads Table/List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Mobile View with TanStack Table */}
        <MobileLeadList
          isInitialLoading={isInitialLoading}
          leads={leads}
          table={table}
          handleLeadClick={handleLeadClick}
          toggleDropdown={toggleDropdown}
          isChangingStatus={isChangingStatus}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          changeLeadStatus={changeLeadStatus}
        />

        {/* Desktop View with TanStack Table */}
        <DashboardTable
          table={table}
          leads={leads}
          isInitialLoading={isInitialLoading}
          handleLeadClick={handleLeadClick}
        />
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        handleClearCacheAndRefresh={handleClearCacheAndRefresh}
        onLeadAdded={handleLeadAdded}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
      />
    </div>
  );
};

export default Converted;