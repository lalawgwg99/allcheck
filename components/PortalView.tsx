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
      if (config.apiKey !== 'local') {
          handleSync(true);
      }
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
    window.location.hash = `#list/${encodeURIComponent(myName.trim())}`;
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
                   {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <div className={`w-2 h-2 rounded-full ${getCloudConfig()?.apiKey === 'local' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>}
                   {isSyncing ? '同步資料中...' : getCloudConfig()?.apiKey === 'local' ? '本機模式 (尚未連線雲端)' : '系統已連線'}
                </p>
             </div>
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
                            placeholder="預設為 admin"
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
    const [storeName, setStoreName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!storeName) {
            alert("請設定店鋪名稱");
            return;
        }
        setLoading(true);
        
        // 1. Prepare Initial Data
        const initialData = getFullSystemData();
        // DEFAULT ADMIN PASSWORD
        const defaultPwd = 'admin';
        initialData.adminPassword = defaultPwd;
        
        // 2. Create LOCAL Config (Bypass Cloud for now)
        const config = await createCloudStore('local', initialData, storeName.trim());
        
        if (config) {
            saveCloudConfig(config);
            saveAdminPassword(defaultPwd);
            // DIRECT ENTRY
            window.location.hash = '#dashboard';
            window.location.reload();
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
                   <h1 className="text-3xl font-bold text-slate-900">歡迎使用 UniCheck</h1>
                   <p className="text-slate-500">免註冊，3 秒鐘立即建立工作環境。</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">團隊/店鋪名稱</label>
                        <input 
                           className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-medium" 
                           placeholder="例如：台北一店" 
                           value={storeName} 
                           onChange={e => setStoreName(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleCreate()}
                           autoFocus 
                        />
                    </div>
                </div>

                <button 
                   onClick={handleCreate}
                   disabled={loading}
                   className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all flex justify-center items-center"
                >
                   {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : '建立並直接進入'}
                </button>
            </div>
        </div>
    );
};