import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, User, Sparkles, Loader2, ArrowRight, X, Copy, BarChart2, Users, Settings, Pencil, Calendar, Layers, LogOut, Megaphone, Link as LinkIcon, Share2, Cloud, AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
import { Task, ChecklistItem, Announcement } from '../types';
import { generateChecklistWithAI } from '../services/geminiService';
import { saveTask, deleteTask, getEmployees, saveEmployees, saveAdminPassword, getAdminPassword, getAnnouncements, saveAnnouncement, deleteAnnouncement, getCloudConfig, saveCloudConfig, getFullSystemData } from '../services/storageService';
import { encodeCloudConfig, createCloudStore } from '../services/cloudService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SupervisorViewProps {
  tasks: Task[];
  refreshTasks: () => void;
  onNavigate: (taskId: string) => void;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({ tasks, refreshTasks, onNavigate }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  
  // First Time Password Set Modal
  const [isFirstTimeModalOpen, setIsFirstTimeModalOpen] = useState(false);
  
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [employees, setEmployees] = useState<string[]>([]);
  
  useEffect(() => {
    setEmployees(getEmployees());
    
    // Check if password is default 'admin'
    if (getAdminPassword() === 'admin') {
        setIsFirstTimeModalOpen(true);
    }
  }, []);

  const handleUpdateEmployees = (newList: string[]) => {
    saveEmployees(newList);
    setEmployees(newList);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  const copyInviteLink = () => {
    const config = getCloudConfig();
    if (config) {
        if (config.apiKey === 'local') {
            alert("【需啟用雲端同步】\n\n目前是「單機模式」，連結只能在本機使用。\n\n要產生給員工的連結，請先點擊「設定」並貼上雲端金鑰 (API Key)。");
            setIsSettingsModalOpen(true);
        } else {
            const code = encodeCloudConfig(config);
            const url = `${window.location.origin}${window.location.pathname}#invite=${code}`;
            navigator.clipboard.writeText(url);
            alert("✅ 連結已複製！\n\n請直接貼到 Line 群組，員工點擊後輸入姓名即可加入。");
        }
    }
  };

  // Dashboard Metrics
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Chart Data
  const chartData = employees.map(emp => {
    const empTasks = tasks.filter(t => t.assigneeName === emp);
    const completed = empTasks.filter(t => t.status === 'completed').length;
    return { name: emp, completed };
  }).filter(d => d.completed > 0);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 space-y-6 md:space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">UniCheck</h1>
          <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
            管理後台 
            {getCloudConfig()?.apiKey === 'local' && (
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">單機模式</span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <button 
             onClick={copyInviteLink}
             className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 transition-all font-bold flex-1 md:flex-none animate-in fade-in zoom-in duration-500"
           >
              <LinkIcon className="w-4 h-4 mr-2" />
              複製員工邀請連結
           </button>
           
           <div className="flex gap-2">
                <button 
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="p-3 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl relative"
                    title="設定"
                >
                    <Settings className="w-5 h-5" />
                    {getCloudConfig()?.apiKey === 'local' && (
                         <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    )}
                </button>
                <button 
                    onClick={() => setIsAnnouncementModalOpen(true)}
                    className="p-3 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl"
                    title="公告"
                >
                    <Megaphone className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => window.location.hash = '#portal'}
                    className="p-3 text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl"
                    title="登出"
                >
                    <LogOut className="w-5 h-5" />
                </button>
           </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={handleCreateTask} className="flex-shrink-0 bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center shadow-md">
            <Plus className="w-4 h-4 mr-2" /> 單一派發
          </button>
          <button onClick={() => setIsBatchModalOpen(true)} className="flex-shrink-0 bg-white border border-slate-200 text-indigo-600 px-5 py-3 rounded-xl font-bold flex items-center shadow-sm">
            <Layers className="w-4 h-4 mr-2" /> 批量派發
          </button>
          <button onClick={() => setIsEmployeeModalOpen(true)} className="flex-shrink-0 bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold flex items-center shadow-sm">
            <Users className="w-4 h-4 mr-2" /> 員工管理
          </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} 
          label="已完成任務" 
          value={completedCount} 
          bgColor="bg-emerald-50"
        />
        <MetricCard 
          icon={<Clock className="w-5 h-5 text-amber-600" />} 
          label="進行中任務" 
          value={pendingCount} 
          bgColor="bg-amber-50"
        />
        <MetricCard 
          icon={<BarChart2 className="w-5 h-5 text-blue-600" />} 
          label="總體達成率" 
          value={`${completionRate}%`} 
          bgColor="bg-blue-50"
        />
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
           <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">員工績效統計</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                 <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                 <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 />
                 <Bar dataKey="completed" radius={[4, 4, 0, 0]} barSize={40}>
                   {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#0f172a" />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* Task List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">任務列表</h3>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">目前沒有指派任務</div>
          ) : (
            tasks.sort((a,b) => b.createdAt - a.createdAt).map(task => {
                const isOverdue = task.status === 'pending' && task.dueDate && Date.now() > task.dueDate;
                
                return (
                  <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                        <span className="font-semibold text-slate-800 text-lg">{task.areaName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {task.status === 'completed' ? '已完成' : isOverdue ? '已逾期' : '進行中'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center text-sm text-slate-500 mt-2 gap-4">
                        <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1.5"/> {task.assigneeName}</span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {task.startDate ? new Date(task.startDate).toLocaleDateString() : '無'} 
                            <span className="text-slate-300">→</span> 
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '無期限'}
                        </span>
                        <span>{task.checklist.length} 個執行重點</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditTask(task)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="編輯任務"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      
                      {task.status === 'completed' && (
                         <button 
                         onClick={() => onNavigate(task.id)}
                         className="text-sm border border-slate-200 hover:border-slate-300 text-slate-600 px-4 py-2 rounded-lg flex items-center transition-colors bg-white"
                       >
                         查看成果 <ArrowRight className="w-3.5 h-3.5 ml-2"/>
                       </button>
                      )}
                      
                      <button 
                        onClick={() => {
                          if(confirm('確定要刪除此任務嗎？')) {
                            deleteTask(task.id);
                            refreshTasks();
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
            })
          )}
        </div>
      </div>

      {isTaskModalOpen && (
        <TaskFormModal 
          employees={employees}
          initialData={editingTask}
          onClose={() => setIsTaskModalOpen(false)} 
          onSaved={() => {
            setIsTaskModalOpen(false);
            refreshTasks();
          }} 
        />
      )}
      
      {isBatchModalOpen && (
        <BatchTaskModal 
          employees={employees}
          onClose={() => setIsBatchModalOpen(false)}
          onSaved={() => {
            setIsBatchModalOpen(false);
            refreshTasks();
          }}
        />
      )}

      {isEmployeeModalOpen && (
        <EmployeeManagementModal 
          currentEmployees={employees}
          onUpdate={handleUpdateEmployees}
          onClose={() => setIsEmployeeModalOpen(false)}
        />
      )}

      {isAnnouncementModalOpen && (
        <AnnouncementModal onClose={() => setIsAnnouncementModalOpen(false)} />
      )}

      {isSettingsModalOpen && (
        <SettingsModal 
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {isFirstTimeModalOpen && (
        <FirstTimePasswordModal onClose={() => setIsFirstTimeModalOpen(false)} />
      )}
    </div>
  );
};

const MetricCard = ({ icon, label, value, bgColor }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg ${bgColor}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
    </div>
  </div>
);

// --- FirstTimePasswordModal ---
const FirstTimePasswordModal = ({ onClose }: { onClose: () => void }) => {
    const [pwd, setPwd] = useState('');
    
    const handleSave = () => {
        if (!pwd) return alert("請輸入密碼");
        saveAdminPassword(pwd);
        alert("密碼設定完成！下次登入請使用此密碼。");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-indigo-600 p-6 text-white text-center">
                <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-90" />
                <h2 className="text-xl font-bold">請設定管理員密碼</h2>
                <p className="text-indigo-100 text-sm mt-1">為了安全，請將預設密碼修改為您的專屬密碼。</p>
            </div>
            <div className="p-6 space-y-4">
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="請輸入新密碼" 
                        value={pwd}
                        onChange={e => setPwd(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold"
                        autoFocus
                    />
                </div>
                <button 
                    onClick={handleSave}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg"
                >
                    確認設定
                </button>
            </div>
          </div>
        </div>
    );
};

// --- Sub-component: Announcement Modal ---
const AnnouncementModal = ({ onClose }: { onClose: () => void }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [content, setContent] = useState('');

  useEffect(() => {
    setAnnouncements(getAnnouncements());
  }, []);

  const handleAdd = () => {
    if (!content.trim()) return;
    const newAnnouncement: Announcement = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: Date.now()
    };
    saveAnnouncement(newAnnouncement);
    setAnnouncements(getAnnouncements());
    setContent('');
  };

  const handleDelete = (id: string) => {
    if (confirm("確定要刪除此公告？")) {
      deleteAnnouncement(id);
      setAnnouncements(getAnnouncements());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-600" /> 公告管理
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="輸入公告內容..." 
              className="flex-1 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button 
               onClick={handleAdd}
               className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              發布
            </button>
          </div>

          <div className="space-y-3">
             {announcements.map(item => (
                <div key={item.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-start group">
                   <div>
                      <p className="text-blue-900 font-medium">{item.content}</p>
                      <p className="text-xs text-blue-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                   </div>
                   <button 
                     onClick={() => handleDelete(item.id)}
                     className="text-blue-300 hover:text-red-500 p-1"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Settings Modal ---
const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [adminPwd, setAdminPwd] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLocal, setIsLocal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAdminPwd(getAdminPassword());
    const config = getCloudConfig();
    if (config) {
        setIsLocal(config.apiKey === 'local');
        setApiKey(config.apiKey === 'local' ? '' : config.apiKey);
    }
  }, []);

  const handleSave = async () => {
    saveAdminPassword(adminPwd);
    
    // Upgrade to Cloud
    if (isLocal && apiKey.trim()) {
        const confirmUpgrade = confirm("確定要啟用雲端同步嗎？\n\n這將會把目前的資料上傳到雲端，讓其他員工可以同步看到。");
        if (confirmUpgrade) {
            setLoading(true);
            const currentData = getFullSystemData();
            const config = getCloudConfig();
            if (config) {
                // Try create real store with new key
                const newConfig = await createCloudStore(apiKey.trim(), currentData, config.storeName);
                if (newConfig) {
                    saveCloudConfig(newConfig);
                    alert("雲端同步已啟用！\n現在您可以分享連結給員工了。");
                    window.location.reload();
                } else {
                    alert("連線失敗，請檢查 API Key");
                }
            }
            setLoading(false);
        }
    } else {
        alert("密碼已更新");
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">系統設定</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        
        <div className="p-6 space-y-6">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">管理員密碼</label>
               <input 
                  type="text" 
                  value={adminPwd} 
                  onChange={e => setAdminPwd(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-wider"
               />
            </div>

            {/* Cloud Upgrade Section */}
            <div className={`p-4 rounded-xl border ${isLocal ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <Cloud className={`w-5 h-5 ${isLocal ? 'text-amber-600' : 'text-emerald-600'}`} />
                    <h3 className={`font-bold text-sm ${isLocal ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {isLocal ? '單機運作中' : '雲端同步中'}
                    </h3>
                </div>
                {isLocal ? (
                    <div className="space-y-2">
                        <p className="text-xs text-amber-700">
                           若要讓員工也能在手機上看到任務，請填入 JSONBin Master Key 以啟用雲端同步。
                        </p>
                        <input 
                            type="text" 
                            placeholder="在此貼上 API Key 以升級..."
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            className="w-full p-2 text-xs bg-white border border-amber-300 rounded font-mono"
                        />
                        <div className="text-right">
                             <a href="https://jsonbin.io/app/keys" target="_blank" className="text-[10px] text-amber-600 underline">取得 Key</a>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-emerald-700">
                        系統已成功連線至雲端資料庫。
                    </p>
                )}
            </div>

            <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 flex justify-center"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '儲存設定'}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- TaskFormModal ---
const TaskFormModal = ({ employees, initialData, onClose, onSaved }: { employees: string[], initialData?: Task, onClose: () => void, onSaved: () => void }) => {
  const [areaName, setAreaName] = useState(initialData?.areaName || '');
  const [assignee, setAssignee] = useState(initialData?.assigneeName || (employees[0] || ''));
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialData?.checklist || []);
  const [newItem, setNewItem] = useState('');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '');
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAddItem = () => {
    if(!newItem.trim()) return;
    setChecklist([...checklist, { id: crypto.randomUUID(), text: newItem.trim(), completed: false }]);
    setNewItem('');
  };

  const handleAiGenerate = async () => {
    if(!areaName) return alert("請先輸入區域名稱");
    setLoadingAi(true);
    const items = await generateChecklistWithAI(areaName);
    const newItems = items.map(text => ({ id: crypto.randomUUID(), text, completed: false }));
    setChecklist([...checklist, ...newItems]);
    setLoadingAi(false);
  };

  const handleSave = () => {
    if(!areaName || !assignee) return alert("請填寫完整資訊");
    
    const task: Task = {
      id: initialData?.id || crypto.randomUUID(),
      areaName,
      assigneeName: assignee,
      checklist,
      status: initialData?.status || 'pending',
      photos: initialData?.photos || [],
      createdAt: initialData?.createdAt || Date.now(),
      startDate: initialData?.startDate || Date.now(),
      dueDate: dueDate ? new Date(dueDate).getTime() + 86399999 : undefined // end of day
    };
    saveTask(task);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800">{initialData ? '編輯任務' : '新增任務'}</h2>
             <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 overflow-y-auto space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">區域/房間名稱</label>
                <input value={areaName} onChange={e => setAreaName(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="例如：201號房" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">負責人</label>
                   <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full p-3 border rounded-lg bg-white">
                      {employees.map(e => <option key={e} value={e}>{e}</option>)}
                      <option value="">+ 請在員工管理新增</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">截止日期</label>
                   <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 border rounded-lg" />
                </div>
             </div>
             
             <div>
                <div className="flex justify-between items-end mb-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase">檢查重點</label>
                   <button onClick={handleAiGenerate} disabled={loadingAi} className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                      {loadingAi ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Sparkles className="w-3 h-3 mr-1"/>}
                      AI 自動生成
                   </button>
                </div>
                <div className="flex gap-2 mb-2">
                   <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="flex-1 p-2 border rounded-lg text-sm" placeholder="輸入檢查項目..." />
                   <button onClick={handleAddItem} className="bg-slate-100 px-3 rounded-lg hover:bg-slate-200"><Plus className="w-4 h-4"/></button>
                </div>
                <div className="space-y-2">
                   {checklist.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                         <span className="text-xs font-mono text-slate-400 w-5">{idx+1}.</span>
                         <input 
                            value={item.text} 
                            onChange={e => {
                               const newList = [...checklist];
                               newList[idx].text = e.target.value;
                               setChecklist(newList);
                            }}
                            className="flex-1 bg-transparent text-sm focus:outline-none"
                         />
                         <button onClick={() => setChecklist(checklist.filter(i => i.id !== item.id))} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                      </div>
                   ))}
                </div>
             </div>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button onClick={onClose} className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-medium">取消</button>
             <button onClick={handleSave} className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 shadow-lg shadow-slate-200">儲存任務</button>
          </div>
       </div>
    </div>
  );
};

// --- BatchTaskModal ---
const BatchTaskModal = ({ employees, onClose, onSaved }: { employees: string[], onClose: () => void, onSaved: () => void }) => {
   const [textInput, setTextInput] = useState('');
   const [assignee, setAssignee] = useState(employees[0] || '');
   const [commonChecklist, setCommonChecklist] = useState<ChecklistItem[]>([]);
   const [newItem, setNewItem] = useState('');

   const handleAddItem = () => {
    if(!newItem.trim()) return;
    setCommonChecklist([...commonChecklist, { id: crypto.randomUUID(), text: newItem.trim(), completed: false }]);
    setNewItem('');
   };

   const handleSave = () => {
      const areas = textInput.split('\n').map(s => s.trim()).filter(Boolean);
      if(areas.length === 0) return alert("請輸入至少一個區域");
      if(!assignee) return alert("請選擇負責人");

      areas.forEach(area => {
         const task: Task = {
            id: crypto.randomUUID(),
            areaName: area,
            assigneeName: assignee,
            checklist: commonChecklist.map(i => ({ ...i, id: crypto.randomUUID() })), // Clone items
            status: 'pending',
            photos: [],
            createdAt: Date.now(),
            startDate: Date.now()
         };
         saveTask(task);
      });
      onSaved();
   };

   return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800">批量建立任務</h2>
             <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 overflow-y-auto space-y-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">區域清單 (一行一個)</label>
                <textarea 
                   value={textInput} 
                   onChange={e => setTextInput(e.target.value)} 
                   className="w-full p-3 border rounded-lg h-32 font-mono text-sm" 
                   placeholder="201號房&#10;202號房&#10;203號房" 
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">統一負責人</label>
                <select value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full p-3 border rounded-lg bg-white">
                    {employees.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">共用檢查重點</label>
                <div className="flex gap-2 mb-2">
                   <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="flex-1 p-2 border rounded-lg text-sm" placeholder="輸入檢查項目..." />
                   <button onClick={handleAddItem} className="bg-slate-100 px-3 rounded-lg hover:bg-slate-200"><Plus className="w-4 h-4"/></button>
                </div>
                <div className="space-y-1">
                   {commonChecklist.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
                         <span className="w-4">{idx+1}.</span>
                         <span>{item.text}</span>
                         <button onClick={() => setCommonChecklist(commonChecklist.filter(i => i.id !== item.id))} className="ml-auto text-slate-400"><X className="w-3 h-3"/></button>
                      </div>
                   ))}
                </div>
             </div>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button onClick={onClose} className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-medium">取消</button>
             <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">開始建立</button>
          </div>
       </div>
    </div>
   );
};

// --- EmployeeManagementModal ---
const EmployeeManagementModal = ({ currentEmployees, onUpdate, onClose }: { currentEmployees: string[], onUpdate: (list: string[]) => void, onClose: () => void }) => {
   const [newName, setNewName] = useState('');

   const handleAdd = () => {
      if(!newName.trim()) return;
      if(currentEmployees.includes(newName.trim())) return alert("員工已存在");
      onUpdate([...currentEmployees, newName.trim()]);
      setNewName('');
   };

   const handleDelete = (name: string) => {
      if(confirm(`確定要刪除 ${name} 嗎？`)) {
         onUpdate(currentEmployees.filter(e => e !== name));
      }
   };

   return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
       <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h2 className="text-xl font-bold text-slate-800">員工管理</h2>
             <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6">
             <div className="flex gap-2 mb-6">
                <input 
                   value={newName} 
                   onChange={e => setNewName(e.target.value)} 
                   onKeyDown={e => e.key === 'Enter' && handleAdd()}
                   className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                   placeholder="輸入員工姓名..." 
                />
                <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 rounded-lg font-medium hover:bg-indigo-700">新增</button>
             </div>
             <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {currentEmployees.map(emp => (
                   <div key={emp} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg group">
                      <span className="font-medium text-slate-700">{emp}</span>
                      <button onClick={() => handleDelete(emp)} className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                ))}
                {currentEmployees.length === 0 && <div className="text-center text-slate-400">目前沒有員工資料</div>}
             </div>
          </div>
       </div>
    </div>
   );
};