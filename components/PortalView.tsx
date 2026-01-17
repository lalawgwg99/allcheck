import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, ArrowRight, Store, Loader2, Link, Copy, Check, Users, Sparkles, LogIn } from 'lucide-react';
import { Task, Announcement } from '../types';
import { getAdminPassword, getAnnouncements, getCloudConfig, saveCloudConfig, syncFromCloud, getFullSystemData, clearCloudConfig, saveAdminPassword, saveEmployees, getEmployees, saveAccessCode } from '../services/storageService';
import { createCloudStore, encodeCloudConfig } from '../services/cloudService';

interface PortalViewProps {
  tasks: Task[];
  employees: string[];
}

const STORAGE_KEY_LAST_EMP = 'cleancheck_last_employee';

export const PortalView: React.FC<PortalViewProps> = ({ tasks, employees }) => {
  const [hasConfig, setHasConfig] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Lobby State
  const [myRole, setMyRole] = useState<'employee' | 'admin'>('employee');
  const [myName, setMyName] = useState('');
  const [adminPwdInput, setAdminPwdInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Initial Load
  useEffect(() => {
    const config = getCloudConfig();
    if (config) {
      setHasConfig(true);
      setStoreName(config.storeName || '我的團隊');
      // Auto-sync on load to ensure data is fresh (Device Switch Support)
      handleSync(true);
    }
    
    // Auto-fill last used name
    const lastEmp = localStorage.getItem(STORAGE_KEY_LAST_EMP);
    if (lastEmp) setMyName(lastEmp);

  }, []);

  const handleSync = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    await syncFromCloud(silent);
    if (!silent) setIsSyncing(false);
  };

  const handleJoin = () => {
    if (!myName.trim()) {
        setLoginError("請輸入您的姓名");
        return;
    }

    // Save user preference
    localStorage.setItem(STORAGE_KEY_LAST_EMP, myName.trim());
    
    // Add to employee list if new
    const currentEmployees = getEmployees();
    if (!currentEmployees.includes(myName.trim())) {
        const newReason = [...currentEmployees, myName.trim()];
        saveEmployees(newReason);
    }

    // Enter
    window.location.hash = '#task/dashboard'; // Assuming employee view logic handles this or we redirect
    // Small hack: Trigger a re-render/navigation in App.tsx by changing hash
    // We actually want to go to the employee's view logic.
    // Let's stick to the previous pattern: Select Employee -> Show Dashboard
    
    // Since App.tsx handles routing based on hash, we need to handle "Login" state there or here.
    // To keep it simple "Google Meet" style:
    // This Component (PortalView) is the "Lobby". Once joined, we switch the URL.
    
    // Find a pending task for this user or go to their list
    const myTasks = tasks.filter(t => t.assigneeName === myName.trim() && t.status === 'pending');
    if (myTasks.length > 0) {
        window.location.hash = `#task/${myTasks[0].id}`;
    } else {
        // No specific task? Go to a generic list view or stay here?
        // Let's create a generic "My List" route in App.tsx later, 
        // For now, let's use a special hash or just handle state in App. 
        // actually, let's just trigger the 'employee' view in this component if we want, 
        // OR better: redirect to a "personal dashboard"
        
        // Let's redirect to the "EmployeeDashboard" (we need to create/update App.tsx to support #list/EmployeeName)
        window.location.hash = `#list/${encodeURIComponent(myName.trim())}`;
    }
  };

  const handleAdminLogin = () => {
    const correctPwd = getAdminPassword();
    if (adminPwdInput === correctPwd) {
        window.location.hash = '#dashboard';
    } else {
        setLoginError("管理密碼錯誤");
    }
  };

  // --- SCENE 1: CREATE (No Config) ---
  if (!hasConfig) {
      return <CreateSpaceWizard />;
  }

  // --- SCENE 2: LOBBY (Has Config) ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
       <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
          
          {/* Header / Preview Area */}
          <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
             <div className="relative z-10">
                <div className="inline-flex p-3 bg-white/10 rounded-full mb-4 backdrop-blur-md">
                   <Store className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">{storeName}</h1>
                <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                   {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                   {isSyncing ? '同步資料中...' : '系統已連線'}
                </p>
             </div>
             
             {/* Invite Link Button (Tiny) */}
             <button 
                onClick={() => {
                   const config = getCloudConfig();
                   if(config) {
                      const code = encodeCloudConfig(config);
                      const url = `${window.location.origin}${window.location.pathname}#invite=${code}`;
                      navigator.clipboard.writeText(url);
                      alert("連結已複製！請傳送給其他裝置或員工。");
                   }
                }}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 rounded-full hover:bg-white/20 transition-all"
                title="複製邀請連結"
             >
                <Link className="w-4 h-4" />
             </button>
          </div>

          {/* Login Body */}
          <div className="p-8 space-y-6">
             {/* Tabs */}
             <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                   onClick={() => { setMyRole('employee'); setLoginError(''); }}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${myRole === 'employee' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                   員工報到
                </button>
                <button 
                   onClick={() => { setMyRole('admin'); setLoginError(''); }}
                   className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${myRole === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                   主管登入
                </button>
             </div>

             {myRole === 'employee' ? (
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">您的姓名</label>
                      <div className="relative">
                         <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                         <input 
                            type="text" 
                            value={myName}
                            onChange={e => { setMyName(e.target.value); setLoginError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleJoin()}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-lg font-medium"
                            placeholder="請輸入名字"
                            autoFocus
                         />
                      </div>
                   </div>
                   
                   {loginError && <div className="text-red-500 text-sm text-center font-medium animate-pulse">{loginError}</div>}

                   <button 
                      onClick={handleJoin}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                   >
                      <LogIn className="w-5 h-5" />
                      加入工作
                   </button>
                </div>
             ) : (
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">管理密碼</label>
                      <div className="relative">
                         <ShieldCheck className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                         <input 
                            type="password" 
                            value={adminPwdInput}
                            onChange={e => { setAdminPwdInput(e.target.value); setLoginError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-lg font-bold tracking-widest"
                            placeholder="••••"
                         />
                      </div>
                   </div>

                   {loginError && <div className="text-red-500 text-sm text-center font-medium animate-pulse">{loginError}</div>}

                   <button 
                      onClick={handleAdminLogin}
                      className="w-full bg-white border-2 border-slate-900 text-slate-900 py-3 rounded-xl font-bold text-lg hover:bg-slate-50 transition-transform active:scale-[0.98]"
                   >
                      進入後台
                   </button>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

// --- Create Space Wizard ---
const CreateSpaceWizard: React.FC = () => {
    const [step, setStep] = useState(1);
    const [storeName, setStoreName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [adminPwd, setAdminPwd] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!storeName || !apiKey || !adminPwd) {
            alert("請填寫所有欄位");
            return;
        }
        setLoading(true);
        
        // 1. Prepare Initial Data
        const initialData = getFullSystemData();
        initialData.adminPassword = adminPwd;
        
        // 2. Create Cloud Store
        const config = await createCloudStore(apiKey.trim(), initialData, storeName.trim());
        
        if (config) {
            saveCloudConfig(config);
            saveAdminPassword(adminPwd);
            window.location.reload();
        } else {
            alert("建立失敗，請檢查 API Key (Master Key)");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex justify-center">
                   <div className="p-4 bg-indigo-50 rounded-full">
                      <Sparkles className="w-10 h-10 text-indigo-600" />
                   </div>
                </div>
                
                <div className="space-y-2">
                   <h1 className="text-3xl font-bold text-slate-900">建立您的工作空間</h1>
                   <p className="text-slate-500">只需設定一次，之後分享連結即可。</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">團隊名稱</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                           placeholder="例如：台北一店" value={storeName} onChange={e => setStoreName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">管理員密碼 (您自己要記住)</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                           placeholder="設定後台密碼" value={adminPwd} onChange={e => setAdminPwd(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">伺服器金鑰 (JSONBin Master Key)</label>
                        <input className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs" 
                           placeholder="$2a$10$..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
                        <div className="mt-2 text-xs text-slate-400">
                           <a href="https://jsonbin.io/app/keys" target="_blank" className="text-indigo-600 underline">按此取得免費金鑰</a> (需要註冊 JSONBin)
                        </div>
                    </div>
                </div>

                <button 
                   onClick={handleCreate}
                   disabled={loading}
                   className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex justify-center items-center"
                >
                   {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : '建立並開始使用'}
                </button>
            </div>
        </div>
    );
};