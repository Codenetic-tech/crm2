import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { type Lead, fetchLeads as fetchLeadsFromApi } from '@/utils/crm';
import {
    getCachedLeads,
    saveLeadsToCache,
    clearAllCache,
    updateCachedLeadDetails // Assuming this updates the main list too or we might need a specific one
} from '@/utils/crmCache';

interface LeadContextType {
    leads: Lead[];
    isLoading: boolean;
    isRefreshing: boolean;
    lastFetched: number | null;
    refreshLeads: () => Promise<void>;
    fetchLeads: (force?: boolean) => Promise<void>;
    updateLead: (updatedLead: Lead) => Promise<void>;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

export const useLeads = () => {
    const context = useContext(LeadContext);
    if (context === undefined) {
        throw new Error('useLeads must be used within a LeadProvider');
    }
    return context;
};

interface LeadProviderProps {
    children: ReactNode;
}

export const LeadProvider: React.FC<LeadProviderProps> = ({ children }) => {
    const { user, employee } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastFetched, setLastFetched] = useState<number | null>(null);

    const employeeId = user?.employeeId;
    const email = user?.email;
    const team = user?.team; // Assuming team is on user object based on usage in other files

    const loadLeadsInfo = useCallback(async (force: boolean = false) => {
        if (!employeeId || !email) return;

        // If we have data in memory and not forcing, return immediately
        if (!force && leads.length > 0) {
            return;
        }

        setIsLoading(true);
        try {
            // 1. Try Cache First
            if (!force) {
                const cachedLeads = await getCachedLeads(employeeId, email);
                if (cachedLeads && cachedLeads.length > 0) {
                    console.log('LeadContext: Returning cached leads');
                    setLeads(cachedLeads);
                    setLastFetched(Date.now()); // Or ideally get timestamp from cache wrapper if available
                    setIsLoading(false);
                    return;
                }
            }

            // 2. Fetch from API
            console.log('LeadContext: Fetching from API...');
            const fetchedLeads = await fetchLeadsFromApi(employeeId, email, team);

            // 3. Update State and Cache
            setLeads(fetchedLeads);
            setLastFetched(Date.now());
            setIsLoading(false); // Update loading state before saving to cache to be responsive

            // Async save to cache
            await saveLeadsToCache(fetchedLeads, employeeId, email);

        } catch (error) {
            console.error('LeadContext: Error loading leads:', error);
            setIsLoading(false);
        }
    }, [employeeId, email, team, leads.length]); // Added dependencies

    const fetchLeads = useCallback(async (force: boolean = false) => {
        await loadLeadsInfo(force);
    }, [loadLeadsInfo]);


    const refreshLeads = useCallback(async () => {
        if (!employeeId || !email) return;

        setIsRefreshing(true);
        try {
            console.log('LeadContext: Refreshing leads...');
            // Clear cache first
            await clearAllCache();

            // Fetch fresh data
            const fetchedLeads = await fetchLeadsFromApi(employeeId, email, team);

            // Update state
            setLeads(fetchedLeads);
            setLastFetched(Date.now());

            // Save to cache
            await saveLeadsToCache(fetchedLeads, employeeId, email);

        } catch (error) {
            console.error('LeadContext: Error refreshing leads:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [employeeId, email, team]);

    const updateLead = useCallback(async (updatedLead: Lead) => {
        // 1. Optimistic Update
        setLeads(prevLeads =>
            prevLeads.map(lead => lead.id === updatedLead.id ? updatedLead : lead)
        );

        // 2. Update Cache
        // We update the specific lead details in cache, but for the main list, 
        // we should ideally update the specific item in the leads array in IDB.
        // For now, since updateCachedLeadDetails updates the 'lead_details' store,
        // we also need to ensure the main 'leads' list in IDB is updated if it contains the changed fields.
        // Re-saving the entire list is one way, but expensive. 
        // Ideally crmCache should export a way to update a single item in the 'leads' store.
        // Assuming for now we just update the in-memory state and let the details cache handle the deep data.
        // If the list view needs updated status, we might need to sync it.

        // Use the existing cache utility if it supports updating the list or just details.
        // Based on previous files, updateCachedLeadDetails only updates lead_details store.
        // We should probably update the leads store too.
        // Let's grab the current leads from state (which is now updated) and save back to cache.
        // Note: State update is async, so we use the functional update result logic effectively or just use the passed object.

        // To be safe and keep it consistent with the "heavy list" approach:
        // We will read the *current* leads from the context state (optimistic) and save them.
        // However, setLeads is async. So we'll trust the caller passes the right object
        // and we construct the new list manually for the cache save.

        setLeads(currentLeads => {
            const newLeads = currentLeads.map(lead => lead.id === updatedLead.id ? updatedLead : lead);
            // Fire and forget cache update
            saveLeadsToCache(newLeads, employeeId!, email!);
            return newLeads;
        });

        // Also update the detailed cache if it exists
        await updateCachedLeadDetails(updatedLead.id, updatedLead);

    }, [employeeId, email]);

    // Initial load effect
    useEffect(() => {
        if (user && employeeId && email) {
            // Only fetch if we haven't loaded yet
            if (leads.length === 0) {
                loadLeadsInfo(false);
            }
        } else if (!user) {
            // User logged out, clear state
            setLeads([]);
            setLastFetched(null);
            setIsLoading(false);
        }
    }, [user, employeeId, email, loadLeadsInfo, leads.length]);


    return (
        <LeadContext.Provider value={{
            leads,
            isLoading,
            isRefreshing,
            lastFetched,
            refreshLeads,
            fetchLeads,
            updateLead
        }}>
            {children}
        </LeadContext.Provider>
    );
};
