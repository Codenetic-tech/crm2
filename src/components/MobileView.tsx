import React from 'react';
import {
    Search,
    Filter,
    Eye,
    X,
    Check,
    Menu,
    MoreVertical,
    PhoneIcon,
    Building2,
    RefreshCw,
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Lead } from '@/utils/crm';
import { Table } from "@tanstack/react-table";
import {
    CampaignFilter,
    AssignedUserFilter,
    statusOptions,
    getStatusColor
} from './Filters';
import { AddLeadDialog } from './AddLeadDialog';
import { LoadingState, EmptyState, NoResultsState } from './DashboardTable';

export interface SummaryData {
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    followup: number;
    qualifiedLeads: number;
    totalValue: number;
    conversionRate: number;
    notinterested: number;
    existingclient: number;
    rnr?: number;
    callback?: number;
    switchoff?: number;
    won?: number;
}

interface MobileLeadRowProps {
    row: any;
    handleLeadClick: (id: string) => void;
    toggleDropdown: (id: string, e: React.MouseEvent) => void;
    isChangingStatus: string | null;
    openDropdown: string | null;
    setOpenDropdown: (id: string | null) => void;
    changeLeadStatus: (id: string, status: string, name: string) => void;
}

export const MobileLeadRow: React.FC<MobileLeadRowProps> = ({
    row,
    handleLeadClick,
    toggleDropdown,
    isChangingStatus,
    openDropdown,
    setOpenDropdown,
    changeLeadStatus,
}) => {
    const lead = row.original;

    return (
        <div
            className={`bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer ${lead._isNew ? 'bg-green-50 border-l-4 border-green-400' :
                lead._isModified ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                }`}
            onClick={() => handleLeadClick(lead.id)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {lead.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{lead.name}</p>
                        {lead.ucc && (
                            <p className="text-xs text-gray-400 truncate">UCC: {lead.ucc}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                    <button
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={(e) => toggleDropdown(lead.id, e)}
                        disabled={isChangingStatus === lead.id}
                    >
                        {isChangingStatus === lead.id ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : (
                            <MoreVertical size={16} />
                        )}
                    </button>
                </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="flex items-center gap-2">
                    <PhoneIcon size={14} className="text-gray-400" />
                    <span className="text-gray-700 truncate">{lead.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400" />
                    <span className="text-gray-700 truncate">{lead.city || 'N/A'}</span>
                </div>
            </div>

            {/* Source and Campaign */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className="truncate">Source: {lead.source}</span>
                <span className="truncate ml-2">Campaign: {lead.campaign || 'N/A'}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
                <span>Created: {new Date(lead.createdAt).toLocaleDateString('en-GB')}</span>
                <span>Modified: {lead.lastActivity}</span>
            </div>

            {/* Assignees */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex -space-x-2">
                    {JSON.parse(lead._assign || "[]")
                        .filter((user: string) => user !== "gokul.krishna.687@gopocket.in")
                        .map((user: string, index: number) => {
                            const firstLetter = user.charAt(0).toUpperCase();
                            return (
                                <div key={index} className="relative group">
                                    <div
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold border-2 border-white"
                                        title={user}
                                    >
                                        {firstLetter}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>

            {/* Mobile Status Change Modal */}
            {openDropdown === lead.id && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(null);
                        }}
                    />

                    {/* Modal */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 lg:hidden animate-slide-up max-h-[80vh] overflow-hidden w-full">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold truncate pr-2">Change Status for {lead.name}</h3>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdown(null);
                                    }}
                                    className="p-1 flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[60vh]">
                            {statusOptions.map((status) => (
                                <button
                                    key={status.value}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-gray-50 ${lead.status === status.value ? 'bg-blue-50' : ''
                                        }`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        changeLeadStatus(lead.id, status.value, lead.name);
                                    }}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-3 h-3 rounded-full ${status.color.split(' ')[0]} flex-shrink-0`} />
                                        <span className="font-medium truncate">{status.label}</span>
                                    </div>
                                    {lead.status === status.value && (
                                        <Check size={18} className="text-blue-600 flex-shrink-0 ml-2" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-white">
                            <button
                                className="w-full text-center py-3 text-gray-500 hover:text-gray-700 font-medium"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

interface MobileHeaderProps {
    setMobileMenuOpen: (open: boolean) => void;
    summaryData: SummaryData;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ setMobileMenuOpen, summaryData }) => (
    <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">GoPocket</h1>
                </div>
            </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="px-4 pb-3">
            <div className="flex items-center justify-between text-xs">
                <div className="text-center flex-1">
                    <div className="font-semibold text-blue-600">{summaryData.totalLeads}</div>
                    <div className="text-gray-500">Total</div>
                </div>
                <div className="text-center flex-1">
                    <div className="font-semibold text-green-600">{summaryData.newLeads}</div>
                    <div className="text-gray-500">New</div>
                </div>
                <div className="text-center flex-1">
                    <div className="font-semibold text-purple-600">{summaryData.contactedLeads}</div>
                    <div className="text-gray-500">Contacted</div>
                </div>
                <div className="text-center flex-1">
                    <div className="font-semibold text-yellow-600">{summaryData.followup}</div>
                    <div className="text-gray-500">Followup</div>
                </div>
                <div className="text-center flex-1">
                    <div className="font-semibold text-indigo-600">{summaryData.qualifiedLeads}</div>
                    <div className="text-gray-500">Qualified</div>
                </div>
            </div>
        </div>
    </div>
);

interface MobileSearchBarProps {
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
}

export const MobileSearchBar: React.FC<MobileSearchBarProps> = ({ globalFilter, setGlobalFilter }) => (
    <div className="lg:hidden bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
                type="text"
                placeholder="Search all leads..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-10"
            />
        </div>
    </div>
);

interface MobileFilterPanelProps {
    setMobileFilterOpen: (open: boolean) => void;
    setMobileColumnVisibilityOpen: (open: boolean) => void;
    selectedCampaign: string;
    setSelectedCampaign: (value: string) => void;
    selectedSource: string;
    setSelectedSource: (value: string) => void;
    selectedAssignedUser: string;
    setSelectedAssignedUser: (value: string) => void;
    table: Table<Lead>;
    campaignOptions: { value: string; label: string }[];
    sourceOptions: { value: string; label: string }[];
    assignedUserOptions: { value: string; label: string }[];
}

export const MobileFilterPanel: React.FC<MobileFilterPanelProps> = ({
    setMobileFilterOpen,
    setMobileColumnVisibilityOpen,
    selectedCampaign,
    setSelectedCampaign,
    selectedSource,
    setSelectedSource,
    selectedAssignedUser,
    setSelectedAssignedUser,
    table,
    campaignOptions,
    sourceOptions,
    assignedUserOptions,
}) => (
    <div className="lg:hidden bg-white rounded-lg p-4 mb-4 border border-gray-200">
        <div className="flex gap-2 mb-3">
            <button
                onClick={() => setMobileFilterOpen(true)}
                className="flex-1 bg-blue-50 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
                <Filter size={16} />
                Filters
            </button>
            <button
                onClick={() => setMobileColumnVisibilityOpen(true)}
                className="flex-1 bg-gray-50 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
                <Eye size={16} />
                Columns
            </button>
        </div>

        {/* Active Filters Display */}
        <div className="flex flex-wrap gap-2">
            {selectedCampaign && selectedCampaign !== 'all' && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    Campaign: {campaignOptions.find(c => c.value === selectedCampaign)?.label}
                    <button onClick={() => setSelectedCampaign('')}>×</button>
                </span>
            )}
            {selectedSource && selectedSource !== 'all' && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    source: {sourceOptions.find(c => c.value === selectedSource)?.label}
                    <button onClick={() => setSelectedSource('')}>×</button>
                </span>
            )}
            {selectedAssignedUser && selectedAssignedUser !== 'all' && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    User: {assignedUserOptions.find(u => u.value === selectedAssignedUser)?.label}
                    <button onClick={() => setSelectedAssignedUser('')}>×</button>
                </span>
            )}
            {table.getColumn('status')?.getFilterValue() && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    Status: {statusOptions.find(s => s.value === table.getColumn('status')?.getFilterValue())?.label}
                    <button onClick={() => table.getColumn('status')?.setFilterValue('')}>×</button>
                </span>
            )}
        </div>
    </div>
);

interface MobileFiltersModalProps {
    mobileFilterOpen: boolean;
    setMobileFilterOpen: (open: boolean) => void;
    selectedCampaign: string;
    setSelectedCampaign: (value: string) => void;
    selectedAssignedUser: string;
    setSelectedAssignedUser: (value: string) => void;
    table: Table<Lead>;
    campaignOptions: { value: string; label: string }[];
    assignedUserOptions: { value: string; label: string }[];
}

export const MobileFiltersModal: React.FC<MobileFiltersModalProps> = ({
    mobileFilterOpen,
    setMobileFilterOpen,
    selectedCampaign,
    setSelectedCampaign,
    selectedAssignedUser,
    setSelectedAssignedUser,
    table,
    campaignOptions,
    assignedUserOptions,
}) => (
    <>
        {mobileFilterOpen && (
            <>
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setMobileFilterOpen(false)}
                />

                <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 lg:hidden animate-slide-up max-h-[80vh] overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Filters</h3>
                            <button
                                onClick={() => setMobileFilterOpen(false)}
                                className="p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[60vh] p-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Campaign</label>
                            <CampaignFilter
                                value={selectedCampaign}
                                onChange={setSelectedCampaign}
                                options={campaignOptions}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Assigned User</label>
                            <AssignedUserFilter
                                value={selectedAssignedUser}
                                onChange={setSelectedAssignedUser}
                                options={assignedUserOptions}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                            <div className="space-y-2">
                                {statusOptions.map((status) => (
                                    <button
                                        key={status.value}
                                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between ${table.getColumn('status')?.getFilterValue() === status.value
                                            ? 'bg-blue-50 border border-blue-200'
                                            : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                        onClick={() => {
                                            table.getColumn('status')?.setFilterValue(
                                                table.getColumn('status')?.getFilterValue() === status.value ? '' : status.value
                                            );
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${status.color.split(' ')[0]}`} />
                                            <span className="text-sm">{status.label}</span>
                                        </div>
                                        {table.getColumn('status')?.getFilterValue() === status.value && (
                                            <Check size={16} className="text-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white">
                        <button
                            className="w-full text-center py-3 bg-blue-600 text-white rounded-lg font-medium"
                            onClick={() => setMobileFilterOpen(false)}
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </>
        )}
    </>
);

interface MobileColumnVisibilityModalProps {
    mobileColumnVisibilityOpen: boolean;
    setMobileColumnVisibilityOpen: (open: boolean) => void;
    table: Table<Lead>;
}

export const MobileColumnVisibilityModal: React.FC<MobileColumnVisibilityModalProps> = ({
    mobileColumnVisibilityOpen,
    setMobileColumnVisibilityOpen,
    table,
}) => (
    <>
        {mobileColumnVisibilityOpen && (
            <>
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setMobileColumnVisibilityOpen(false)}
                />

                <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 lg:hidden animate-slide-up max-h-[80vh] overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Visible Columns</h3>
                            <button
                                onClick={() => setMobileColumnVisibilityOpen(false)}
                                className="p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-[60vh] p-4">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <div
                                        key={column.id}
                                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                                    >
                                        <span className="text-sm font-medium capitalize">
                                            {column.id === '_assign' ? 'Assigned To' :
                                                column.id === 'lastActivity' ? 'Last Modified' :
                                                    column.id}
                                        </span>
                                        <Checkbox
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                            className="h-5 w-5"
                                        />
                                    </div>
                                )
                            })}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white">
                        <button
                            className="w-full text-center py-3 bg-blue-600 text-white rounded-lg font-medium"
                            onClick={() => setMobileColumnVisibilityOpen(false)}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </>
        )}
    </>
);

interface MobileMenuProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    handleClearCacheAndRefresh: () => void;
    onLeadAdded: () => void;
    autoRefresh: boolean;
    setAutoRefresh: (value: boolean) => void;
    refreshInterval: number;
    setRefreshInterval: (value: number) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
    mobileMenuOpen,
    setMobileMenuOpen,
    handleClearCacheAndRefresh,
    onLeadAdded,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
}) => (
    <>
        {mobileMenuOpen && (
            <>
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />

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
                        <button
                            onClick={() => {
                                setMobileMenuOpen(false);
                                handleClearCacheAndRefresh();
                            }}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                        >
                            <RefreshCw size={20} className="text-gray-600" />
                            <span className="text-gray-900 font-medium">Refresh Leads</span>
                        </button>

                        <AddLeadDialog onLeadAdded={onLeadAdded} />

                        <div className="border-t border-gray-200 pt-4">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Settings
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-gray-900">Auto Refresh</span>
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 rounded"
                                />
                            </div>
                            <div className="px-4 py-3">
                                <label className="text-sm text-gray-700 mb-2 block">Refresh Interval</label>
                                <select
                                    value={refreshInterval}
                                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value={60}>1 minute</option>
                                    <option value={300}>5 minutes</option>
                                    <option value={600}>10 minutes</option>
                                    <option value={900}>15 minutes</option>
                                </select>
                            </div>
                        </div>
                    </nav>
                </div>
            </>
        )}
    </>
);

interface MobileLeadListProps {
    isInitialLoading: boolean;
    leads: Lead[];
    table: Table<Lead>;
    handleLeadClick: (id: string) => void;
    toggleDropdown: (id: string, e: React.MouseEvent) => void;
    isChangingStatus: string | null;
    openDropdown: string | null;
    setOpenDropdown: (id: string | null) => void;
    changeLeadStatus: (id: string, status: string, name: string) => void;
    onLeadAdded: () => void;
}

export const MobileLeadList: React.FC<MobileLeadListProps> = ({
    isInitialLoading,
    leads,
    table,
    handleLeadClick,
    toggleDropdown,
    isChangingStatus,
    openDropdown,
    setOpenDropdown,
    changeLeadStatus,
    onLeadAdded,
}) => (
    <div className="lg:hidden">
        {isInitialLoading ? (
            <LoadingState />
        ) : leads.length === 0 ? (
            <EmptyState onLeadAdded={onLeadAdded} />
        ) : table.getRowModel().rows?.length === 0 ? (
            <NoResultsState />
        ) : (
            <div className="p-4">
                {table.getRowModel().rows.map((row) => (
                    <MobileLeadRow
                        key={row.id}
                        row={row}
                        handleLeadClick={handleLeadClick}
                        toggleDropdown={toggleDropdown}
                        isChangingStatus={isChangingStatus}
                        openDropdown={openDropdown}
                        setOpenDropdown={setOpenDropdown}
                        changeLeadStatus={changeLeadStatus}
                    />
                ))}
            </div>
        )}
    </div>
);
