import { Task, DEFAULT_EMPLOYEES, Announcement, CloudConfig } from '../types';
import { updateCloudData, fetchCloudData, decodeCloudConfig } from './cloudService';

const STORAGE_KEY = 'cleancheck_tasks_v1';
const EMPLOYEES_KEY = 'cleancheck_employees_v1';
const PASSWORD_KEY = 'cleancheck_admin_pwd';
const ACCESS_CODE_KEY = 'cleancheck_access_code';
const ANNOUNCEMENTS_KEY = 'cleancheck_announcements_v1';
const CLOUD_CONFIG_KEY = 'cleancheck_cloud_config';

// --- Data Types ---
export interface SystemData {
  tasks: Task[];
  employees: string[];
  announcements: Announcement[];
  adminPassword?: string;
  accessCode?: string;
  updatedAt: number;
}

// --- Sync State ---
let syncInterval: any = null;
let isSyncing = false;
let lastSyncTime = 0;

// --- Cloud Config Helpers ---
export const getCloudConfig = (): CloudConfig | null => {
  const data = localStorage.getItem(CLOUD_CONFIG_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveCloudConfig = (config: CloudConfig): void => {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  startAutoSync();
};

export const clearCloudConfig = (): void => {
  stopAutoSync();
  localStorage.removeItem(CLOUD_CONFIG_KEY);
  localStorage.removeItem(ACCESS_CODE_KEY);
};

// --- Core Data Access ---

export const getFullSystemData = (): SystemData => {
  return {
    tasks: getTasks(),
    employees: getEmployees(),
    announcements: getAnnouncements(),
    adminPassword: getAdminPassword(),
    accessCode: getAccessCode(),
    updatedAt: Date.now()
  };
};

// --- SYNC ENGINE ---

export const startAutoSync = () => {
  if (syncInterval) clearInterval(syncInterval);
  syncFromCloud(); // Initial sync
  syncInterval = setInterval(() => {
    syncFromCloud(true);
  }, 10000);
};

export const stopAutoSync = () => {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = null;
};

export const syncFromCloud = async (silent = false): Promise<boolean> => {
  const config = getCloudConfig();
  if (!config) return false;
  if (isSyncing) return false;

  try {
    isSyncing = true;
    const cloudData = await fetchCloudData(config);
    
    if (cloudData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData.tasks || []));
      localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(cloudData.employees || []));
      localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(cloudData.announcements || []));
      if (cloudData.adminPassword) localStorage.setItem(PASSWORD_KEY, cloudData.adminPassword);
      if (cloudData.accessCode) localStorage.setItem(ACCESS_CODE_KEY, cloudData.accessCode);
      
      lastSyncTime = Date.now();
      window.dispatchEvent(new Event('storage')); 
      return true;
    }
    return false;
  } catch (e) {
    if (!silent) console.error("Sync failed", e);
    return false;
  } finally {
    isSyncing = false;
  }
};

const persistData = async (data: SystemData) => {
  // Save Local
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.tasks));
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(data.employees));
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(data.announcements));
  if (data.adminPassword) localStorage.setItem(PASSWORD_KEY, data.adminPassword);
  if (data.accessCode) localStorage.setItem(ACCESS_CODE_KEY, data.accessCode);

  window.dispatchEvent(new Event('storage'));

  // Push Cloud
  const cloudConfig = getCloudConfig();
  if (cloudConfig) {
    try {
        await updateCloudData(cloudConfig, data);
    } catch (e) {
        console.error("Failed to push to cloud", e);
    }
  }
};

// --- Getters ---
export const getEmployees = (): string[] => {
  const data = localStorage.getItem(EMPLOYEES_KEY);
  return data ? JSON.parse(data) : DEFAULT_EMPLOYEES;
};

export const getTasks = (): Task[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getAdminPassword = (): string => {
  return localStorage.getItem(PASSWORD_KEY) || '0000';
};

export const getAccessCode = (): string => {
  return localStorage.getItem(ACCESS_CODE_KEY) || '1111'; // Default team password
};

export const getAnnouncements = (): Announcement[] => {
  const data = localStorage.getItem(ANNOUNCEMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getTaskById = (id: string): Task | undefined => {
  return getTasks().find(t => t.id === id);
};

// --- Setters ---
export const saveEmployees = (employees: string[]): void => {
  const current = getFullSystemData();
  persistData({ ...current, employees });
};

export const saveTask = (task: Task): void => {
  const current = getFullSystemData();
  const tasks = [...current.tasks];
  const index = tasks.findIndex(t => t.id === task.id);
  if (index >= 0) tasks[index] = task;
  else tasks.push(task);
  
  persistData({ ...current, tasks });
};

export const deleteTask = (id: string): void => {
  const current = getFullSystemData();
  const tasks = current.tasks.filter(t => t.id !== id);
  persistData({ ...current, tasks });
};

export const saveAdminPassword = (pwd: string): void => {
  const current = getFullSystemData();
  persistData({ ...current, adminPassword: pwd });
};

export const saveAccessCode = (code: string): void => {
  const current = getFullSystemData();
  persistData({ ...current, accessCode: code });
};

export const saveAnnouncement = (announcement: Announcement): void => {
  const current = getFullSystemData();
  const list = [announcement, ...current.announcements];
  persistData({ ...current, announcements: list });
};

export const deleteAnnouncement = (id: string): void => {
  const current = getFullSystemData();
  const list = current.announcements.filter(a => a.id !== id);
  persistData({ ...current, announcements: list });
};

// --- Helpers ---
export const tryProcessInviteLink = async (): Promise<boolean> => {
    const hash = window.location.hash;
    if (hash.startsWith('#invite=')) {
        const code = hash.replace('#invite=', '');
        const config = decodeCloudConfig(code);
        if (config) {
            saveCloudConfig(config);
            // Must wait for sync to ensure new device has data
            await syncFromCloud();
            window.location.hash = ''; // Clear hash to enter lobby
            return true;
        }
    }
    return false;
}

// --- Cloudinary ---
export const uploadPhoto = async (base64Data: string): Promise<string> => {
  const cloudName = 'dlu7qv8oq'; 
  const uploadPreset = 'unicheck'; 
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', base64Data);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Upload Error:", error);
    throw new Error("照片上傳失敗");
  }
};