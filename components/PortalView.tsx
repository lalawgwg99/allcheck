import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, ArrowRight, CheckCircle, Clock, ChevronRight, LogOut, Lock, Megaphone, X, Store, CloudLightning, Loader2, KeyRound, Copy, Check } from 'lucide-react';
import { Task, Announcement } from '../types';
import { getAdminPassword, getAnnouncements, getCloudConfig, saveCloudConfig, syncFromCloud, getFullSystemData, clearCloudConfig } from '../services/storageService';
import { createCloudStore, encodeCloudConfig, decodeCloudConfig } from '../services/cloudService';

interface PortalViewProps {
  tasks: Task[];
  employees: string[];
}

const STORAGE_KEY_LAST_EMP = 'cleancheck_last_employee';

export const PortalView: React.FC<PortalViewProps> = ({ tasks, employees }) => {
  const [role, setRole] = useState<'login' | 'employee' | 'supervisor'>('login');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  
  // Cloud State
  const [isConnected, setIsConnected] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Init
  useEffect(() => {
    // Check Cloud Connection
    const config = getCloudConfig();
    if (config) {
      setIsConnected(true);
      setStoreName(config.storeName || '我的店鋪');
    }

    // Check Last Employee
    const lastEmp = localStorage.getItem(STORAGE_KEY_LAST_EMP);
    if (lastEmp && employees.includes(lastEmp)) {
      setRole('employee');
      setSelectedEmployee(lastEmp);
    }

    setAnnouncements(getAnnouncements());
  }, [employees]); 

  const handleSync = async () => {
    setIsSyncing(true);
    await syncFromCloud();
    setIsSyncing(false);
    setAnnouncements(getAnnouncements());
  };

  const handleSelectEmployee = (emp: string) => {
    localStorage.setItem(STORAGE_KEY_LAST_EMP, emp);
    setSelectedEmployee(emp);
    setRole('employee');
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY_LAST_EMP);
    setSelectedEmployee(null);
    setRole('login');
  };

  const handleStoreLogout = () => {
    if(confirm("確定要登出店鋪嗎？\n登出後需要重新輸入「店鋪連線碼」才能登入。")) {
        clearCloudConfig();
        setIsConnected(false);
        setStoreName('');
        window.location.reload();
    }
  }

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
      {announcements.length > 0 && isConnected && (
         <div className="bg-blue-600 text-white px-4 py-2 shadow-sm relative overflow-hidden z-10 animate-in slide-in-from-top duration-500">
            <div className="max-w-xl mx-auto flex items-center gap-3">
               <Megaphone className="w-4 h-4 shrink-0 animate-pulse" />
               <div className="text-sm font-medium truncate flex-1">
                  {announcements[0].content}
               </div>
            </div>
         </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 w-full max-w-lg mx-auto">
        
        {/* VIEW: LOGIN / SELECTION */}
        {role === 'login' && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Logo Section */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-4 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-200 mb-2">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">UniCheck</h1>
              {isConnected && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <button 
                      onClick={handleSync}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 transition-colors"
                    >
                        <Store className="w-3 h-3 mr-1" />
                        {storeName} {isSyncing ? '(同步中...)' : '(已連線)'}
                    </button>
                    <button onClick={handleStoreLogout} className="text-xs text-slate-400 hover:text-red-500 underline">
                        登出
                    </button>
                  </div>
              )}
            </div>

            {/* Connection View (If not connected) */}
            {!isConnected ? (
              <StoreLoginForm onConnected={() => setIsConnected(true)} />
            ) : (
              /* Logged In View */
              <>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h2 className="text-lg font-bold text-slate-900 flex items-center mb-4 justify-between">
                      <span className="flex items-center"><User className="w-5 h-5 mr-2 text-slate-500"/> 選擇員工登入</span>
                      <button onClick={handleSync} className="p-1 text-slate-400 hover:text-indigo-600" title="手動同步">
                         <CloudLightning className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      </button>
                   </h2>
                   <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {employees.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                           尚無員工資料<br/>請主管登入後台新增
                        </div>
                      ) : (
                        employees.map(emp => (
                          <button
                            key={emp}
                            onClick={() => handleSelectEmployee(emp)}
                            className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 font-medium text-slate-700 transition-all flex justify-between items-center group"
                          >
                            <span>{emp}</span>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))
                      )}
                   </div>
                </div>

                <div className="text-center">
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="text-sm font-semibold text-slate-400 hover:text-slate-800 transition-colors flex items-center justify-center gap-2 w-full py-4"
                  >
                    <Lock className="w-3 h-3" />
                    我是主管 (進入管理後台)
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* VIEW: EMPLOYEE DASHBOARD */}
        {role === 'employee' && (
           <div className="w-full h-full flex flex-col animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900">早安，{selectedEmployee}</h1>
                    <p className="text-slate-500 text-sm">今日還有 {pendingTasks.length} 項任務待完成</p>
                 </div>
                 <button onClick={handleLogout} className="p-2 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-700">
                    <LogOut className="w-5 h-5" />
                 </button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pb-20">
                 {pendingTasks.length === 0 && employeeTasks.length > 0 && (
                    <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                       <CheckCircle className="w-12 h-12 mb-3 text-emerald-500" />
                       <div className="font-bold text-lg">太棒了！</div>
                       <div className="text-sm opacity-80">所有指派任務都已完成</div>
                    </div>
                 )}

                 {employeeTasks.length === 0 && (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                       目前沒有指派給您的任務
                    </div>
                 )}

                 {employeeTasks.map(task => {
                    const isCompleted = task.status === 'completed';
                    const isOverdue = !isCompleted && task.dueDate && Date.now() > task.dueDate;
                    
                    return (
                       <div 
                         key={task.id}
                         onClick={() => {
                            if (isCompleted) {
                                window.location.hash = `#result/${task.id}`;
                            } else {
                                window.location.hash = `#task/${task.id}`;
                            }
                         }}
                         className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm active:scale-[0.98]
                            ${isCompleted ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'}
                         `}
                       >
                          <div className="flex justify-between items-start mb-2">
                             <div className={`px-2 py-1 rounded text-xs font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                {isCompleted ? '已完成' : isOverdue ? '已逾期' : '待辦'}
                             </div>
                             {task.dueDate && (
                                <div className="text-xs text-slate-400 flex items-center">
                                   <Clock className="w-3 h-3 mr-1" />
                                   {new Date(task.dueDate).toLocaleDateString()}
                                </div>
                             )}
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 mb-1">{task.areaName}</h3>
                          <div className="flex justify-between items-center text-sm text-slate-500">
                             <span>{task.checklist.length} 個檢查點</span>
                             <ChevronRight className="w-4 h-4 text-slate-300" />
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        )}

      </div>

      {/* Supervisor Password Modal */}
      {showPasswordModal && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900">管理者登入</h3>
                  <button onClick={() => setShowPasswordModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               
               <p className="text-sm text-slate-500 mb-4">請輸入密碼進入後台。</p>
               
               <input 
                  type="password" 
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 mb-4 text-center text-lg tracking-widest ${passwordError ? 'border-red-300 ring-red-100' : 'border-slate-200 ring-slate-100'}`}
                  placeholder="••••"
                  autoFocus
                  value={passwordInput}
                  onChange={e => {
                     setPasswordInput(e.target.value);
                     setPasswordError(false);
                  }}
                  onKeyDown={e => e.key === 'Enter' && verifyPassword()}
               />

               <button 
                 onClick={verifyPassword}
                 className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 flex justify-center items-center"
               >
                 登入
               </button>
               <div className="mt-3 text-center">
                 <button onClick={() => alert("預設密碼為 0000")} className="text-xs text-slate-400 hover:text-slate-600 underline">
                    忘記密碼?
                 </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

// --- Store Login / Setup Components ---

const StoreLoginForm: React.FC<{ onConnected: () => void }> = ({ onConnected }) => {
  const [mode, setMode] = useState<'enter' | 'create'>('enter');
  const [storeKey, setStoreKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create Mode State
  const [apiKey, setApiKey] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    
    try {
        const config = decodeCloudConfig(storeKey.trim());
        if (!config) throw new Error("無效的連線碼");
        
        saveCloudConfig(config);
        const success = await syncFromCloud();
        
        if (success) {
            onConnected();
        } else {
            throw new Error("連線失敗，請檢查連線碼是否正確");
        }
    } catch (e: any) {
        setError(e.message || "連線失敗");
    } finally {
        setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!apiKey.trim() || !newStoreName.trim()) {
        setError("請填寫所有欄位");
        return;
    }
    setLoading(true);
    setError('');

    const initialData = getFullSystemData();
    const config = await createCloudStore(apiKey.trim(), initialData, newStoreName.trim());

    if (config) {
        saveCloudConfig(config); // Auto login creator
        const shareCode = encodeCloudConfig(config);
        setCreatedKey(shareCode);
    } else {
        setError("建立失敗，請檢查 API Key 是否正確 (需有 Master 權限)");
    }
    setLoading(false);
  };

  if (createdKey) {
     return (
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg animate-in zoom-in duration-300">
           <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-600" />
           </div>
           <h3 className="text-xl font-bold text-center text-slate-900 mb-2">店鋪建立成功！</h3>
           <p className="text-sm text-center text-slate-500 mb-6">請務必複製下方的「連線碼」，並分享給所有員工。</p>
           
           <div className="bg-slate-100 p-4 rounded-xl break-all font-mono text-xs text-slate-600 border border-slate-200 mb-4 relative group">
              {createdKey}
           </div>
           
           <button 
             onClick={() => {
                navigator.clipboard.writeText(createdKey);
                alert("已複製連線碼！");
             }}
             className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-3"
           >
              <Copy className="w-4 h-4" /> 複製連線碼
           </button>

           <button 
             onClick={onConnected}
             className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold"
           >
              進入系統
           </button>
        </div>
     );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all">
       <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
          <button 
            onClick={() => setMode('enter')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'enter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            員工登入
          </button>
          <button 
            onClick={() => setMode('create')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            建立新店鋪
          </button>
       </div>

       {mode === 'enter' ? (
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">店鋪連線碼</label>
                <div className="relative">
                   <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                   <input 
                      type="text" 
                      className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="請輸入主管提供的連線碼..."
                      value={storeKey}
                      onChange={e => setStoreKey(e.target.value)}
                   />
                </div>
             </div>
             
             {error && <div className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded">{error}</div>}

             <button 
                onClick={handleConnect}
                disabled={loading || !storeKey}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-md shadow-indigo-100 flex items-center justify-center disabled:opacity-50"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '連線並同步'}
             </button>
          </div>
       ) : (
          <div className="space-y-4">
             <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800">
                <span className="font-bold block mb-1">💡 首次使用說明</span>
                本系統使用 JSONBin 免費雲端資料庫。請先至 <a href="https://jsonbin.io/app/keys" target="_blank" className="underline font-bold">jsonbin.io</a> 註冊並取得 Master Key。
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">店鋪名稱</label>
                <input 
                   type="text" 
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                   placeholder="例如：台北站前店"
                   value={newStoreName}
                   onChange={e => setNewStoreName(e.target.value)}
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">JSONBin Master Key</label>
                <input 
                   type="text" 
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs"
                   placeholder="$2a$10$..."
                   value={apiKey}
                   onChange={e => setApiKey(e.target.value)}
                />
             </div>

             {error && <div className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded">{error}</div>}

             <button 
                onClick={handleCreate}
                disabled={loading || !apiKey || !newStoreName}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center disabled:opacity-50"
             >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '建立並產生連線碼'}
             </button>
          </div>
       )}
    </div>
  );
};