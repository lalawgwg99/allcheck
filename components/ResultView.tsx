import React from 'react';
import { Task } from '../types';
import { CheckCircle, Calendar, User, MapPin, Clock } from 'lucide-react';

export const ResultView: React.FC<{ task: Task }> = ({ task }) => {
  return (
    <div className="max-w-2xl mx-auto p-6 md:p-12 space-y-8">
      {/* Header Badge */}
      <div className="flex justify-center">
        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
          <CheckCircle className="w-4 h-4" />
          {task.status === 'completed' ? '驗收報告' : '任務進行中'}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">{task.areaName}</h1>
        <p className="text-slate-500">整理成果展示</p>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">負責員工</div>
            <div className="font-medium text-slate-900">{task.assigneeName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">完成時間</div>
            <div className="font-medium text-slate-900">
              {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
            </div>
          </div>
        </div>
        {task.dueDate && (
             <div className="flex items-center gap-3 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                    <Clock className="w-4 h-4" />
                </div>
                <div>
                   <div className="text-xs text-slate-500 uppercase tracking-wider">指派期限</div>
                   <div className="text-sm text-slate-900">
                      {task.startDate ? new Date(task.startDate).toLocaleDateString() : '無'} 
                      <span className="mx-2 text-slate-300">→</span>
                      {new Date(task.dueDate).toLocaleDateString()}
                   </div>
                </div>
             </div>
        )}
      </div>

      {/* Checklist Status */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">檢查重點執行狀況</h3>
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          {task.checklist.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-0.5 ${item.completed ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className={`text-sm ${item.completed ? 'text-slate-700' : 'text-slate-400'}`}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Photos Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">現場照片 ({task.photos.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {task.photos.map((photo, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <img 
                src={photo} 
                alt={`Proof ${idx + 1}`} 
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in" 
                onClick={() => {
                    const w = window.open("");
                    w?.document.write(`<img src="${photo}" style="width:100%; margin: 0 auto;" />`);
                }}
              />
            </div>
          ))}
          {task.photos.length === 0 && (
             <div className="col-span-2 py-12 bg-slate-50 rounded-xl text-center text-slate-400 text-sm">
                尚未上傳照片
             </div>
          )}
        </div>
      </div>

      <div className="text-center pt-8">
        <a href="#dashboard" className="text-sm text-slate-500 hover:text-slate-900 underline underline-offset-4">
          回到主管儀表板
        </a>
      </div>
    </div>
  );
};