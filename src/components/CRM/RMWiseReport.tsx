import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead } from '@/utils/crm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RMWiseReportProps {
    leads: Lead[];
    teamMembers?: string[];
}

interface UserStat {
    userId: string;
    userName: string;
    totalLeads: number;
    campaigns: Set<string>;
    statusCounts: Record<string, number>;
}

const RMWiseReport: React.FC<RMWiseReportProps> = ({ leads, teamMembers }) => {
    // Process leads to group by assigned user and calculate stats
    const userStats = useMemo(() => {
        const stats: Record<string, UserStat> = {};

        leads.forEach(lead => {
            // Handle _assign field which is a JSON string array
            let assignedUsers: string[] = [];
            try {
                if (lead._assign) {
                    const parsed = JSON.parse(lead._assign);
                    if (Array.isArray(parsed)) {
                        assignedUsers = parsed;
                    }
                }
                // Fallback or additional check for assignedTo if _assign is empty but assignedTo exists
                if (assignedUsers.length === 0 && lead.assignedTo && lead.assignedTo !== 'Unassigned') {
                    assignedUsers.push(lead.assignedTo);
                }
            } catch (e) {
                // Fallback if JSON parse fails
                if (lead.assignedTo && lead.assignedTo !== 'Unassigned') {
                    assignedUsers.push(lead.assignedTo);
                }
            }

            assignedUsers.forEach(userId => {
                if (!stats[userId]) {
                    // Helper to format name from email
                    const namePart = userId.split('@')[0];
                    const displayName = namePart.split('.').map(part =>
                        part.charAt(0).toUpperCase() + part.slice(1)
                    ).join(' ');

                    stats[userId] = {
                        userId,
                        userName: displayName,
                        totalLeads: 0,
                        campaigns: new Set(),
                        statusCounts: {
                            new: 0,
                            not_interested: 0,
                            won: 0,
                            lost: 0,
                            rnr: 0,
                            call_back: 0,
                            switch_off: 0,
                            follow_up: 0,
                        }
                    };
                }

                const userStat = stats[userId];
                userStat.totalLeads += 1;

                // Add campaign
                if (lead.campaign) {
                    userStat.campaigns.add(lead.campaign);
                }

                // Increment status count
                // Normalize status to match keys
                let status = lead.status?.toLowerCase() || 'other';

                // Map API status string to our key format
                if (status === 'not interested') {
                    status = 'not_interested';
                } else if (status === 'call back') {
                    status = 'call_back';
                } else if (status === 'switch off') {
                    status = 'switch_off';
                } else if (status === 'followup' || status === 'follow up' || status === 'follow_up') {
                    status = 'follow_up';
                }

                if (['new', 'not_interested', 'won', 'lost', 'rnr', 'call_back', 'switch_off', 'follow_up'].includes(status)) {
                    userStat.statusCounts[status] = (userStat.statusCounts[status] || 0) + 1;
                }
                // No 'other' status count needed if all are explicitly handled or ignored
            });
        });

        // Convert to array
        const statsArray = Object.values(stats);

        // Filter by teamMembers if provided
        const filteredStats = teamMembers && teamMembers.length > 0
            ? statsArray.filter(stat => teamMembers.includes(stat.userId))
            : statsArray;

        // Sort by total leads desc
        return filteredStats.sort((a, b) => b.totalLeads - a.totalLeads);
    }, [leads, teamMembers]);

    const handleExport = () => {
        const data = userStats.map(stat => ({
            'RM Name': stat.userName,
            'RM Email': stat.userId,
            'Total Leads': stat.totalLeads,
            'New': stat.statusCounts.new || 0,
            'Won': stat.statusCounts.won || 0,
            'Not Interested': stat.statusCounts.not_interested || 0,
            'RNR': stat.statusCounts.rnr || 0,
            'Call Back': stat.statusCounts.call_back || 0,
            'Switch Off': stat.statusCounts.switch_off || 0,
            'Follow Up': stat.statusCounts.follow_up || 0,
            'Active Campaigns': Array.from(stat.campaigns).join(', ')
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RM Performance");
        XLSX.writeFile(wb, "RM_Performance_Report.xlsx");
    };

    if (!leads || leads.length === 0) return null;

    return (
        <Card className="bg-white rounded-2xl shadow-xl shadow-blue-100 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-white rounded-2xl shadow-xl shadow-blue-100 p-8 border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-800">RM Wise Performance Report</CardTitle>
                        <CardDescription>Detailed breakdown of lead assignment and status per Relationship Manager</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {userStats.length} RMs Active
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                            onClick={handleExport}
                        >
                            <Download className="h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="rounded-md border-t border-gray-100 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700 min-w-[200px]">Relationship Manager</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-center">Total Leads</TableHead>
                                <TableHead className="font-semibold text-blue-600 text-center">New</TableHead>
                                <TableHead className="font-semibold text-purple-600 text-center">Follow Up</TableHead>
                                <TableHead className="font-semibold text-emerald-700 text-center">Converted</TableHead>
                                <TableHead className="font-semibold text-red-600 text-center">Not Interested</TableHead>
                                <TableHead className="font-semibold text-orange-600 text-center">RNR</TableHead>
                                <TableHead className="font-semibold text-yellow-600 text-center">Call Back</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Switch Off</TableHead>
                                <TableHead className="font-semibold text-slate-700 min-w-[200px]">Active Campaigns</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userStats.length > 0 ? (
                                userStats.map((stat) => (
                                    <TableRow key={stat.userId} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900">{stat.userName}</span>
                                                <span className="text-xs text-slate-400">{stat.userId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-slate-800">
                                            {stat.totalLeads}
                                        </TableCell>
                                        <TableCell className="text-center text-blue-600 bg-blue-50/30">
                                            {stat.statusCounts.new || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-purple-600 bg-purple-50/30">
                                            {stat.statusCounts.follow_up || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-green-600 bg-green-50/30">
                                            {stat.statusCounts.won || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-red-600">
                                            {stat.statusCounts.not_interested || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-orange-600">
                                            {stat.statusCounts.rnr || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-yellow-600">
                                            {stat.statusCounts.call_back || 0}
                                        </TableCell>
                                        <TableCell className="text-center text-gray-600">
                                            {stat.statusCounts.switch_off || 0}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {Array.from(stat.campaigns).slice(0, 3).map(campaign => (
                                                    <Badge key={campaign} variant="secondary" className="text-xs font-normal border-gray-200">
                                                        {campaign}
                                                    </Badge>
                                                ))}
                                                {stat.campaigns.size > 3 && (
                                                    <Badge variant="outline" className="text-xs text-slate-500">
                                                        +{stat.campaigns.size - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-24 text-center text-slate-500">
                                        No data available for current filters
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default RMWiseReport;
