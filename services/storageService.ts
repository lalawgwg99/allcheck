import { Task, DEFAULT_EMPLOYEES, Announcement } from '../types';

const STORAGE_KEY = 'cleancheck_tasks_v1';
const EMPLOYEES_KEY = 'cleancheck_employees_v1';
const PASSWORD_KEY = 'cleancheck_admin_pwd';
const ANNOUNCEMENTS_KEY = 'cleancheck_announcements_v1';

// --- URL Data Encoding Helpers (核心功能：網址傳輸資料) ---
export const encodeData = (data: any): string => {
  try {
    const jsonStr = JSON.stringify(data);
    // 使用 encodeURIComponent 處理中文，再轉 base64，確保網址安全
    return btoa(encodeURIComponent(jsonStr));
  } catch (e) {
    console.error("Encode error", e);
    return "";
  }
};

export const decodeData = (str: string): any => {
  try {
    const jsonStr = decodeURIComponent(atob(str));
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Decode error", e);
    return null;
  }
};

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
      alert("儲存空間已滿！請聯繫管理員清理舊任務。");
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
  // Cloudinary 設定
  const cloudName = 'dlu7qv8oq'; 
  const uploadPreset = 'unicheck'; 

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', base64Data);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Cloudinary Upload failed');
    }

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