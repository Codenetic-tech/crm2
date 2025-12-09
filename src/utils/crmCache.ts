// utils/crmCache.ts
import { type Lead } from '@/utils/crm';

const DB_NAME = 'CRM_DB';
const DB_VERSION = 2; // Increment version for new stores if needed
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  id: string; // Key for the store
}

// Store names
const STORES = {
  LEADS: 'leads',
  LEAD_DETAILS: 'lead_details',
  COMMENTS: 'comments',
  TASKS: 'tasks'
};

// Open Database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.LEADS)) {
        db.createObjectStore(STORES.LEADS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.LEAD_DETAILS)) {
        db.createObjectStore(STORES.LEAD_DETAILS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.COMMENTS)) {
        db.createObjectStore(STORES.COMMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
      }
    };
  });
};

// Generic get function
const getFromStore = async <T>(storeName: string, key: string): Promise<T | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result as CacheEntry<T>;
        if (!result) {
          resolve(null);
          return;
        }

        const isExpired = Date.now() - result.timestamp > CACHE_DURATION;
        if (isExpired) {
          // Fire and forget delete
          deleteFromStore(storeName, key).catch(console.error);
          resolve(null);
        } else {
          resolve(result.data);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error reading from ${storeName}:`, error);
    return null;
  }
};

// Generic put function
const putToStore = async <T>(storeName: string, key: string, data: T): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    const entry: CacheEntry<T> = {
      id: key,
      data,
      timestamp: Date.now()
    };

    const request = store.put(entry);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error writing to ${storeName}:`, error);
  }
};

// Generic delete function
const deleteFromStore = async (storeName: string, key: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error deleting from ${storeName}:`, error);
  }
};

// Clear store function
const clearStore = async (storeName: string): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error clearing ${storeName}:`, error);
  }
};


// LEADS
export const getCachedLeads = async (employeeId: string, email: string): Promise<Lead[] | null> => {
  const key = `${employeeId}_${email}`;
  return getFromStore<Lead[]>(STORES.LEADS, key);
};

export const saveLeadsToCache = async (leads: Lead[], employeeId: string, email: string): Promise<void> => {
  const key = `${employeeId}_${email}`;
  return putToStore(STORES.LEADS, key, leads);
};

// LEAD DETAILS
export const getCachedLeadDetails = async (leadId: string): Promise<Lead | null> => {
  return getFromStore<Lead>(STORES.LEAD_DETAILS, leadId);
};

export const saveLeadDetailsToCache = async (leadId: string, lead: Lead): Promise<void> => {
  return putToStore(STORES.LEAD_DETAILS, leadId, lead);
};

export const updateCachedLeadDetails = async (leadId: string, updatedLead: Lead): Promise<void> => {
  return putToStore(STORES.LEAD_DETAILS, leadId, updatedLead);
};

// COMMENTS
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

export const getCachedComments = async (leadId: string): Promise<Comment[] | null> => {
  return getFromStore<Comment[]>(STORES.COMMENTS, leadId);
};

export const saveCommentsToCache = async (leadId: string, comments: Comment[]): Promise<void> => {
  return putToStore(STORES.COMMENTS, leadId, comments);
};

export const clearCommentsCache = async (): Promise<void> => {
  return clearStore(STORES.COMMENTS);
};


// TASKS
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

export const getCachedTasks = async (leadId: string): Promise<Task[] | null> => {
  return getFromStore<Task[]>(STORES.TASKS, leadId);
};

export const saveTasksToCache = async (leadId: string, tasks: Task[]): Promise<void> => {
  return putToStore(STORES.TASKS, leadId, tasks);
};

export const clearTasksCache = async (): Promise<void> => {
  return clearStore(STORES.TASKS);
};

export const clearTasksCacheForLead = async (leadId: string): Promise<void> => {
  return deleteFromStore(STORES.TASKS, leadId);
};

// UTILS
export const clearAllCache = async (): Promise<void> => {
  await Promise.all([
    clearStore(STORES.LEADS),
    clearStore(STORES.LEAD_DETAILS),
    clearStore(STORES.COMMENTS),
    clearStore(STORES.TASKS)
  ]);
};

export const clearLeadDetailsCache = async (): Promise<void> => {
  return clearStore(STORES.LEAD_DETAILS);
};

export const getCacheInfo = async () => {
  try {
    const db = await openDB();
    const stats: any = {
      hasLeadsCache: false,
      hasDetailsCache: false,
      hasCommentsCache: false,
      hasTasksCache: false,
      leadsCount: 0,
      detailsCount: 0,
      commentsCount: 0,
      tasksCount: 0,
    };

    // This is a rough estimate and doesn't return sync data like before
    // We can iterate stores if really needed, but for now we'll return basics
    const transaction = db.transaction(Object.values(STORES), 'readonly');

    const countStore = (storeName: string): Promise<number> => {
      return new Promise((resolve) => {
        const req = transaction.objectStore(storeName).count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      });
    };

    stats.leadsCount = await countStore(STORES.LEADS);
    stats.detailsCount = await countStore(STORES.LEAD_DETAILS);
    stats.commentsCount = await countStore(STORES.COMMENTS);
    stats.tasksCount = await countStore(STORES.TASKS);

    stats.hasLeadsCache = stats.leadsCount > 0;
    stats.hasDetailsCache = stats.detailsCount > 0;
    stats.hasCommentsCache = stats.commentsCount > 0;
    stats.hasTasksCache = stats.tasksCount > 0;

    return stats;

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
    };
  }
};

export const initializeCacheHealthCheck = (): void => {
  // IndexedDB handles storage better, but we can still have a janitor process if needed
  // For now, expiration is checked on read.
};