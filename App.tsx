import React, { useState, useEffect } from 'react';
import { SupervisorView } from './components/SupervisorView';
import { EmployeeTaskView } from './components/EmployeeTaskView';
import { ResultView } from './components/ResultView';
import { PortalView } from './components/PortalView';
import { getTasks, saveTask, getTaskById, getEmployees, startAutoSync, stopAutoSync, getCloudConfig, tryProcessInviteLink } from './services/storageService';
import { Task } from './types';
import { Loader2, LogOut, CheckCircle, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.hash);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
        // 1. Try to consume invite link first
        const invited = await tryProcessInviteLink();
        
        // 2. Load Data
        setTasks(getTasks());
        setEmployees(getEmployees());

        // 3. Start Sync if config exists (either from invite or previous session)
        if (getCloudConfig()) {
            startAutoSync();
        }
        
        setIsInitializing(false);
    };

    init();

    // 4. Listeners
    const handleStorageChange = () => {
        setTasks(getTasks());
        setEmployees(getEmployees());
    };
    window.addEventListener('storage', handleStorageChange);

    const handleHashChange = () => {
      setCurrentRoute(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);

    return () => {
        stopAutoSync();
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const refreshTasks = () => {
    setTasks(getTasks());
    setEmployees(getEmployees());
  };

  if (isInitializing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <div className="text-center">
                 <Loader2 className="w-10 h-10 text-slate-900 animate-spin mx-auto mb-4" />
                 <p className="text-slate-500 font-medium">正在連線至團隊空間...</p>
              </div>
          </div>
      );
  }

  // Simple Router
  const renderContent = () => {
    // Default Route: Portal View (Lobby)
    if (!currentRoute || currentRoute === '#' || currentRoute === '#portal' || currentRoute.startsWith('#invite=')) {
       return <PortalView tasks={tasks} employees={employees} />;
    }

    // Supervisor Dashboard
    if (currentRoute === '#dashboard') {
      return (
        <SupervisorView 
          tasks={tasks} 
          refreshTasks={refreshTasks} 
          onNavigate={(taskId) => window.location.hash = `#result/${taskId}`}
        />
      );
    }

    // Personal Task List (New!)
    if (currentRoute.startsWith('#list')) {
        const empName = decodeURIComponent(currentRoute.split('/')[1]);
        const myTasks = tasks.filter(t => t.assigneeName === empName).sort((a,b) => b.createdAt - a.createdAt);
        
        return (
            <div className="min-h-screen bg-slate-50 p-4">
                <div className="max-w-lg mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">嗨，{empName}</h1>
                        <button onClick={() => window.location.hash = '#portal'} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-red-500">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {myTasks.length === 0 && (
                            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                                目前沒有分派給您的任務
                            </div>
                        )}
                        {myTasks.map(task => (
                             <div 
                                key={task.id}
                                onClick={() => window.location.hash = task.status === 'completed' ? `#result/${task.id}` : `#task/${task.id}`}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm active:scale-[0.98]
                                   ${task.status === 'completed' ? 'bg-slate-50 opacity-70 border-slate-200' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                                `}
                             >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {task.status === 'completed' ? '已完成' : '待辦中'}
                                    </span>
                                    {task.dueDate && <span className="text-xs text-slate-400">期限: {new Date(task.dueDate).toLocaleDateString()}</span>}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{task.areaName}</h3>
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Employee View: #task/taskId
    if (currentRoute.startsWith('#task')) {
      if (currentRoute.includes('/')) {
        const taskId = currentRoute.split('/')[1];
        const task = getTaskById(taskId);
        if (task) {
          return (
            <EmployeeTaskView 
              task={task} 
              onUpdate={(updatedTask) => {
                saveTask(updatedTask);
                refreshTasks();
              }}
            />
          );
        }
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">任務不存在</h2>
                <p className="text-slate-500 mb-6">可能已被刪除或資料尚未同步。</p>
                <button onClick={() => window.location.hash = '#portal'} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">返回大廳</button>
            </div>
        </div>
      );
    }

    // Result View: #result/taskId
    if (currentRoute.startsWith('#result')) {
      if (currentRoute.includes('/')) {
        const taskId = currentRoute.split('/')[1];
        const task = getTaskById(taskId);
        if (task) return <ResultView task={task} />;
      }
      return <div className="p-10 text-center text-slate-500">任務記錄不存在。</div>;
    }

    return <div className="p-10 text-center">404 Not Found</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">
      {renderContent()}
    </div>
  );
};

export default App;