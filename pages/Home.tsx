import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getFeaturedContent, getComicsList } from '../services/api';
import { getHistory } from '../services/localStorage';
import { HistoryItem } from '../types';
import { ContentItem } from '../types';
import { ContentCard } from '../components/ContentCard';
import { ContentCardSkeleton } from '../components/ContentCardSkeleton';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Icons } from '../components/Icon';
import { check$Code, is$Mode, set$Mode } from '../services/api.ob';

const Hero = ({ item }: { item: ContentItem }) => (
    <div className="relative w-full h-[50vh] md:h-[65vh] rounded-3xl overflow-hidden mb-8 md:mb-12 group mx-auto border border-white/5 shadow-2xl">
        <img src={item.backdropImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"%3E%3Crect fill="%231a1825" width="1200" height="675"/%3E%3C/svg%3E'; e.currentTarget.onerror = null; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a15] via-[#0b0a15]/60 md:via-[#0b0a15]/30 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full md:w-2/3 lg:w-1/2">
            <span className="inline-block px-3 py-1 mb-3 bg-red-600 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                Nổi Bật
            </span>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg leading-tight line-clamp-2">
                {item.title}
            </h1>
            <p className="text-slate-300 text-xs md:text-base line-clamp-2 mb-4 md:mb-6 drop-shadow-md font-medium italic opacity-90">
                {item.description}
            </p>
            <div className="flex gap-3 md:gap-4">
                <Link to={`/watch/${item.id}`} className="px-5 py-2.5 md:px-6 md:py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 transition-all text-sm md:text-base shadow-lg shadow-purple-900/50 hover:shadow-purple-900/70 hover:-translate-y-1">
                    <Icons.Play size={18} className="fill-current" /> Xem Ngay
                </Link>
                <Link to={`/details/${item.id}`} className="px-5 py-2.5 md:px-6 md:py-3 bg-white/10 backdrop-blur-md text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10 text-sm md:text-base">
                    Chi Tiết
                </Link>
            </div>
        </div>
    </div>
);

const preloadImages = (items: ContentItem[]) => {
    items.forEach((item) => {
        const img = new Image();
        img.src = item.coverImage;
    });
};

const InfiniteHorizontalList = ({ title, initialItems, type, isHistory = false }: { title: string, initialItems: ContentItem[], type?: 'movie' | 'comic', isHistory?: boolean }) => {
    const [items, setItems] = useState<ContentItem[]>(initialItems);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setItems(initialItems);
        if (initialItems.length > 0) preloadImages(initialItems);
    }, [initialItems]);

    const loadMore = useCallback(async () => {
        if (loadingMore || isHistory || !hasMore) return;
        setLoadingMore(true);
        
        const nextPage = page + 1;
        const newItems = type === 'comic' 
            ? await getComicsList(nextPage) 
            : await getFeaturedContent(nextPage);
        
        if (newItems.length > 0) {
            setItems(prev => {
                const existingIds = new Set(prev.map(i => i.id));
                const uniqueNewItems = newItems.filter(i => !existingIds.has(i.id));
                preloadImages(uniqueNewItems);
                return [...prev, ...uniqueNewItems];
            });
            setPage(nextPage);
        } else {
            setHasMore(false);
        }
        setLoadingMore(false);
    }, [page, loadingMore, type, isHistory, hasMore]);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            if (scrollLeft + clientWidth >= scrollWidth * 0.7) {
                loadMore();
            }
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -600 : 600;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (items.length === 0) return null;

    return (
        <section className="mb-12 relative group/section">
             <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <span className={`w-1.5 h-8 rounded-full ${isHistory ? 'bg-orange-500' : 'bg-purple-600'}`}></span>
                        {title}
                    </h2>
                    {loadingMore && <span className="text-xs text-purple-400 animate-pulse hidden sm:inline">Đang tải thêm...</span>}
                </div>
                
                {(type === 'movie' || type === 'comic') && (
                    <Link 
                        to={type === 'comic' ? '/comics' : '/new-movies'} 
                        className="text-xs md:text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                    >
                        Xem tất cả <Icons.ChevronRight size={14} />
                    </Link>
                )}
            </div>

            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scroll('left');
                }}
                className="hidden md:flex absolute left-0 top-[55%] -translate-y-1/2 z-50 bg-black/50 hover:bg-purple-600/80 p-3 rounded-full text-white opacity-0 group-hover/section:opacity-100 transition-all backdrop-blur-sm border border-white/10"
            >
                <Icons.ChevronLeft size={24} />
            </button>
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scroll('right');
                }}
                className="hidden md:flex absolute right-0 top-[55%] -translate-y-1/2 z-50 bg-black/50 hover:bg-purple-600/80 p-3 rounded-full text-white opacity-0 group-hover/section:opacity-100 transition-all backdrop-blur-sm border border-white/10"
            >
                <Icons.ChevronRight size={24} />
            </button>

            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto gap-4 pb-8 px-1 hide-scrollbar scroll-smooth snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, index) => {
                    const ep = (item as any).lastEpisodeNumber;
                    const to = isHistory ? `/watch/${item.id}?ep=${ep || 1}&server=${(item as any).serverIdx || 0}&t=${(item as any).progress || 0}` : undefined;
                    const episodeLabel = isHistory && ep !== undefined ? `Tập ${ep}` : undefined;
                    return (
                        <div key={item.id} className="snap-start flex-shrink-0 w-[160px] md:w-[220px]">
                            <div className="relative h-full">
                                <ContentCard item={item} priority={index < 10} to={to} episodeLabel={episodeLabel} />
                            </div>
                        </div>
                    );
                })}
                
                {loadingMore && (
                    <div className="flex-shrink-0 w-[160px] md:w-[220px] aspect-[2/3] bg-white/5 rounded-xl animate-pulse flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        </section>
    );
};

export const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [initialMovies, setInitialMovies] = useState<ContentItem[]>([]);
    const [initialComics, setInitialComics] = useState<ContentItem[]>([]);
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [c$Cnt, setC$Cnt] = useState(0);
    const [c$Show, setC$Show] = useState(false);
    const [c$Val, setC$Val] = useState('');
    const c$Ref = useRef<ReturnType<typeof setTimeout>>();
    
    const mode = is$Mode();
    
    useEffect(() => {
        if (location.pathname === '/x' && !mode) {
            navigate('/', { replace: true });
        }
    }, []);
    
    const handle$Click = () => {
        clearTimeout(c$Ref.current);
        const n = c$Cnt + 1;
        if (n >= 7) {
            setC$Cnt(0);
            setC$Show(true);
            return;
        }
        setC$Cnt(n);
        c$Ref.current = setTimeout(() => setC$Cnt(0), 2000);
    };

    const handle$Submit = () => {
        if (check$Code(c$Val)) {
            const active = is$Mode();
            set$Mode(!active);
            setC$Show(false);
            setC$Val('');
            navigate(active ? '/' : '/x');
        }
    };

    useEffect(() => {
        return () => clearTimeout(c$Ref.current);
    }, []);
    
    useEffect(() => {
        const load = async () => {
             const [movies, comics] = await Promise.all([
                 getFeaturedContent(1),
                 getComicsList(1)
             ]);
             setInitialMovies(movies);
             setInitialComics(comics);
             setHistoryItems(getHistory());
             setLoading(false);
        };
        load();
    }, []);

    if (loading) return (
        <div className="p-4 md:p-8 max-w-[1800px] mx-auto w-full">
            <div className="h-[50vh] md:h-[65vh] rounded-3xl bg-[#1a1825] animate-pulse mb-8 md:mb-12" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i}><ContentCardSkeleton /></div>
                ))}
            </div>
        </div>
    );

    if (initialMovies.length === 0) return <div className="p-8 text-slate-500">Không có dữ liệu.</div>;

    const heroItem = initialMovies[0];
    const listMovies = initialMovies.slice(1); 

    return (
        <div className="p-4 md:p-8 max-w-[1800px] mx-auto w-full overflow-hidden">
            <div className="flex md:hidden items-center justify-between -mx-4 -mt-4 px-4 py-3 mb-6 sticky top-0 z-40 bg-[#0b0a15]/80 backdrop-blur-xl border-b border-white/5">
                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handle$Click}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg transition-all ${is$Mode() ? 'bg-gradient-to-tr from-purple-500 to-pink-500 shadow-purple-500/50' : 'bg-gradient-to-tr from-purple-500 to-pink-600 shadow-purple-900/20'}`}>
                        <Icons.Play size={16} className="fill-current" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                        Movie Time
                    </h1>
                </div>
            </div>

            <Hero item={heroItem} />

            {historyItems.length > 0 && (
                <InfiniteHorizontalList
                    title="Tiếp Tục Xem"
                    initialItems={historyItems}
                    isHistory={true}
                />
            )}

            <InfiniteHorizontalList 
                title="Phim Mới Cập Nhật" 
                initialItems={listMovies} 
                type="movie"
            />

            {!mode && (
                <InfiniteHorizontalList 
                    title="Truyện Mới Cập Nhật" 
                    initialItems={initialComics} 
                    type="comic"
                />
            )}
            
            <div className="mt-8 text-center text-slate-500 text-sm pb-8 opacity-60">
                <p>Kéo sang phải để xem thêm</p>
            </div>

            {c$Show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setC$Show(false); setC$Val(''); }}>
                    <div className="bg-[#1a1825] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-4 text-center">Xác nhận</h3>
                        <input
                            type="password"
                            className="w-full px-4 py-3 bg-[#0b0a15] border border-white/10 rounded-xl text-white text-center text-lg tracking-widest placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all mb-4"
                            placeholder="••••••"
                            value={c$Val}
                            onChange={e => setC$Val(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handle$Submit(); }}
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={() => { setC$Show(false); setC$Val(''); }} className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-medium hover:bg-white/10 transition-all">
                                Huỷ
                            </button>
                            <button onClick={handle$Submit} className="flex-1 py-2.5 bg-purple-600 rounded-xl text-white font-medium hover:bg-purple-700 transition-all">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};