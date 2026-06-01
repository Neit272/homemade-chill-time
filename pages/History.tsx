import React, { useState, useEffect } from 'react';
import { getHistory, removeFromHistory, clearHistory } from '../services/localStorage';
import { HistoryItem } from '../types';
import { ContentCard } from '../components/ContentCard';
import { Icons } from '../components/Icon';

export const HistoryPage = () => {
    const [items, setItems] = useState<HistoryItem[]>([]);

    const load = () => setItems(getHistory());

    useEffect(() => {
        load();
        window.addEventListener('focus', load);
        return () => window.removeEventListener('focus', load);
    }, []);

    const handleRemove = (id: string) => {
        removeFromHistory(id);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleClearAll = () => {
        clearHistory();
        setItems([]);
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#0b0a15] p-4 md:p-8 flex flex-col items-center justify-center text-slate-500">
                <Icons.Clock size={48} className="opacity-20 mb-4" />
                <h2 className="text-xl font-bold text-slate-400 mb-2">Chưa có lịch sử xem</h2>
                <p className="text-sm">Hãy xem phim để lưu lại tiến trình của bạn</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0a15] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <Icons.Clock size={20} className="text-orange-400" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Lịch Sử Xem</h1>
                        <span className="text-slate-500 text-sm">({items.length})</span>
                    </div>
                    <button
                        onClick={handleClearAll}
                        className="px-4 py-2 bg-red-600/20 border border-red-600/30 text-red-400 rounded-xl text-sm font-medium hover:bg-red-600/30 transition-all flex items-center gap-2"
                    >
                        <Icons.X size={14} />
                        Xoá tất cả
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {items.map(item => (
                        <div key={item.id} className="relative group">
                            <ContentCard
                                item={item}
                                to={`/watch/${item.id}?ep=${item.lastEpisodeNumber || 1}&server=${item.serverIdx || 0}&t=${item.progress || 0}`}
                                episodeLabel={item.lastEpisodeNumber !== undefined ? `Tập ${item.lastEpisodeNumber}` : undefined}
                            />
                            <button
                                onClick={() => handleRemove(item.id)}
                                className="absolute -top-2 -right-2 z-20 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-700"
                            >
                                <Icons.X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
