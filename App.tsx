import React, { useState, useEffect } from 'react';
import { SupervisorView } from './components/SupervisorView';
import { EmployeeTaskView } from './components/EmployeeTaskView';
import { ResultView } from './components/ResultView';
import { PortalView } from './components/PortalView';
import { getTasks, saveTask, getTaskById, deleteTask, getEmployees } from './services/storageService';
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

  // Simple Router
  const renderContent = () => {
    // Default Route: Portal View (Entrance)
    // If hash is empty or just # or #portal
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

    // Employee View: #task/taskId
    if (currentRoute.startsWith('#task/')) {
      const taskId = currentRoute.split('/')[1];
      const task = getTaskById(taskId);
      if (!task) return <div className="p-10 text-center text-slate-500">任務不存在或已被刪除。</div>;
      
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

    // Result View: #result/taskId
    if (currentRoute.startsWith('#result/')) {
      const taskId = currentRoute.split('/')[1];
      const task = getTaskById(taskId);
      if (!task) return <div className="p-10 text-center text-slate-500">任務記錄不存在。</div>;

      return <ResultView task={task} />;
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