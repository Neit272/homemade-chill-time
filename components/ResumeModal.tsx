import React from 'react';
import { Icons } from './Icon';

interface ResumeModalProps {
  title: string;
  episodeName?: string;
  progress: number;
  onResume: () => void;
  onStartOver: () => void;
  onClose: () => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export const ResumeModal: React.FC<ResumeModalProps> = ({
  title, episodeName, progress, onResume, onStartOver, onClose
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-[#1a1825] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 mx-4" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
          <Icons.Clock size={20} className="text-purple-400" />
        </div>
        <h3 className="text-white font-bold text-lg">Tiếp tục xem?</h3>
      </div>

      <p className="text-slate-300 text-sm mb-1">{title}</p>
      {episodeName && (
        <p className="text-purple-400 text-sm font-medium mb-3">{episodeName}</p>
      )}
      <p className="text-slate-400 text-xs mb-6">
        Lần trước bạn đã xem tới <span className="text-white font-medium">{fmt(progress)}</span>
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={onResume}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all"
        >
          <Icons.Play size={16} className="fill-current" />
          Xem tiếp
        </button>
        <button
          onClick={onStartOver}
          className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-slate-300 font-medium transition-all"
        >
          Xem lại từ đầu
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-all"
        >
          Đóng
        </button>
      </div>
    </div>
  </div>
);
