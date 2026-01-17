export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  assigneeName: string; // 員工姓名
  areaName: string; // 區域名稱
  checklist: ChecklistItem[]; // 3-8個重點
  status: 'pending' | 'completed';
  photos: string[]; // Base64 strings or Cloudinary URLs, 2-6張
  createdAt: number;
  completedAt?: number;
  startDate?: number; // timestamp
  dueDate?: number; // timestamp
}

export interface Announcement {
  id: string;
  content: string;
  createdAt: number;
}

// 預設為空，讓主管自己新增
export const DEFAULT_EMPLOYEES: string[] = []; 

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CREATE_TASK = 'CREATE_TASK',
  DO_TASK = 'DO_TASK', // 員工執行畫面
  RESULT = 'RESULT' // 檢視結果
}