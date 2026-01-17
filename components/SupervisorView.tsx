import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Clock, User, Sparkles, Loader2, ArrowRight, X, Copy, BarChart2, Users, Settings, Pencil, CalendarDays, Calendar, Layers, ChevronDown, ChevronUp, Wand2, Share2, Link, LogOut, Megaphone, Bell } from 'lucide-react';
import { Task, ChecklistItem, Announcement } from '../types';
import { generateChecklistWithAI } from '../services/geminiService';
import { saveTask, deleteTask, getEmployees, saveEmployees, saveAdminPassword, getAdminPassword, getAnnouncements, saveAnnouncement, deleteAnnouncement } from '../services/storageService';
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
  
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [employees, setEmployees] = useState<string[]>([]);
  
  useEffect(() => {
    setEmployees(getEmployees());
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

  const copySystemLink = () => {
      const url = window.location.origin + window.location.pathname; // Root URL
      navigator.clipboard.writeText(url);
      alert("✅ 系統入口連結已複製！\n\n請貼到 LINE 群組，讓員工點擊進入並選擇自己的名字。");
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
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">UniCheck</h1>
          <p className="text-slate-500 mt-1">萬用任務驗收系統 - 管理後台</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           {/* Settings Button */}
           <button 
             onClick={() => setIsSettingsModalOpen(true)}
             className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
             title="系統設定"
           >
              <Settings className="w-5 h-5" />
           </button>

           <button 
             onClick={() => setIsAnnouncementModalOpen(true)}
             className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative"
             title="發布公告"
           >
              <Megaphone className="w-5 h-5" />
           </button>
           
           <div className="w-px h-6 bg-slate-200 hidden md:block mx-1"></div>

          <button 
             onClick={copySystemLink}
             className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg flex items-center shadow-sm transition-all text-sm font-medium ring-2 ring-emerald-100"
          >
             <Share2 className="w-4 h-4 mr-2" />
             傳送入口
          </button>
          
          <button 
            onClick={() => setIsEmployeeModalOpen(true)}
            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-lg flex items-center shadow-sm transition-all text-sm font-medium"
          >
            <Users className="w-4 h-4 mr-2" />
            員工管理
          </button>
          <button 
            onClick={() => setIsBatchModalOpen(true)}
            className="bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 px-4 py-2.5 rounded-lg flex items-center shadow-sm transition-all text-sm font-medium"
          >
            <Layers className="w-4 h-4 mr-2" />
            批量派發
          </button>
          <button 
            onClick={handleCreateTask}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg flex items-center shadow-sm transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            單一派發
          </button>
          
          {/* Logout/Exit */}
          <button 
            onClick={() => window.location.hash = '#portal'}
            className="ml-2 text-slate-400 hover:text-red-500"
            title="登出"
          >
             <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

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
                        onClick={() => {
                            const url = `${window.location.origin}${window.location.pathname}#task/${task.id}`;
                            navigator.clipboard.writeText(url);
                            alert(`連結已複製：\n${url}`);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="複製員工任務連結"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

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
              placeholder="輸入公告內容 (例如: 14:00 全體會議)..." 
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
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">目前公告</h3>
             {announcements.length === 0 ? (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                   目前沒有公告消息
                </div>
             ) : (
                announcements.map(item => (
                   <div key={item.id} className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-start group">
                      <div>
                         <p className="text-blue-900 font-medium">{item.content}</p>
                         <p className="text-xs text-blue-400 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-blue-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Settings Modal ---
const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [password, setPassword] = useState('');

  const handleSave = () => {
    if (!password.trim()) {
       alert("密碼不能為空");
       return;
    }
    saveAdminPassword(password.trim());
    alert("密碼已更新！下次登入請使用新密碼。");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">系統設定</h3>
            <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
         </div>
         
         <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">修改管理者密碼</label>
            <input 
               type="text" 
               className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
               placeholder="輸入新密碼..."
               value={password}
               onChange={e => setPassword(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-2">請妥善保管密碼。</p>
         </div>

         <button 
           onClick={handleSave}
           className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800"
         >
           儲存設定
         </button>
      </div>
    </div>
  );
};

// --- Sub-component: Employee Management Modal ---
const EmployeeManagementModal = ({ currentEmployees, onUpdate, onClose }: { currentEmployees: string[], onUpdate: (l: string[]) => void, onClose: () => void }) => {
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    if (currentEmployees.includes(newName.trim())) {
      alert("員工名稱已存在");
      return;
    }
    onUpdate([...currentEmployees, newName.trim()]);
    setNewName('');
  };

  const handleDelete = (name: string) => {
    if (confirm(`確定要刪除員工「${name}」嗎？`)) {
      onUpdate(currentEmployees.filter(e => e !== name));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">管理員工名單</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
           <div className="flex gap-2 mb-6">
             <input 
               type="text" 
               placeholder="輸入員工姓名..." 
               className="flex-1 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
               value={newName}
               onChange={e => setNewName(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleAdd()}
             />
             <button 
                onClick={handleAdd}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800"
             >
               新增
             </button>
           </div>
           
           <div className="space-y-2 max-h-60 overflow-y-auto">
             {currentEmployees.map(emp => (
               <div key={emp} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg group">
                 <span className="font-medium text-slate-700">{emp}</span>
                 <button 
                   onClick={() => handleDelete(emp)}
                   className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             {currentEmployees.length === 0 && <div className="text-center text-slate-400 text-sm">暫無員工，請新增</div>}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Batch Task Modal ---
const BatchTaskModal = ({ employees, onClose, onSaved }: { employees: string[], onClose: () => void, onSaved: () => void }) => {
  const [step, setStep] = useState<1|2>(1);
  const [masterTitle, setMasterTitle] = useState('');
  const [masterChecklist, setMasterChecklist] = useState<string[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [selectedEmps, setSelectedEmps] = useState<string[]>(employees);
  const [loadingAI, setLoadingAI] = useState(false);
  
  // Store individual overrides: key = employeeName
  const [taskDetails, setTaskDetails] = useState<Record<string, { areaName: string, checklist: string[] }>>({});
  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);

  // Initialize selectedEmps with all employees on mount
  useEffect(() => {
    setSelectedEmps(employees);
  }, [employees]);

  const toggleEmp = (emp: string) => {
    if (selectedEmps.includes(emp)) {
      setSelectedEmps(selectedEmps.filter(e => e !== emp));
    } else {
      setSelectedEmps([...selectedEmps, emp]);
    }
  };

  const handleMasterGenerate = async () => {
    if (!masterTitle.trim()) return;
    setLoadingAI(true);
    const items = await generateChecklistWithAI(masterTitle);
    setMasterChecklist(items);
    setLoadingAI(false);
  };

  const initializeDetails = () => {
    const details: Record<string, { areaName: string, checklist: string[] }> = {};
    selectedEmps.forEach(emp => {
      details[emp] = {
        areaName: masterTitle, // Default to master title
        checklist: [...masterChecklist] // Copy master checklist
      };
    });
    setTaskDetails(details);
    setStep(2);
  };

  const updateDetail = (emp: string, field: 'areaName' | 'checklist', value: any) => {
    setTaskDetails(prev => ({
      ...prev,
      [emp]: {
        ...prev[emp],
        [field]: value
      }
    }));
  };

  const handleSaveAll = () => {
    selectedEmps.forEach(emp => {
      const detail = taskDetails[emp];
      // Validation skip: if checklist is empty, maybe skip or alert? 
      // Requirement said 3-8 items. We will enforce loose validation or just save what we have.
      // Let's create the task.
      
      const newTask: Task = {
        id: crypto.randomUUID(),
        assigneeName: emp,
        areaName: detail.areaName,
        checklist: detail.checklist.map(text => ({ id: crypto.randomUUID(), text, completed: false })),
        status: 'pending',
        photos: [],
        createdAt: Date.now(),
        startDate: startDate ? new Date(startDate).getTime() : Date.now(),
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined
      };
      saveTask(newTask);
    });
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full overflow-hidden flex flex-col max-h-[90vh] ${step === 2 ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">批量派發任務</h2>
            <p className="text-sm text-slate-500">{step === 1 ? '第一步：設定全體目標與對象' : '第二步：微調個別員工細節'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* General Settings */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">任務目標 (將作為預設名稱)</label>
                <input 
                  type="text"
                  placeholder="例如：年終大掃除、商品陳列檢查、消防設備巡檢"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={masterTitle}
                  onChange={e => setMasterTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">開始日期</label>
                    <input 
                      type="date"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">截止日期 (選填)</label>
                    <input 
                      type="date"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
              </div>

              {/* Master AI Generation */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-indigo-800 font-medium text-sm flex items-center">
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI 預設重點 (將套用於所有人)
                     </span>
                     <button 
                       onClick={handleMasterGenerate}
                       disabled={!masterTitle.trim() || loadingAI}
                       className="text-xs bg-white text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full hover:bg-indigo-50 disabled:opacity-50"
                     >
                       {loadingAI ? '生成中...' : masterChecklist.length > 0 ? '重新生成' : '立即生成'}
                     </button>
                  </div>
                  
                  {masterChecklist.length > 0 ? (
                    <div className="space-y-2">
                        {masterChecklist.map((item, idx) => (
                           <div key={idx} className="flex gap-2">
                              <input 
                                className="flex-1 p-1.5 text-sm bg-white border border-indigo-100 rounded focus:outline-none focus:border-indigo-300"
                                value={item}
                                onChange={(e) => {
                                   const next = [...masterChecklist];
                                   next[idx] = e.target.value;
                                   setMasterChecklist(next);
                                }}
                              />
                              <button onClick={() => setMasterChecklist(masterChecklist.filter((_,i) => i!==idx))} className="text-indigo-300 hover:text-indigo-500">
                                <X className="w-4 h-4" />
                              </button>
                           </div>
                        ))}
                        <button 
                           onClick={() => setMasterChecklist([...masterChecklist, "新重點"])}
                           className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center mt-2"
                        >
                           <Plus className="w-3 h-3 mr-1"/> 新增項目
                        </button>
                    </div>
                  ) : (
                    <div className="text-sm text-indigo-400 text-center py-2">
                       尚未生成重點，建議先生成以節省時間
                    </div>
                  )}
              </div>

              {/* Employee Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">選擇參與員工 ({selectedEmps.length})</label>
                  <button 
                    onClick={() => setSelectedEmps(selectedEmps.length === employees.length ? [] : employees)}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    {selectedEmps.length === employees.length ? '取消全選' : '全選'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 grid grid-cols-2 gap-2">
                  {employees.map(emp => (
                    <label key={emp} className={`flex items-center p-2 rounded cursor-pointer transition-colors ${selectedEmps.includes(emp) ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 mr-2"
                        checked={selectedEmps.includes(emp)}
                        onChange={() => toggleEmp(emp)}
                      />
                      <span className="text-sm text-slate-700">{emp}</span>
                    </label>
                  ))}
                  {employees.length === 0 && <div className="col-span-2 text-center text-slate-400 text-sm p-4">無員工資料</div>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
             <div className="space-y-4">
                <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <div className="flex-1">
                      <div className="text-xs text-slate-500 uppercase tracking-wider">任務目標</div>
                      <div className="font-bold text-slate-900">{masterTitle}</div>
                   </div>
                   <div className="flex-1 border-l border-slate-200 pl-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wider">期限</div>
                      <div className="text-sm text-slate-900">{startDate} ~ {dueDate || '無'}</div>
                   </div>
                   <div className="flex-1 border-l border-slate-200 pl-4">
                       <div className="text-xs text-slate-500 uppercase tracking-wider">總人數</div>
                       <div className="text-sm text-slate-900">{selectedEmps.length} 人</div>
                   </div>
                </div>

                <div className="space-y-3">
                   {selectedEmps.map(emp => {
                      const detail = taskDetails[emp];
                      const isExpanded = expandedEmp === emp;
                      if (!detail) return null;

                      return (
                         <div key={emp} className={`border rounded-xl transition-all ${isExpanded ? 'border-slate-300 ring-1 ring-slate-100 bg-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            {/* Header Row */}
                            <div className="flex items-center p-4 gap-4" onClick={() => setExpandedEmp(isExpanded ? null : emp)}>
                               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-slate-500" />
                               </div>
                               <div className="w-32 shrink-0 font-medium text-slate-800">{emp}</div>
                               
                               <div className="flex-1">
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-900 focus:outline-none py-1 text-slate-600 text-sm transition-colors"
                                    value={detail.areaName}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => updateDetail(emp, 'areaName', e.target.value)}
                                    placeholder="任務名稱/區域"
                                  />
                               </div>
                               
                               <div className="text-xs text-slate-400 shrink-0">
                                  {detail.checklist.length} 個重點
                               </div>
                               <button className="text-slate-400">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                               </button>
                            </div>

                            {/* Expanded Detail */}
                            {isExpanded && (
                               <div className="px-4 pb-4 pt-0 border-t border-slate-50 bg-slate-50/50 rounded-b-xl">
                                  <div className="mt-4">
                                     <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">執行重點</label>
                                        <button 
                                          onClick={() => {
                                             // Individual AI Regen
                                             setLoadingAI(true);
                                             generateChecklistWithAI(detail.areaName).then(items => {
                                                updateDetail(emp, 'checklist', items);
                                                setLoadingAI(false);
                                             });
                                          }}
                                          className="text-xs flex items-center text-indigo-600 hover:text-indigo-800"
                                        >
                                           <Wand2 className="w-3 h-3 mr-1"/> 針對此任務重新生成
                                        </button>
                                     </div>
                                     <div className="grid grid-cols-1 gap-2">
                                        {detail.checklist.map((item, i) => (
                                           <div key={i} className="flex gap-2">
                                              <input 
                                                className="flex-1 p-2 text-sm bg-white border border-slate-200 rounded focus:outline-none focus:border-slate-400"
                                                value={item}
                                                onChange={(e) => {
                                                   const next = [...detail.checklist];
                                                   next[i] = e.target.value;
                                                   updateDetail(emp, 'checklist', next);
                                                }}
                                              />
                                              <button 
                                                onClick={() => updateDetail(emp, 'checklist', detail.checklist.filter((_, idx) => idx !== i))}
                                                className="text-slate-400 hover:text-red-500"
                                              >
                                                 <Trash2 className="w-4 h-4" />
                                              </button>
                                           </div>
                                        ))}
                                         <button 
                                            onClick={() => updateDetail(emp, 'checklist', [...detail.checklist, "新檢查點"])}
                                            className="text-xs text-slate-500 hover:text-slate-800 flex items-center mt-1 py-1"
                                         >
                                            <Plus className="w-3 h-3 mr-1"/> 新增項目
                                         </button>
                                     </div>
                                  </div>
                               </div>
                            )}
                         </div>
                      );
                   })}
                </div>
             </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white shrink-0">
          {step === 1 ? (
             <div className="flex gap-3">
                <button 
                   onClick={() => {
                      if(!masterTitle.trim()) { alert('請輸入任務目標'); return; }
                      if(selectedEmps.length === 0) { alert('請至少選擇一位員工'); return; }
                      if(masterChecklist.length === 0) {
                         // Soft warn or auto-gen? Let's just encourage gen, but allow proceed if manual entry planned
                      }
                      initializeDetails();
                   }}
                   className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 flex justify-center items-center"
                >
                   下一步：微調細節 <ArrowRight className="w-4 h-4 ml-2" />
                </button>
             </div>
          ) : (
             <div className="flex gap-3">
                <button 
                   onClick={() => setStep(1)}
                   className="flex-1 py-3 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 text-slate-600"
                >
                   上一步
                </button>
                <button 
                   onClick={handleSaveAll}
                   className="flex-[2] bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800"
                >
                   確認發布 {selectedEmps.length} 筆任務
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Sub-component: Task Form Modal (Create/Edit) ---
const TaskFormModal = ({ employees, initialData, onClose, onSaved }: { employees: string[], initialData?: Task, onClose: () => void, onSaved: () => void }) => {
  const [step, setStep] = useState<1|2>(1);
  const [assignee, setAssignee] = useState(initialData?.assigneeName || (employees[0] || ''));
  const [areaName, setAreaName] = useState(initialData?.areaName || '');
  const [checklist, setChecklist] = useState<string[]>(initialData?.checklist.map(i => i.text) || []);
  
  // Date states
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(
      initialData?.startDate 
      ? new Date(initialData.startDate).toISOString().split('T')[0] 
      : today
  );
  const [dueDate, setDueDate] = useState(
      initialData?.dueDate 
      ? new Date(initialData.dueDate).toISOString().split('T')[0] 
      : ''
  );

  const [loadingAI, setLoadingAI] = useState(false);

  const isEditing = !!initialData;

  const handleGenerate = async () => {
    if (!areaName.trim()) return;
    setLoadingAI(true);
    const items = await generateChecklistWithAI(areaName);
    setChecklist(items);
    setLoadingAI(false);
    setStep(2);
  };

  const handleNext = () => {
    setStep(2);
  }

  const handleSave = () => {
    if (checklist.length < 3 || checklist.length > 8) {
        alert("重點項目必須介於 3 到 8 項之間");
        return;
    }

    const taskData: Task = {
      id: initialData?.id || crypto.randomUUID(),
      assigneeName: assignee,
      areaName,
      startDate: startDate ? new Date(startDate).getTime() : Date.now(),
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      checklist: checklist.map((text) => {
        return { 
          id: crypto.randomUUID(), 
          text, 
          completed: false 
        };
      }),
      status: initialData?.status || 'pending',
      photos: initialData?.photos || [],
      createdAt: initialData?.createdAt || Date.now()
    };
    
    // Preserve completion status if text matches during edit
    if (initialData) {
        taskData.checklist = checklist.map(text => {
            const existing = initialData.checklist.find(c => c.text === text);
            return {
                id: existing ? existing.id : crypto.randomUUID(),
                text: text,
                completed: existing ? existing.completed : false
            };
        });
    }

    saveTask(taskData);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{isEditing ? '編輯任務' : '指派新任務'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">指派員工</label>
                {employees.length > 0 ? (
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={assignee}
                    onChange={e => setAssignee(e.target.value)}
                  >
                    {!assignee && <option value="" disabled>請選擇員工</option>}
                    {employees.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                ) : (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                    目前無員工資料，請先至「管理員工」新增。
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">開始日期</label>
                    <input 
                      type="date"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">截止日期 (選填)</label>
                    <input 
                      type="date"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      min={startDate}
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">任務名稱/區域</label>
                <input 
                  type="text"
                  placeholder="例如：茶水間、1號會議室、倉庫盤點"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={areaName}
                  onChange={e => setAreaName(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                  <button 
                    onClick={handleGenerate}
                    disabled={!areaName.trim() || loadingAI || !assignee}
                    className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex justify-center items-center"
                  >
                    {loadingAI ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> AI 生成重點</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2 text-yellow-300" /> {checklist.length > 0 ? '重新生成' : 'AI 生成重點'}</>
                    )}
                  </button>
                  
                  {/* If we have checklist data (e.g. editing), allow going next without regenerating */}
                  {(checklist.length > 0 || isEditing) && (
                      <button 
                        onClick={handleNext}
                        className="px-6 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 text-slate-600 flex items-center"
                      >
                          下一步 <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                  )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-700">編輯執行重點 (3-8項)</label>
                  <span className={`text-xs ${checklist.length >= 3 && checklist.length <= 8 ? 'text-green-600' : 'text-red-500'}`}>
                    目前：{checklist.length} 項
                  </span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400"
                        value={item}
                        onChange={(e) => {
                          const newDetails = [...checklist];
                          newDetails[idx] = e.target.value;
                          setChecklist(newDetails);
                        }}
                      />
                      <button 
                        onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {checklist.length < 8 && (
                  <button 
                    onClick={() => setChecklist([...checklist, "請輸入新重點"])}
                    className="mt-2 text-xs flex items-center text-slate-500 hover:text-slate-800"
                  >
                    <Plus className="w-3 h-3 mr-1" /> 新增項目
                  </button>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 text-slate-600"
                >
                  回上一步
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800"
                >
                  {isEditing ? '儲存變更' : '確認派發'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};