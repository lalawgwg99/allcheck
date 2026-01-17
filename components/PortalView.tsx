import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, ArrowRight, CheckCircle, Clock, ChevronRight, LogOut, AlertTriangle, Lock, Search, Megaphone, X, Bell } from 'lucide-react';
import { Task, Announcement } from '../types';
import { getAdminPassword, getAnnouncements } from '../services/storageService';

interface PortalViewProps {
  tasks: Task[];
  employees: string[];
}

const STORAGE_KEY_LAST_EMP = 'cleancheck_last_employee';

export const PortalView: React.FC<PortalViewProps> = ({ tasks, employees }) => {
  const [role, setRole] = useState<'selection' | 'employee' | 'supervisor'>('selection');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  
  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Auto-login check on mount
  useEffect(() => {
    const lastEmp = localStorage.getItem(STORAGE_KEY_LAST_EMP);
    if (lastEmp && employees.includes(lastEmp)) {
      setRole('employee');
      setSelectedEmployee(lastEmp);
    }
    setAnnouncements(getAnnouncements());
  }, [employees]);

  const handleSelectEmployee = (emp: string) => {
    localStorage.setItem(STORAGE_KEY_LAST_EMP, emp);
    setSelectedEmployee(emp);
    setRole('employee');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_LAST_EMP);
    setSelectedEmployee(null);
    setRole('selection');
  };

  const handleSupervisorClick = () => {
    setShowPasswordModal(true);
    setPasswordInput('');
    setPasswordError(false);
  };

  const verifyPassword = () => {
    const correctPassword = getAdminPassword();
    if (passwordInput === correctPassword) {
        window.location.hash = '#dashboard';
    } else {
        setPasswordError(true);
    }
  };

  // Filter tasks for the selected employee
  const employeeTasks = selectedEmployee 
    ? tasks.filter(t => t.assigneeName === selectedEmployee).sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const pendingTasks = employeeTasks.filter(t => t.status === 'pending');
  const completedTasks = employeeTasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Announcement Banner */}
      {announcements.length > 0 && (
         <div className="bg-blue-600 text-white px-4 py-3 shadow-md relative overflow-hidden">
            <div className="max-w-lg mx-auto flex items-start gap-3">
               <Bell className="w-5 h-5 shrink-0 animate-bounce mt-0.5" />
               <div className="flex-1">
                  <p className="font-bold text-sm mb-1">最新公告</p>
                  <div className="space-y-1">
                    {announcements.slice(0, 3).map(a => (
                        <div key={a.id} className="text-sm opacity-90 border-l-2 border-white/30 pl-2">
                           {a.content} <span className="text-xs opacity-60 ml-1">({new Date(a.createdAt).toLocaleDateString()})</span>
                        </div>
                    ))}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        
        {role === 'selection' && (
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-slate-900 text-white mb-4 shadow-xl shadow-slate-200">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">UniCheck</h1>
              <p className="text-slate-500 text-lg">請選擇您的身份進入系統</p>
            </div>

            <div className="grid gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                 <h2 className="font-semibold text-slate-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-slate-500"/> 
                    員工登入
                 </h2>
                 <div className="space-y-2">
                    {employees.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 bg-slate-50 rounded-lg">
                           尚未建立員工名單
                        </div>
                    ) : (
                        employees.map(emp => (
                            <button
                                key={emp}
                                onClick={() => handleSelectEmployee(emp)}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all group bg-white text-left"
                            >
                                <span className="font-medium text-slate-700 group-hover:text-slate-900">{emp}</span>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                            </button>
                        ))
                    )}
                 </div>
              </div>

              <button 
                onClick={handleSupervisorClick}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium py-2 flex items-center justify-center gap-2 transition-colors"
              >
                <Lock className="w-3 h-3" />
                主管後台登入
              </button>
            </div>
          </div>
        )}

        {role === 'employee' && selectedEmployee && (
           <div className="w-full max-w-lg space-y-6 animate-in fade-in duration-500">
              {/* Employee Header */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
                        {selectedEmployee.slice(0,1)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">早安，{selectedEmployee}</h2>
                        <p className="text-sm text-slate-500">
                           您有 <span className="text-amber-600 font-bold">{pendingTasks.length}</span> 個待辦任務
                        </p>
                    </div>
                 </div>
                 <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                    <LogOut className="w-5 h-5" />
                 </button>
              </div>

              {/* Task Lists */}
              <div className="space-y-6">
                 <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                       <Clock className="w-4 h-4 mr-1.5" /> 待辦任務
                    </h3>
                    <div className="space-y-3">
                       {pendingTasks.length === 0 ? (
                          <div className="text-center py-8 bg-white/50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                             太棒了！目前沒有待辦任務 🎉
                          </div>
                       ) : (
                          pendingTasks.map(task => (
                             <div 
                                key={task.id}
                                onClick={() => window.location.hash = `#task/${task.id}`}
                                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                             >
                                <div className="absolute left-0 top-0 w-1.5 h-full bg-amber-500"></div>
                                <div className="flex justify-between items-center">
                                   <div>
                                      <h4 className="font-bold text-lg text-slate-900 mb-1">{task.areaName}</h4>
                                      <div className="flex items-center gap-3 text-sm text-slate-500">
                                         {task.dueDate && (
                                             <span className={`flex items-center ${Date.now() > task.dueDate ? 'text-red-500 font-medium' : ''}`}>
                                                 {Date.now() > task.dueDate && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                 {new Date(task.dueDate).toLocaleDateString()} 截止
                                             </span>
                                         )}
                                         <span>• {task.checklist.length} 個重點</span>
                                      </div>
                                   </div>
                                   <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors text-amber-600">
                                      <ChevronRight className="w-5 h-5" />
                                   </div>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </div>

                 {completedTasks.length > 0 && (
                    <div className="opacity-80">
                       <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1.5" /> 已完成 ({completedTasks.length})
                       </h3>
                       <div className="space-y-3">
                          {completedTasks.map(task => (
                             <div 
                                key={task.id}
                                onClick={() => window.location.hash = `#result/${task.id}`}
                                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                             >
                                <span className="font-medium text-slate-600 line-through decoration-slate-300">{task.areaName}</span>
                                <span className="text-xs text-slate-400">
                                   {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}
                                </span>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
              </div>
           </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 relative">
              <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-6">
                 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-slate-600" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900">管理者驗證</h3>
                 <p className="text-sm text-slate-500 mt-1">請輸入管理密碼以繼續</p>
              </div>
              
              <div className="space-y-4">
                 <input 
                    type="password" 
                    placeholder="輸入密碼 (預設: 0000)" 
                    className={`w-full p-3 bg-slate-50 border rounded-xl text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all
                        ${passwordError ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-slate-200'}
                    `}
                    value={passwordInput}
                    onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setPasswordError(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
                    autoFocus
                 />
                 {passwordError && <p className="text-xs text-red-500 text-center font-medium">密碼錯誤，請重試。</p>}
                 
                 <button 
                    onClick={verifyPassword}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-transform active:scale-95"
                 >
                    確認登入
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};