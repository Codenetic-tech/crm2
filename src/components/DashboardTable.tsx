import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    RefreshCw,
    Users,
    Search,
} from 'lucide-react';
import { flexRender, Table as TanStackTable } from "@tanstack/react-table";
import { Lead } from '@/utils/crm';
import { AddLeadDialog } from './AddLeadDialog';

// Enhanced loading state
export const LoadingState = () => (
    <div className="text-center py-12">
        <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600">Loading leads...</p>
    </div>
);

// Enhanced empty state
export const EmptyState = ({ onLeadAdded }: { onLeadAdded: () => void }) => (
    <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads assigned to you</h3>
        <p className="text-gray-600 mb-6">You don't have any leads assigned to you at the moment.</p>
        <AddLeadDialog onLeadAdded={onLeadAdded} />
    </div>
);

// Enhanced no results state
export const NoResultsState = () => (
    <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No matching leads found</h3>
        <p className="text-gray-600">Try adjusting your search or filters to find what you're looking for.</p>
    </div>
);

interface DashboardTableProps {
    table: TanStackTable<Lead>;
    leads: Lead[];
    isInitialLoading: boolean;
    handleLeadClick: (leadId: string) => void;
    onLeadAdded: () => void;
}

export const DashboardTable: React.FC<DashboardTableProps> = ({
    table,
    leads,
    isInitialLoading,
    handleLeadClick,
    onLeadAdded,
}) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-x-auto hidden lg:block">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${row.original._isNew ? 'bg-green-50 border-l-4 border-green-400' :
                                    row.original._isModified ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                                    }`}
                                onClick={() => handleLeadClick(row.original.id)}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
                                {isInitialLoading ? (
                                    <LoadingState />
                                ) : leads.length === 0 ? (
                                    <EmptyState onLeadAdded={onLeadAdded} />
                                ) : (
                                    <NoResultsState />
                                )}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {!isInitialLoading && leads.length > 0 && table.getRowModel().rows?.length > 0 && (
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <select
                                value={table.getState().pagination.pageSize}
                                onChange={(e) => {
                                    table.setPageSize(Number(e.target.value));
                                }}
                                className="h-8 w-[70px] rounded-md border border-gray-300 bg-transparent text-sm"
                            >
                                {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                    <option key={pageSize} value={pageSize}>
                                        {pageSize}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount()}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
