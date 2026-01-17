import React, { useState, useEffect } from 'react';
import { SupervisorView } from './components/SupervisorView';
import { EmployeeTaskView } from './components/EmployeeTaskView';
import { ResultView } from './components/ResultView';
import { PortalView } from './components/PortalView';
import { getTasks, saveTask, getTaskById, getEmployees, decodeData } from './services/storageService';
import { Task } from './types';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.hash);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);

  useEffect(() => {
    // Load data
    setTasks(getTasks());
    setEmployees(getEmployees());

    // Handle hash change for routing
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const refreshTasks = () => {
    setTasks(getTasks());
    setEmployees(getEmployees());
  };

  // Helper to extract data param from hash like #task?data=...
  const getUrlData = () => {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return null;
    
    const params = new URLSearchParams(hash.substring(qIndex + 1));
    const dataStr = params.get('data');
    if (!dataStr) return null;

    return decodeData(dataStr);
  };

  // Simple Router
  const renderContent = () => {
    // Default Route: Portal View (Entrance)
    if (!currentRoute || currentRoute === '#' || currentRoute === '#portal') {
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

    // Employee View: Handle both #task/ID and #task?data=...
    if (currentRoute.startsWith('#task')) {
      // 1. Try URL Data (Priority for cross-device)
      const urlTask = getUrlData();
      if (urlTask) {
        return (
          <EmployeeTaskView 
            task={urlTask} 
            onUpdate={(updatedTask) => {
              // Note: Saving to local storage on employee device for history
              saveTask(updatedTask);
              refreshTasks();
            }}
          />
        );
      }

      // 2. Try Local ID
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
      
      return <div className="p-10 text-center text-slate-500">任務不存在或連結已失效 (請確認網址完整性)。</div>;
    }

    // Result View: Handle both #result/ID and #result?data=...
    if (currentRoute.startsWith('#result')) {
      // 1. Try URL Data (Result sent back from employee)
      const urlTask = getUrlData();
      if (urlTask) {
        // If Manager opens this, sync the completed status to their local storage
        if (getTaskById(urlTask.id)) {
            saveTask(urlTask);
            // We do not refresh tasks immediately here to avoid jumpiness, but data is saved.
        }
        return <ResultView task={urlTask} />;
      }

      // 2. Try Local ID
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      {renderContent()}
    </div>
  );
};

export default App;