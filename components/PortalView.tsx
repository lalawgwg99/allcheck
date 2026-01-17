import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, ArrowRight, CheckCircle, Clock, ChevronRight, LogOut, AlertTriangle, Lock, Search, Megaphone, X, Bell, RefreshCw, Upload, Download, FileJson, Copy, Check } from 'lucide-react';
import { Task, Announcement } from '../types';
import { getAdminPassword, getAnnouncements, exportSystemData, importSystemData, parseSystemCode, exportAssignmentCode } from '../services/storageService';

interface PortalViewProps {
  tasks: Task[];
  employees: string[];
}

const STORAGE_KEY_LAST_EMP = 'cleancheck_last_employee';

export const PortalView: React.FC<PortalViewProps> = ({ tasks, employees }) => {
  const [role, setRole] = useState<'selection' | 'employee' | 'supervisor'>('selection');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  
  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Sync State
  const [importCode, setImportCode] = useState('');
  const [syncMessage, setSyncMessage] = useState('');

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

  const verifyPassword = () => {
    const correctPassword = getAdminPassword();
    if (passwordInput === correctPassword) {
        window.location.hash = '#dashboard';
    } else {
        setPasswordError(true);
    }
  };

  const employeeTasks = selectedEmployee 
    ? tasks.filter(t => t.assigneeName === selectedEmployee).sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const pendingTasks = employeeTasks.filter(t => t.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Announcement Banner */}
      {announcements.length > 0 && (
         <div className="bg-blue-600 text-white px-4 py-2 shadow-sm relative overflow-hidden z-10">
            <div className="max-w-xl mx-auto flex items-center gap-3">
               <Megaphone className="w-4 h-4 shrink-0 animate-pulse" />
               <div className="text-sm font-medium truncate flex-1">
                  {announcements[0].content}
               </div>
            </div>
         </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-lg mx-auto">
        
        {role === 'selection' && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Logo Section */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-4 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-200 mb-2">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">UniCheck</h1>
              <p className="text-slate-500 font-medium">請選擇您的身份進入系統</p>
            </div>

            {/* Role Cards */}
            <div className="grid gap-4">
              {/* Employee Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                 <h2 className="text-lg font-bold text-slate-900 flex items-center mb-4">
                    <User className="w-5 h-5 mr-2 text-indigo-500"/> 
                    我是員工 (Employee)
                 </h2>
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {employees.length === 0 ? (
                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                           <p className="text-slate-400 text-sm mb-2">尚無員工資料</p>
                           <button 
                             onClick={() => setShowSyncModal(true)}
                             className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-100 transition-colors"
                           >
                              按此匯入資料
                           </button>
                        </div>
                    ) : (
                        employees.map(emp => (
                            <button
                                key={emp}
                                onClick={() => handleSelectEmployee(emp)}
                                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group bg-slate-50/50 text-left"
                            >
                                <span className="font-bold text-slate-700 group-hover:text-indigo-900">{emp}</span>
                                <div className="flex items-center">
                                  {tasks.filter(t => t.assigneeName === emp && t.status === 'pending').length > 0 && (
                                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full mr-2 font-bold">
                                      {tasks.filter(t => t.assigneeName === emp && t.status === 'pending').length} 待辦
                                    </span>
                                  )}
                                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </button>
                        ))
                    )}
                 </div>
              </div>

              {/* Supervisor Button */}
              <button 
                onClick={() => {
                  setShowPasswordModal(true);
                  setPasswordInput('');
                  setPasswordError(false);
                }}
                className="w-full bg-white text-slate-600 font-bold py-4 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                主管後台登入
              </button>
            </div>

            {/* Sync Footer */}
            <div className="pt-4 border-t border-slate-200/60 flex justify-center">
               <button 
                  onClick={() => setShowSyncModal(true)}
                  className="text-sm text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition-colors px-4 py-2 rounded-full hover:bg-indigo-50"
               >
                  <RefreshCw className="w-3.5 h-3.5" />
                  資料同步中心 (匯入/匯出)
               </button>
            </div>
          </div>
        )}

        {role === 'employee' && selectedEmployee && (
           <div className="w-full space-y-6 animate-in fade-in duration-500">
              {/* Employee Header */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200">
                        {selectedEmployee.slice(0,1)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">早安，{selectedEmployee}</h2>
                        <p className="text-sm text-slate-500">
                           今日待辦：<span className="text-amber-600 font-bold text-lg">{pendingTasks.length}</span>
                        </p>
                    </div>
                 </div>
                 <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors">
                    <LogOut className="w-5 h-5" />
                 </button>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                  {pendingTasks.length === 0 ? (
                    <div className="text-center py-12">
                       <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-10 h-10 text-emerald-400" />
                       </div>
                       <h3 className="text-lg font-bold text-slate-900">目前沒有待辦任務</h3>
                       <p className="text-slate-500 text-sm mt-1">請確認是否需要「同步資料」</p>
                       <button 
                          onClick={() => setShowSyncModal(true)}
                          className="mt-4 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-slate-50"
                       >
                          同步最新任務
                       </button>
                    </div>
                  ) : (
                    pendingTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => window.location.hash = `#task/${task.id}`}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 w-1.5 h-full bg-amber-400 group-hover:bg-indigo-500 transition-colors"></div>
                          <div className="flex justify-between items-center pl-2">
                              <div>
                                <h4 className="font-bold text-lg text-slate-900 mb-1">{task.areaName}</h4>
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                    <span className="flex items-center bg-slate-100 px-2 py-0.5 rounded">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {task.checklist.length} 重點
                                    </span>
                                    {task.dueDate && (
                                      <span className={`flex items-center px-2 py-0.5 rounded ${Date.now() > task.dueDate ? 'bg-red-50 text-red-600' : 'bg-slate-100'}`}>
                                          <Clock className="w-3 h-3 mr-1" />
                                          {new Date(task.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                </div>
                              </div>
                              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-slate-400">
                                <ChevronRight className="w-5 h-5" />
                              </div>
                          </div>
                        </div>
                    ))
                  )}
              </div>
              
              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                     onClick={() => window.location.hash = '#dashboard'} // Employee can technically view dashboard read-only if no pwd, but let's restrict in real app. For now, link to dashboard requires password.
                     onClickCapture={(e) => { e.preventDefault(); setShowSyncModal(true); }}
                     className="py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold shadow-sm hover:bg-slate-50 flex items-center justify-center gap-2"
                  >
                     <RefreshCw className="w-4 h-4" />
                     同步/回報資料
                  </button>
                  <button 
                     className="py-3 px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                  >
                     歷史紀錄 (開發中)
                  </button>
              </div>
           </div>
        )}
      </div>

      {/* Sync Modal */}
      {showSyncModal && (
        <SyncModal onClose={() => setShowSyncModal(false)} />
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl shadow-2xl max-w-xs w-full p-8 relative">
              <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-6">
                 <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-slate-700" />
                 </div>
                 <h3 className="text-lg font-extrabold text-slate-900">管理者驗證</h3>
                 <p className="text-xs text-slate-500 mt-1">請輸入管理密碼 (預設: 0000)</p>
              </div>
              
              <div className="space-y-4">
                 <input 
                    type="password" 
                    className={`w-full p-3 bg-slate-50 border rounded-xl text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-mono
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
                 
                 <button 
                    onClick={verifyPassword}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-transform active:scale-95 shadow-lg shadow-slate-200"
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

// --- SYNC MODAL COMPONENT ---
const SyncModal = ({ onClose }: { onClose: () => void }) => {
    const [mode, setMode] = useState<'import' | 'export'>('import');
    const [importText, setImportText] = useState('');
    const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

    const handleImportCode = () => {
        if (!importText) return;
        // Try parsing as system code
        let data = parseSystemCode(importText);
        
        // If not code, maybe it's raw JSON?
        if (!data) {
             try { data = JSON.parse(importText); } catch(e) {}
        }

        if (data) {
            const result = importSystemData(data);
            if (result.success) {
                setStatusMsg({ type: 'success', text: result.message });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setStatusMsg({ type: 'error', text: result.message });
            }
        } else {
            setStatusMsg({ type: 'error', text: "無效的代碼或格式錯誤" });
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const result = importSystemData(json);
                if (result.success) {
                    setStatusMsg({ type: 'success', text: result.message });
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    setStatusMsg({ type: 'error', text: result.message });
                }
            } catch (err) {
                setStatusMsg({ type: 'error', text: "檔案讀取失敗" });
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadBackup = () => {
        const data = exportSystemData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `unicheck_backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCopyAssignmentCode = () => {
        const code = exportAssignmentCode();
        navigator.clipboard.writeText(code);
        setStatusMsg({ type: 'success', text: "指派代碼已複製！請傳給員工貼上。" });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-indigo-600" /> 資料同步中心
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => { setMode('import'); setStatusMsg(null); }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'import' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        匯入資料 (Import)
                    </button>
                    <button 
                        onClick={() => { setMode('export'); setStatusMsg(null); }}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'export' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                        匯出/備份 (Export)
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {statusMsg && (
                        <div className={`mb-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {statusMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {statusMsg.text}
                        </div>
                    )}

                    {mode === 'import' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">方法 A：貼上代碼</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-mono text-xs"
                                        placeholder="貼上主管給的代碼..."
                                        value={importText}
                                        onChange={e => setImportText(e.target.value)}
                                    />
                                    <button 
                                        onClick={handleImportCode}
                                        disabled={!importText}
                                        className="bg-indigo-600 text-white px-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        匯入
                                    </button>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-2 text-xs text-slate-400 font-medium">或</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">方法 B：上傳備份檔 (.json)</label>
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-6 h-6 mb-2 text-slate-400 group-hover:text-indigo-500" />
                                        <p className="text-xs text-slate-500">點擊選擇檔案</p>
                                    </div>
                                    <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                                    <Copy className="w-4 h-4" /> 快速指派 (無照片)
                                </h4>
                                <p className="text-xs text-indigo-700 mb-3">產生一串輕量代碼，適合透過 LINE 傳給員工同步新任務。</p>
                                <button 
                                    onClick={handleCopyAssignmentCode}
                                    className="w-full bg-white text-indigo-600 border border-indigo-200 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
                                >
                                    複製指派代碼
                                </button>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                                    <FileJson className="w-4 h-4" /> 完整系統備份
                                </h4>
                                <p className="text-xs text-slate-500 mb-3">下載包含所有任務、照片、員工資料的完整檔案。適合回報成果或備份。</p>
                                <button 
                                    onClick={handleDownloadBackup}
                                    className="w-full bg-slate-900 text-white py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" /> 下載備份檔 (.json)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};