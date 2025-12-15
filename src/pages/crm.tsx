import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/contexts/LeadContext';
import { RefreshButton } from '@/components/CRM/RefreshButton';
import { AddLeadDialog } from '@/components/AddLeadDialog';

import CRMDashboard from '@/components/CRMDashboard';
import Clients from '@/components/Clients';
import KYCStage from '@/components/CRM/KYCStage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Converted from '@/components/Converted';

const CRMPage: React.FC = () => {
    const { user } = useAuth();
    const { refreshLeads, isRefreshing: isLeadsRefreshing, isLoading: isLeadsLoading } = useLeads();

    // Refresh Logic
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [refreshInterval, setRefreshInterval] = useState(300000); // 5 minutes default
    const [cooldownRemaining, setCooldownRemaining] = useState(0);
    const [canRefresh, setCanRefresh] = useState(true);
    const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const REFRESH_COOLDOWN_MS = 5 * 1000;

    const handleRateLimitedRefresh = async () => {
        if (!canRefresh) return;

        setCanRefresh(false);
        setCooldownRemaining(REFRESH_COOLDOWN_MS / 1000);

        try {
            await refreshLeads();
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

    const handleLeadAdded = async () => {
        await refreshLeads();
    };

    return (
        <div className="lg:pl-7">

            {/* I will restructure to include TabsList in the flex header */}

            <Tabs defaultValue="lead" className="w-full">
                <div className="hidden lg:flex flex-row items-center justify-between gap-4 mb-8">
                    {/* Left: Greeting */}
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg sm:text-2xl font-bold text-foreground whitespace-nowrap">
                            <span className="text-violet-700">{getGreeting()}</span> {formatName(user?.firstName)}
                        </h1>
                    </div>

                    {/* Middle: Tabs List */}
                    <TabsList className="grid w-[400px] grid-cols-4">
                        <TabsTrigger value="lead">Lead</TabsTrigger>
                        <TabsTrigger value="kyc">KYC Stage</TabsTrigger>
                        <TabsTrigger value="converted">Converted</TabsTrigger>
                        <TabsTrigger value="clients">Clients</TabsTrigger>
                    </TabsList>

                    {/* Right: Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-end">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="autoRefresh"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded"
                            />
                            <label htmlFor="autoRefresh" className="text-sm text-gray-700 whitespace-nowrap">Auto Refresh</label>
                        </div>
                        <Select
                            value={refreshInterval.toString()}
                            onValueChange={(value) => setRefreshInterval(Number(value))}
                        >
                            <SelectTrigger className="w-[120px] h-9">
                                <SelectValue placeholder="Interval" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="60000">1 min</SelectItem>
                                <SelectItem value="300000">5 min</SelectItem>
                                <SelectItem value="600000">10 min</SelectItem>
                                <SelectItem value="900000">15 min</SelectItem>
                            </SelectContent>
                        </Select>

                        <RefreshButton
                            isRefreshing={isLeadsRefreshing}
                            onRefresh={handleRateLimitedRefresh}
                            disabled={isLeadsLoading || (!canRefresh && cooldownRemaining > 0)}
                        />

                        <AddLeadDialog onLeadAdded={handleLeadAdded} />
                    </div>
                </div>

                <TabsContent value="lead" className="mt-0">
                    <CRMDashboard hideHeader={true} />
                </TabsContent>
                <TabsContent value="kyc" className="mt-0">
                    <KYCStage />
                </TabsContent>
                <TabsContent value="converted" className="mt-0">
                    <Converted />
                </TabsContent>
                <TabsContent value="clients" className="mt-0">
                    <Clients />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default CRMPage;
