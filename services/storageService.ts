import { Task, DEFAULT_EMPLOYEES, Announcement } from '../types';

const STORAGE_KEY = 'cleancheck_tasks_v1';
const EMPLOYEES_KEY = 'cleancheck_employees_v1';
const PASSWORD_KEY = 'cleancheck_admin_pwd';
const ANNOUNCEMENTS_KEY = 'cleancheck_announcements_v1';

// --- Data Types for Export/Import ---
export interface SystemData {
  tasks: Task[];
  employees: string[];
  announcements: Announcement[];
  exportedAt: number;
  version: string;
}

// --- Local Storage Helpers ---
export const getEmployees = (): string[] => {
  const data = localStorage.getItem(EMPLOYEES_KEY);
  return data ? JSON.parse(data) : DEFAULT_EMPLOYEES;
};

export const saveEmployees = (employees: string[]): void => {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
};

export const getTasks = (): Task[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTask = (task: Task): void => {
  try {
    const tasks = getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError') {
      alert("⚠️ 瀏覽器儲存空間已滿！請聯繫管理員清理舊任務，或使用「匯出備份」後清除資料。");
    }
  }
};

export const deleteTask = (id: string): void => {
  const tasks = getTasks();
  const newTasks = tasks.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
};

export const getTaskById = (id: string): Task | undefined => {
  const tasks = getTasks();
  return tasks.find(t => t.id === id);
};

// --- Cloudinary Upload Service ---
export const uploadPhoto = async (base64Data: string): Promise<string> => {
  const cloudName = 'dlu7qv8oq'; 
  const uploadPreset = 'unicheck'; 

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', base64Data);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Cloudinary Upload failed');
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Upload Error:", error);
    throw new Error("照片上傳失敗");
  }
};

// --- Password Management ---
export const getAdminPassword = (): string => {
  return localStorage.getItem(PASSWORD_KEY) || '0000';
};

export const saveAdminPassword = (pwd: string): void => {
  localStorage.setItem(PASSWORD_KEY, pwd);
};

// --- Announcement Management ---
export const getAnnouncements = (): Announcement[] => {
  const data = localStorage.getItem(ANNOUNCEMENTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAnnouncement = (announcement: Announcement): void => {
  const list = getAnnouncements();
  list.unshift(announcement);
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list));
};

export const deleteAnnouncement = (id: string): void => {
  const list = getAnnouncements();
  const newList = list.filter(a => a.id !== id);
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(newList));
};

// --- SYNC CENTER FEATURES (NEW) ---

// 1. Export entire system state
export const exportSystemData = (): SystemData => {
  return {
    tasks: getTasks(),
    employees: getEmployees(),
    announcements: getAnnouncements(),
    exportedAt: Date.now(),
    version: '1.0'
  };
};

// 2. Export lightweight code (tasks without photos, strictly for assignment)
export const exportAssignmentCode = (): string => {
  const data = {
    tasks: getTasks().map(t => ({ ...t, photos: [] })), // Remove photos to save space
    employees: getEmployees(),
    type: 'assignment'
  };
  return btoa(encodeURIComponent(JSON.stringify(data)));
};

// 3. Import and Smart Merge
export const importSystemData = (data: SystemData | any): { success: boolean, message: string } => {
  try {
    // Merge Employees (Union)
    const currentEmployees = getEmployees();
    const newEmployees = Array.from(new Set([...currentEmployees, ...(data.employees || [])]));
    saveEmployees(newEmployees);

    // Merge Announcements
    const currentAnnouncements = getAnnouncements();
    const mergedAnnouncements = [...data.announcements || [], ...currentAnnouncements];
    // Remove duplicates by ID
    const uniqueAnnouncements = Array.from(new Map(mergedAnnouncements.map(item => [item.id, item])).values());
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(uniqueAnnouncements));

    // Smart Merge Tasks
    const currentTasks = getTasks();
    let updatedCount = 0;
    let newCount = 0;

    const mergedTasks = [...currentTasks];

    if (data.tasks && Array.isArray(data.tasks)) {
      data.tasks.forEach((importedTask: Task) => {
        const index = mergedTasks.findIndex(t => t.id === importedTask.id);
        
        if (index === -1) {
          // New Task
          mergedTasks.push(importedTask);
          newCount++;
        } else {
          // Existing Task - Logic: If imported is 'completed', it overrides 'pending'. 
          // If both are same, use the one with later timestamp or more photos.
          const current = mergedTasks[index];
          
          let shouldUpdate = false;
          
          if (importedTask.status === 'completed' && current.status === 'pending') shouldUpdate = true;
          else if (importedTask.checklist.filter(i=>i.completed).length > current.checklist.filter(i=>i.completed).length) shouldUpdate = true;
          else if (importedTask.photos.length > current.photos.length) shouldUpdate = true;

          if (shouldUpdate) {
            mergedTasks[index] = importedTask;
            updatedCount++;
          }
        }
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedTasks));
    return { success: true, message: `同步成功！新增 ${newCount} 筆任務，更新 ${updatedCount} 筆進度。` };

  } catch (e) {
    console.error("Import error", e);
    return { success: false, message: "資料格式錯誤，無法匯入。" };
  }
};

export const parseSystemCode = (code: string): any => {
  try {
    return JSON.parse(decodeURIComponent(atob(code)));
  } catch (e) {
    return null;
  }
};