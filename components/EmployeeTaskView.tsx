import React, { useState } from 'react';
import { Task } from '../types';
import { uploadPhoto, encodeData } from '../services/storageService'; // Import encodeData
import { CheckSquare, Square, Camera, Send, CheckCircle, X, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

interface EmployeeTaskViewProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const EmployeeTaskView: React.FC<EmployeeTaskViewProps> = ({ task, onUpdate }) => {
  const [localTask, setLocalTask] = useState<Task>(task);
  const [uploading, setUploading] = useState(false);
  const [isSuccessAnimating, setIsSuccessAnimating] = useState(false);

  // Constants
  const MIN_PHOTOS = 3;
  const MAX_PHOTOS = 8;

  const toggleCheck = (itemId: string) => {
    if (localTask.status === 'completed' || isSuccessAnimating) return;
    
    const newChecklist = localTask.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setLocalTask({ ...localTask, checklist: newChecklist });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (localTask.status === 'completed' || isSuccessAnimating) return;
    const files = e.target.files;
    if (!files) return;

    if (localTask.photos.length + files.length > MAX_PHOTOS) {
      alert(`最多只能上傳 ${MAX_PHOTOS} 張照片`);
      return;
    }

    setUploading(true);
    const newPhotos: string[] = [];
    let errorCount = 0;

    // Process uploads sequentially to avoid overwhelming the network
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // 1. Resize locally first
        const base64 = await resizeAndConvertToBase64(file);
        // 2. Upload to Cloudinary
        const cloudUrl = await uploadPhoto(base64);
        newPhotos.push(cloudUrl);
      } catch (err) {
        console.error("Photo process error", err);
        errorCount++;
      }
    }

    if (errorCount > 0) {
        alert(`${errorCount} 張照片上傳失敗，請檢查網路連線後再試。`);
    }

    setLocalTask(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
    setUploading(false);
    
    // Clear input value to allow selecting same file again if needed
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    if (localTask.status === 'completed' || isSuccessAnimating) return;
    setLocalTask(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const allChecked = localTask.checklist.every(item => item.completed);
  const photoCountValid = localTask.photos.length >= MIN_PHOTOS && localTask.photos.length <= MAX_PHOTOS;
  const canComplete = allChecked && photoCountValid;

  const handleComplete = async () => {
    if (!canComplete) return;
    if (!confirm("確認完成任務並送出？")) return;

    setIsSuccessAnimating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const completedTask: Task = {
      ...localTask,
      status: 'completed',
      completedAt: Date.now()
    };
    onUpdate(completedTask);
  };

  const handleShare = () => {
    // NEW: Encode the full task data (including Cloudinary URLs) into the URL
    const encodedData = encodeData(localTask);
    const resultLink = `${window.location.origin}${window.location.pathname}#result?data=${encodedData}`;
    
    const text = `【任務完成】\n名稱：${localTask.areaName}\n負責人：${localTask.assigneeName}\n\n我已經完成任務並上傳了 ${localTask.photos.length} 張照片。\n\n👇 點擊連結查看成果 (此連結含完整報告)：\n${resultLink}`;
    
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const isOverdue = localTask.dueDate && Date.now() > localTask.dueDate && localTask.status !== 'completed';

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-white pb-20">
      {/* Top Bar */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-100 z-10 px-6 py-4">
         <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">Task #{localTask.id.slice(0,4)}</span>
            </div>
            {localTask.dueDate && (
                <div className={`flex items-center gap-1 text-sm font-medium ${isOverdue ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded' : 'text-slate-500'}`}>
                    {isOverdue && <AlertCircle className="w-4 h-4" />}
                    <span>截止：{new Date(localTask.dueDate).toLocaleDateString()}</span>
                </div>
            )}
         </div>
         <h1 className="text-2xl font-bold text-slate-900">{localTask.areaName}</h1>
         <p className="text-slate-500">負責人：{localTask.assigneeName}</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Checklist Section */}
        <section>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex justify-between items-center">
            <span>待辦事項</span>
            <span className={`text-xs px-2 py-1 rounded-full ${allChecked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {localTask.checklist.filter(i => i.completed).length}/{localTask.checklist.length} 完成
            </span>
          </h2>
          <div className="space-y-3">
            {localTask.checklist.map(item => (
              <div 
                key={item.id} 
                onClick={() => toggleCheck(item.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none
                  ${item.completed 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-white border-slate-300 shadow-sm hover:border-slate-400'
                  }`}
              >
                <div className={`mt-0.5 ${item.completed ? 'text-emerald-500' : 'text-slate-300'}`}>
                  {item.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </div>
                <span className={`${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Photo Upload Section */}
        <section>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex justify-between items-center">
             <span>成果照片 ({MIN_PHOTOS}-{MAX_PHOTOS}張)</span>
             <span className={`text-xs px-2 py-1 rounded-full ${photoCountValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
               目前 {localTask.photos.length} 張
             </span>
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {localTask.photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                <img src={photo} alt={`Evidence ${idx}`} className="w-full h-full object-cover" />
                {localTask.status !== 'completed' && !isSuccessAnimating && (
                  <button 
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {localTask.status !== 'completed' && !isSuccessAnimating && localTask.photos.length < MAX_PHOTOS && (
              <label className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors
                  ${uploading ? 'bg-slate-50 border-slate-300 cursor-wait' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}
              `}>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading ? (
                  <span className="text-xs flex flex-col items-center text-slate-500">
                     <Loader2 className="w-6 h-6 mb-2 animate-spin text-emerald-500" />
                     上傳中...
                  </span>
                ) : (
                  <>
                    <Camera className="w-8 h-8 mb-2 text-slate-400" />
                    <span className="text-xs font-medium text-slate-500">拍照/上傳</span>
                  </>
                )}
              </label>
            )}
          </div>
          {!photoCountValid && localTask.photos.length > 0 && (
             <p className="text-xs text-amber-600 mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                還差 {Math.max(0, MIN_PHOTOS - localTask.photos.length)} 張照片才能完成任務
             </p>
          )}
        </section>

        {/* Action Area */}
        <div className="pt-4 pb-8">
          {localTask.status === 'completed' ? (
            <div className="space-y-4 animate-in fade-in zoom-in duration-500">
              <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl flex flex-col items-center justify-center font-medium shadow-sm border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-lg font-bold">任務驗收完成！</div>
                <div className="text-sm opacity-80 mt-1">感謝您的辛勞付出 🎉</div>
              </div>
              <button 
                onClick={handleShare}
                className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-100 flex items-center justify-center transition-all hover:scale-[1.02]"
              >
                <Send className="w-5 h-5 mr-2" />
                分享至 LINE 群組
              </button>
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!canComplete || isSuccessAnimating || uploading}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all duration-500 transform
                ${isSuccessAnimating 
                    ? 'bg-emerald-500 text-white scale-105 shadow-xl ring-4 ring-emerald-200' 
                    : canComplete 
                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02]' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              {isSuccessAnimating ? (
                 <>
                   <Sparkles className="w-6 h-6 mr-2 animate-pulse text-yellow-300" />
                   任務提交中... ✨
                 </>
              ) : (
                 <>
                   <CheckCircle className="w-5 h-5 mr-2" />
                   {canComplete ? '完成並送出' : '請完成所有檢查與照片'}
                 </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper to optimize image before upload (Client-side compression)
const resizeAndConvertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280; // Limit width to 1280px for faster uploads
        
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
            height = height * (MAX_WIDTH / width);
            width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to JPEG at 80% quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};