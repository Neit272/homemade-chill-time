import React, { useState } from 'react';
import { Icons } from './Icon';

interface ReportAdModalProps {
  title: string;
  embedUrl: string;
  episodeName?: string;
  onClose: () => void;
}

export const ReportAdModal: React.FC<ReportAdModalProps> = ({ title, embedUrl, episodeName, onClose }) => {
  const [desc, setDesc] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setErr('');
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '251bc3b3-871e-43d0-a8b3-7360430645a4',
          subject: `[Ad Report] ${title}${episodeName ? ` - ${episodeName}` : ''}`,
          movie: title,
          episode: episodeName || '',
          cdn_url: embedUrl,
          timestamp: timestamp || 'N/A',
          message: desc || 'No details provided',
        }),
      });
      const data = await r.json();
      if (!data.success) throw new Error(data.message || 'Send failed');
      setDone(true);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1825] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 mx-4" onClick={e => e.stopPropagation()}>
        {done ? (
          <>
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <Icons.CheckCircle size={28} className="text-green-400" />
              </div>
              <p className="text-white font-semibold text-lg">Đã gửi báo cáo!</p>
              <p className="text-slate-400 text-sm text-center">Cảm ơn bạn. Chúng tôi sẽ xử lý sớm nhất.</p>
            </div>
            <button onClick={onClose} className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-all">
              Đóng
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                <Icons.Flag size={20} className="text-red-400" />
              </div>
              <h3 className="text-white font-bold text-lg">Báo cáo quảng cáo</h3>
            </div>

            <p className="text-slate-300 text-sm mb-1 truncate">{title}</p>
            {episodeName && <p className="text-purple-400 text-sm font-medium mb-4">{episodeName}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Thời điểm xuất hiện (vd: 15:00)"
                value={timestamp}
                onChange={e => setTimestamp(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <textarea
                placeholder="Mô tả thêm (tuỳ chọn)"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />

              {err && <p className="text-red-400 text-xs">{err}</p>}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all"
              >
                {sending ? (
                  <Icons.Loader size={16} className="animate-spin" />
                ) : (
                  <Icons.Send size={16} />
                )}
                {sending ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
              <button type="button" onClick={onClose} className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition-all">
                Huỷ
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
