import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchContent, getCategories, getCountries } from '../services/api';
import { ContentItem, Category, Country } from '../types';
import { ContentCard } from '../components/ContentCard';
import { ContentCardSkeleton } from '../components/ContentCardSkeleton';
import { Icons } from '../components/Icon';
import { useSearchParams } from 'react-router-dom';
import { CustomSelect } from '../components/CustomSelect';
import { YEARS } from '../constants';
import { COMIC_STATUSES } from '../constants';
import { is$Mode } from '../services/api.ob';

export const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    const qParam = searchParams.get('q');
    const scopeParamFromUrl = searchParams.get('scope');

    const [keyword, setKeyword] = useState(qParam || '');
    const [debouncedKeyword, setDebouncedKeyword] = useState(qParam || '');
    const [isDebouncing, setIsDebouncing] = useState(false);
    const [items, setItems] = useState<ContentItem[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    
    const [scope, setScope] = useState<'all' | 'movie' | 'comic'>(
        scopeParamFromUrl === 'movie' ? 'movie' : 
        scopeParamFromUrl === 'comic' ? 'comic' : 'all'
    );
    const [categories, setCategories] = useState<Category[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || '';
    const year = searchParams.get('year') || '';
    const status = searchParams.get('status') || '';
    const mode = is$Mode();

    const updateParam = (key: string, value: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) next.set(key, value);
            else next.delete(key);
            return next;
        }, { replace: true });
    };

    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const effectiveScope = mode ? 'movie' : scope;
        if (effectiveScope === 'all') {
            ['category', 'country', 'year', 'status'].forEach(k => {
                if (searchParams.has(k)) updateParam(k, '');
            });
        }
    }, [scope, mode]);

    const handleKeywordChange = (val: string) => {
        setKeyword(val);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (val) next.set('q', val);
            else next.delete('q');
            return next;
        }, { replace: true });
    };

    const handleScopeChange = (newScope: 'all' | 'movie' | 'comic') => {
        setScope(newScope);
        const next = new URLSearchParams(searchParams);
        next.set('scope', newScope);
        if (newScope === 'all') {
            ['category', 'country', 'year', 'status'].forEach(k => next.delete(k));
        }
        setSearchParams(next, { replace: true });
    };

    useEffect(() => {
        getCategories(scope === 'comic').then(setCategories);
        if (scope !== 'comic') {
            getCountries().then(setCountries);
        } else {
            setCountries([]);
        }
    }, [scope]);

    useEffect(() => {
        if (keyword !== debouncedKeyword) {
            setIsDebouncing(true);
        }
        const handler = setTimeout(() => {
            setDebouncedKeyword(keyword);
            setIsDebouncing(false);
        }, 600);
        return () => clearTimeout(handler);
    }, [keyword]);

    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        
        const hasFilters = scope === 'comic' 
            ? (category || status)
            : (category || country || year);
        if (!debouncedKeyword && !hasFilters) {
            return;
        }
        
        loadData(1, true);
    }, [debouncedKeyword, category, country, year, status, scope]);

    const loadData = async (pageNum: number, isNew: boolean) => {
        setLoading(true);
        const searchKeyword = debouncedKeyword || ''; 

        const newItems = await searchContent(searchKeyword, pageNum, {
            category,
            country,
            year,
            status: scope === 'comic' ? status : undefined,
            scope 
        });

        if (newItems.length === 0) {
            setHasMore(false);
        } else {
            setItems(prev => isNew ? newItems : [...prev, ...newItems]);
        }
        setLoading(false);
    };

    const loadDataRef = useRef(loadData);
    loadDataRef.current = loadData;

    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => {
                    const nextPage = prev + 1;
                    loadDataRef.current(nextPage, false);
                    return nextPage;
                });
            }
        });
        
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const categoryOptions = categories.map(c => ({ value: c.slug, label: c.name }));
    const countryOptions = countries.map(c => ({ value: c.slug, label: c.name }));
    const activeFiltersCount = scope === 'comic'
        ? [category, status].filter(Boolean).length
        : [category, country, year].filter(Boolean).length;

    return (
        <div className="p-4 md:p-8 min-h-screen flex flex-col">
            <div className="flex flex-col gap-6 mb-8 max-w-5xl mx-auto w-full">
                  <div className="flex justify-center mb-2">
                    <div className="bg-[#1a1825] p-1 rounded-xl flex">
                        {!mode && (
                            <button 
                                onClick={() => handleScopeChange('all')}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${scope === 'all' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Tất cả
                            </button>
                        )}
                        <button 
                            onClick={() => handleScopeChange('movie')}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${scope === 'movie' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Phim
                        </button>
                        {!mode && (
                            <button 
                                onClick={() => handleScopeChange('comic')}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${scope === 'comic' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                Truyện
                            </button>
                        )}
                    </div>
                 </div>

                 <div className="relative w-full flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Icons.Search className="h-6 w-6 text-slate-400" />
                        </div>
                        <input 
                            type="text"
                            placeholder={scope === 'movie' ? "Tìm kiếm phim..." : scope === 'comic' ? "Tìm kiếm truyện..." : "Nhập tên nội dung..."}
                            className="w-full pl-12 pr-12 py-3 bg-[#1a1825] border border-white/10 rounded-xl text-white text-lg placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-lg"
                            value={keyword}
                            onChange={(e) => handleKeywordChange(e.target.value)}
                            autoFocus
                        />
                        {isDebouncing && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-purple-400">
                                <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                Đang tìm...
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center justify-center w-12 rounded-xl border transition-all flex-shrink-0 ${
                            scope === 'all' ? 'invisible' :
                            showFilters || activeFiltersCount > 0
                                ? 'bg-purple-600 border-purple-500 text-white' 
                                : 'bg-[#1a1825] border-white/10 text-slate-400 hover:text-white'
                        }`}
                    >
                        <Icons.Settings size={22} />
                    </button>
                 </div>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${scope === 'all' ? 'max-h-0 opacity-0' : showFilters ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-[#1a1825] border border-white/10 rounded-xl p-4 shadow-xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <CustomSelect 
                                value={category}
                                onChange={(val) => updateParam('category', val)}
                                options={categoryOptions}
                                placeholder="Thể loại"
                                className="w-full"
                            />

                            {scope === 'comic' && (
                                <CustomSelect 
                                    value={status}
                                    onChange={(val) => updateParam('status', val)}
                                    options={COMIC_STATUSES}
                                    placeholder="Trạng thái"
                                    className="w-full"
                                />
                            )}

                            {scope !== 'comic' && (
                                <>
                                    <CustomSelect 
                                        value={country}
                                        onChange={(val) => updateParam('country', val)}
                                        options={countryOptions}
                                        placeholder="Quốc gia"
                                        className="w-full"
                                    />

                                    <CustomSelect 
                                        value={year}
                                        onChange={(val) => updateParam('year', val)}
                                        options={YEARS}
                                        placeholder="Năm"
                                        className="w-full"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                {items.map((item, index) => {
                    if (items.length === index + 1) {
                        return (
                            <div ref={lastElementRef} key={`${item.id}-${index}`}>
                                <ContentCard item={item} />
                            </div>
                        );
                    } else {
                        return (
                            <div key={`${item.id}-${index}`}>
                                <ContentCard item={item} />
                            </div>
                        );
                    }
                })}
            </div>

            {items.length === 0 && loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i}><ContentCardSkeleton /></div>
                    ))}
                </div>
            )}

            {items.length > 0 && loading && (
                <div className="flex items-center justify-center py-12">
                     <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {!debouncedKeyword && !category && !country && !year && !status && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <Icons.Search size={64} className="mb-4 opacity-20" />
                    <p>Nhập từ khóa để bắt đầu tìm kiếm</p>
                </div>
            )}
        </div>
    );
};