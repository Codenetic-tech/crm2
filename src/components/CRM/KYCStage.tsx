import React, { useState, useMemo, useEffect } from 'react';
import { useLeads } from '@/contexts/LeadContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    SortingState,
    ColumnFiltersState,
    VisibilityState,
    FilterFn
} from "@tanstack/react-table";
import { Lead } from '@/utils/crm';
import { DashboardTable } from '@/components/DashboardTable';
import { SummaryCard } from '@/components/SummaryCard';
import { CampaignFilter, SourceFilter, AssignedUserFilter, statusOptions, getStatusColor } from '@/components/Filters';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, PhoneIcon, ChevronDown, ArrowUpDown, Building2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Reuse filter functions
const globalFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
    const search = filterValue.toLowerCase();
    const lead = row.original;
    return (
        lead.name?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.phone?.toLowerCase().includes(search) ||
        lead.application?.toLowerCase().includes(search) ||
        false
    );
};

const campaignFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
    if (!filterValue || filterValue === 'all') return true;
    const campaign = row.original.campaign || '';
    return campaign.toLowerCase().includes(filterValue.toLowerCase());
};

const sourceFilterFn: FilterFn<Lead> = (row, columnId, filterValue: string) => {
    if (!filterValue || filterValue === 'all') return true;
    const source = row.original.source || '';
    return source.toLowerCase().includes(filterValue.toLowerCase());
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

export default function KYCStage() {
    const { leads, isLoading: isInitialLoading } = useLeads();
    const { user } = useAuth();

    // States
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // Filter controls
    const [selectedCampaign, setSelectedCampaign] = useState('all');
    const [selectedSource, setSelectedSource] = useState('all');
    const [selectedAssignedUser, setSelectedAssignedUser] = useState('all');

    // Filter KYC Leads
    const kycLeads = useMemo(() => {
        return leads.filter(lead => lead.stage === 'KYC Stage');
    }, [leads]);

    // Calculate Summary Data
    const summaryData = useMemo(() => {
        return {
            total: kycLeads.length,
            approved: kycLeads.filter(l => l.application_status?.toLowerCase() === 'approved').length,
            pending: kycLeads.filter(l => !l.application_status || l.application_status.toLowerCase() === 'pending').length,
            rejected: kycLeads.filter(l => l.application_status?.toLowerCase() === 'rejected').length,
        };
    }, [kycLeads]);

    // Helper for assigned user display
    const getDisplayName = (email: string) => {
        if (email === 'all') return 'All Users';
        const namePart = email.split('@')[0];
        return namePart.split('.').map(part =>
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
    };

    // Columns Definition
    const columns: ColumnDef<Lead>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button variant="ghost" className="-ml-4 h-8 data-[state=open]:bg-accent"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Lead Name</span> <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const lead = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{lead.name}</p>
                            <div className="text-xs text-gray-500">{lead.email}</div>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "source",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Source</span>,
            filterFn: sourceFilterFn,
            cell: ({ row }) => <span className="text-sm text-gray-600">{row.getValue("source") || '-'}</span>
        },
        {
            accessorKey: "campaign",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Campaign</span>,
            filterFn: campaignFilterFn,
            cell: ({ row }) => <span className="text-sm text-gray-600">{row.getValue("campaign") || '-'}</span>
        },
        {
            accessorKey: "phone",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Mobile</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <PhoneIcon size={14} className="text-gray-400" />
                    {row.getValue("phone")}
                </div>
            )
        },
        {
            accessorKey: "kyc_stage",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">KYC Stage</span>,
            cell: ({ row }) => (
                <div className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                    {row.getValue("kyc_stage") || 'N/A'}
                </div>
            )
        },
        {
            accessorKey: "status",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Lead Status</span>,
            filterFn: campaignFilterFn,
            cell: ({ row }) => {
                const status = row.getValue("status") as Lead['status'];
                return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                )
            },
        },
        {
            accessorKey: "application",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Application No</span>,
            cell: ({ row }) => (
                <div className="text-sm text-gray-700 font-mono">
                    {row.getValue("application") || 'N/A'}
                </div>
            )
        },
        {
            accessorKey: "application_status",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Application Status</span>,
            cell: ({ row }) => {
                const status = (row.getValue("application_status") as string || 'Pending').toLowerCase();
                let colorClass = 'bg-gray-100 text-gray-800';
                if (status === 'approved') colorClass = 'bg-green-100 text-green-800';
                if (status === 'rejected') colorClass = 'bg-red-100 text-red-800';
                if (status === 'pending') colorClass = 'bg-yellow-100 text-yellow-800';

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            accessorKey: "application_created_date",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Created Date</span>,
            cell: ({ row }) => {
                const dateVal = row.getValue("application_created_date") as string;
                if (!dateVal) return <span className="text-gray-400">-</span>;
                const date = new Date(dateVal);
                return (
                    <div className="text-sm text-gray-600">
                        {date.toLocaleDateString('en-GB')}
                    </div>
                );
            }
        },
        {
            accessorKey: "_assign",
            header: () => <span className="font-medium text-sm text-gray-900 hidden lg:flex hover:bg-gray-50">Assigned To</span>,
            filterFn: assignedUserFilterFn,
            cell: ({ row }) => {
                const assignData = row.getValue("_assign") as string;
                const users: string[] = JSON.parse(assignData || "[]");
                return (
                    <div className="flex -space-x-2">
                        {users.filter(u => u !== "Administrator").map((user, i) => (
                            <TooltipProvider key={i} delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-medium border-2 border-white cursor-help">
                                            {user.charAt(0).toUpperCase()}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {user}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                );
            }
        }
    ];

    // Table Instance
    const table = useReactTable({
        data: kycLeads,
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
        globalFilterFn,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
        },
    });

    // Effect for Filters
    useEffect(() => {
        table.getColumn('campaign')?.setFilterValue(selectedCampaign !== 'all' ? selectedCampaign : '');
    }, [selectedCampaign, table]);

    useEffect(() => {
        table.getColumn('source')?.setFilterValue(selectedSource !== 'all' ? selectedSource : '');
    }, [selectedSource, table]);

    useEffect(() => {
        table.getColumn('_assign')?.setFilterValue(selectedAssignedUser !== 'all' ? selectedAssignedUser : '');
    }, [selectedAssignedUser, table]);


    // Options for Filters
    const campaignOptions = useMemo(() => {
        const campaigns = Array.from(new Set(kycLeads.map(l => l.campaign).filter(Boolean))).sort().map(c => ({ value: c, label: c }));
        return [{ value: 'all', label: 'All Campaigns' }, ...campaigns];
    }, [kycLeads]);

    const sourceOptions = useMemo(() => {
        const sources = Array.from(new Set(kycLeads.map(l => l.source).filter(Boolean))).sort().map(s => ({ value: s, label: s }));
        return [{ value: 'all', label: 'All Sources' }, ...sources];
    }, [kycLeads]);

    const assignedUserOptions = useMemo(() => {
        const users = new Set<string>();
        kycLeads.forEach(l => {
            const assignData = JSON.parse(l._assign || "[]") as string[];
            assignData.forEach(u => { if (u !== 'Administrator') users.add(u); });
        });
        const userList = Array.from(users).sort().map(u => ({ value: u, label: getDisplayName(u) }));
        return [{ value: 'all', label: 'All Users' }, ...userList];
    }, [kycLeads]);


    return (
        <div className="">
            {/* Summary Cards */}
            <div className="hidden lg:grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard title="Total KYC Leads" value={summaryData.total} icon={Building2} color="blue" shadowColor="blue" showTrend={false} />
                <SummaryCard title="Approved" value={summaryData.approved} icon={Building2} color="blue" shadowColor="blue" showTrend={false} />
                <SummaryCard title="Pending" value={summaryData.pending} icon={Building2} color="blue" shadowColor="blue" showTrend={false} />
                <SummaryCard title="Rejected" value={summaryData.rejected} icon={Building2} color="blue" shadowColor="blue" showTrend={false} />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100 hidden lg:block">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <Input
                                type="text"
                                placeholder="Search KYC leads..."
                                value={globalFilter ?? ''}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3"
                            />
                        </div>
                        <SourceFilter value={selectedSource} onChange={setSelectedSource} options={sourceOptions} />
                        <CampaignFilter value={selectedCampaign} onChange={setSelectedCampaign} options={campaignOptions} />
                        <AssignedUserFilter value={selectedAssignedUser} onChange={setSelectedAssignedUser} options={assignedUserOptions} />

                        {/* Status Filter (Generic) - reusing dropdown logic if needed, but here we filter by Application Status maybe? 
                            Let's keep it simple for now as per requirements.
                        */}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <DashboardTable
                    table={table}
                    leads={kycLeads}
                    isInitialLoading={isInitialLoading}
                    handleLeadClick={() => { }} // No action on click for now
                />
            </div>
        </div>
    );
}
