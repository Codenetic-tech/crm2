// utils/crmCache.ts
import { type Lead } from '@/utils/crm';

interface CachedLeadData {
  leads: Lead[];
  timestamp: number;
  employeeId: string;
  email: string;
}

interface CachedLeadDetails {
  [leadId: string]: {
    lead: Lead;
    timestamp: number;
  };
}

const LEADS_CACHE_KEY = 'crm_leads_cache';
const LEAD_DETAILS_CACHE_KEY = 'crm_lead_details_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Cache size management
const MAX_CACHE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_LEADS_IN_DETAILS_CACHE = 100; // Keep only recent 100 leads in details cache

// Add function to calculate cache size
const getCacheSize = (): number => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // *2 because UTF-16
    }
  }
  return total;
};

// Add function to clean up old cache entries
const cleanupOldCacheEntries = (): void => {
  try {
    // Clean up lead details cache - keep only recent ones
    const detailsCache = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    if (detailsCache) {
      const cachedData: CachedLeadDetails = JSON.parse(detailsCache);
      const entries = Object.entries(cachedData);
      
      if (entries.length > MAX_LEADS_IN_DETAILS_CACHE) {
        // Sort by timestamp (newest first) and keep only the most recent ones
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const newCache: CachedLeadDetails = {};
        
        entries.slice(0, MAX_LEADS_IN_DETAILS_CACHE).forEach(([key, value]) => {
          newCache[key] = value;
        });
        
        localStorage.setItem(LEAD_DETAILS_CACHE_KEY, JSON.stringify(newCache));
        console.log(`Cleaned up lead details cache: ${entries.length} -> ${Object.keys(newCache).length}`);
      }
    }

    // Check total cache size and clear if needed
    const totalSize = getCacheSize();
    if (totalSize > MAX_CACHE_SIZE) {
      console.warn(`Cache size (${totalSize} bytes) exceeds limit, clearing cache`);
      clearAllCache();
    }
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
};

export const getCachedLeads = (employeeId: string, email: string): Lead[] | null => {
  try {
    const cached = localStorage.getItem(LEADS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedLeadData = JSON.parse(cached);
    const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION;
    const isSameUser = cachedData.employeeId === employeeId && cachedData.email === email;

    if (isExpired || !isSameUser) {
      localStorage.removeItem(LEADS_CACHE_KEY);
      return null;
    }

    return cachedData.leads;
  } catch (error) {
    console.error('Error reading leads cache:', error);
    return null;
  }
};

export const saveLeadsToCache = (leads: Lead[], employeeId: string, email: string): void => {
  try {
    // Clean up before saving new data
    cleanupOldCacheEntries();
    
    const cacheData: CachedLeadData = {
      leads,
      timestamp: Date.now(),
      employeeId,
      email
    };
    
    // Only save essential data for the leads list (without duplicating in details cache)
    localStorage.setItem(LEADS_CACHE_KEY, JSON.stringify(cacheData));

    // Don't save each lead to details cache here to avoid duplication
    // The details cache should only be populated when individual lead details are fetched
    
  } catch (error) {
    console.error('Error saving leads to cache:', error);
    // If we get a quota error, clear some cache and retry
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing cache');
      clearAllCache();
    }
  }
};

export const getCachedLeadDetails = (leadId: string): Lead | null => {
  try {
    const cached = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedLeadDetails = JSON.parse(cached);
    const leadCache = cachedData[leadId];
    
    if (!leadCache) return null;
    
    const isExpired = Date.now() - leadCache.timestamp > CACHE_DURATION;
    if (isExpired) {
      delete cachedData[leadId];
      localStorage.setItem(LEAD_DETAILS_CACHE_KEY, JSON.stringify(cachedData));
      return null;
    }

    return leadCache.lead;
  } catch (error) {
    console.error('Error reading lead details cache:', error);
    return null;
  }
};

export const saveLeadDetailsToCache = (leadId: string, lead: Lead): void => {
  try {
    const cached = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    const cachedData: CachedLeadDetails = cached ? JSON.parse(cached) : {};
    
    cachedData[leadId] = {
      lead,
      timestamp: Date.now()
    };
    
    localStorage.setItem(LEAD_DETAILS_CACHE_KEY, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error saving lead details to cache:', error);
  }
};

export const clearAllCache = (): void => {
  localStorage.removeItem(LEADS_CACHE_KEY);
  localStorage.removeItem(LEAD_DETAILS_CACHE_KEY);
};

export const clearLeadDetailsCache = (): void => {
  localStorage.removeItem(LEAD_DETAILS_CACHE_KEY);
};

interface CachedCommentsData {
  [leadId: string]: {
    comments: Comment[];
    timestamp: number;
  };
}

const COMMENTS_CACHE_KEY = 'crm_comments_cache';

export interface Comment {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  comment_type: string;
  comment_email: string;
  subject: string | null;
  comment_by: string;
  published: number;
  seen: number;
  reference_doctype: string;
  reference_name: string;
  reference_owner: string | null;
  content: string;
  ip_address: string | null;
  doctype?: string;
}

export const getCachedComments = (leadId: string): Comment[] | null => {
  try {
    const cached = localStorage.getItem(COMMENTS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedCommentsData = JSON.parse(cached);
    const commentCache = cachedData[leadId];
    
    if (!commentCache) return null;
    
    const isExpired = Date.now() - commentCache.timestamp > CACHE_DURATION;
    if (isExpired) {
      delete cachedData[leadId];
      localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cachedData));
      return null;
    }

    return commentCache.comments;
  } catch (error) {
    console.error('Error reading comments cache:', error);
    return null;
  }
};

export const saveCommentsToCache = (leadId: string, comments: Comment[]): void => {
  try {
    const cached = localStorage.getItem(COMMENTS_CACHE_KEY);
    const cachedData: CachedCommentsData = cached ? JSON.parse(cached) : {};
    
    cachedData[leadId] = {
      comments,
      timestamp: Date.now()
    };
    
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error saving comments to cache:', error);
  }
};

export const clearCommentsCache = (): void => {
  localStorage.removeItem(COMMENTS_CACHE_KEY);
};

// Add Task interface (same as in LeadTasksTab.tsx)
export interface Task {
  name: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Done';
  assigned_to: string;
  creation: string;
  modified: string;
}

interface CachedTasksData {
  [leadId: string]: {
    tasks: Task[];
    timestamp: number;
  };
}

const TASKS_CACHE_KEY = 'crm_tasks_cache';

export const getCachedTasks = (leadId: string): Task[] | null => {
  try {
    const cached = localStorage.getItem(TASKS_CACHE_KEY);
    if (!cached) return null;

    const cachedData: CachedTasksData = JSON.parse(cached);
    const taskCache = cachedData[leadId];
    
    if (!taskCache) return null;
    
    const isExpired = Date.now() - taskCache.timestamp > CACHE_DURATION;
    if (isExpired) {
      delete cachedData[leadId];
      localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(cachedData));
      return null;
    }

    return taskCache.tasks;
  } catch (error) {
    console.error('Error reading tasks cache:', error);
    return null;
  }
};

export const saveTasksToCache = (leadId: string, tasks: Task[]): void => {
  try {
    const cached = localStorage.getItem(TASKS_CACHE_KEY);
    const cachedData: CachedTasksData = cached ? JSON.parse(cached) : {};
    
    cachedData[leadId] = {
      tasks,
      timestamp: Date.now()
    };
    
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error saving tasks to cache:', error);
  }
};

export const clearTasksCache = (): void => {
  localStorage.removeItem(TASKS_CACHE_KEY);
};

export const clearTasksCacheForLead = (leadId: string): void => {
  try {
    const cached = localStorage.getItem(TASKS_CACHE_KEY);
    if (!cached) return;

    const cachedData: CachedTasksData = JSON.parse(cached);
    delete cachedData[leadId];
    localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(cachedData));
  } catch (error) {
    console.error('Error clearing tasks cache for lead:', error);
  }
};

// Update getCacheInfo to include tasks cache info
export const getCacheInfo = () => {
  try {
    const leadsCache = localStorage.getItem(LEADS_CACHE_KEY);
    const detailsCache = localStorage.getItem(LEAD_DETAILS_CACHE_KEY);
    const commentsCache = localStorage.getItem(COMMENTS_CACHE_KEY);
    const tasksCache = localStorage.getItem(TASKS_CACHE_KEY);
    
    const leadsData = leadsCache ? JSON.parse(leadsCache) : null;
    const detailsData = detailsCache ? JSON.parse(detailsCache) : null;
    const commentsData = commentsCache ? JSON.parse(commentsCache) : null;
    const tasksData = tasksCache ? JSON.parse(tasksCache) : null;
    
    return {
      hasLeadsCache: !!leadsCache,
      hasDetailsCache: !!detailsCache,
      hasCommentsCache: !!commentsCache,
      hasTasksCache: !!tasksCache,
      leadsCount: leadsData ? leadsData.leads.length : 0,
      detailsCount: detailsData ? Object.keys(detailsData).length : 0,
      commentsCount: commentsData ? Object.keys(commentsData).length : 0,
      tasksCount: tasksData ? Object.keys(tasksData).length : 0,
      leadsTimestamp: leadsData ? leadsData.timestamp : null,
      detailsTimestamp: detailsData ? Math.max(...Object.values(detailsData).map((d: any) => d.timestamp)) : null,
      commentsTimestamp: commentsData ? Math.max(...Object.values(commentsData).map((c: any) => c.timestamp)) : null,
      tasksTimestamp: tasksData ? Math.max(...Object.values(tasksData).map((t: any) => t.timestamp)) : null
    };
  } catch {
    return {
      hasLeadsCache: false,
      hasDetailsCache: false,
      hasCommentsCache: false,
      hasTasksCache: false,
      leadsCount: 0,
      detailsCount: 0,
      commentsCount: 0,
      tasksCount: 0,
      leadsTimestamp: null,
      detailsTimestamp: null,
      commentsTimestamp: null,
      tasksTimestamp: null
    };
  }
};

// utils/crmCache.ts
export const updateCachedLeadDetails = (leadId: string, updatedLead: Lead) => {
  if (typeof window === 'undefined') return;
  
  const key = `lead_${leadId}`;
  const cachedData = {
    data: updatedLead,
    timestamp: new Date().getTime()
  };
  localStorage.setItem(key, JSON.stringify(cachedData));
};

// Add cache health check function
export const initializeCacheHealthCheck = (): void => {
  // Run cleanup every hour
  setInterval(cleanupOldCacheEntries, 60 * 60 * 1000);
  
  // Also run cleanup when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      cleanupOldCacheEntries();
    }
  });
};