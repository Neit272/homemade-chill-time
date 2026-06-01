import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getDetailedList, getCategories, getCountries } from '../services/api';
import { ContentItem, Category, Country } from '../types';
import { ContentCard } from '../components/ContentCard';
import { ContentCardSkeleton } from '../components/ContentCardSkeleton';
import { Icons } from '../components/Icon';
import { CustomSelect } from '../components/CustomSelect';
import { YEARS, COMIC_STATUSES } from '../constants';
import { is$Mode } from '../services/api.ob';

interface CatalogProps {
    type: 'phim-le' | 'phim-bo' | 'hoat-hinh' | 'truyen-tranh' | 'phim-moi';
    title: string;
}

export const Catalog: React.FC<CatalogProps> = ({ type, title }) => {
    const [items, setItems] = useState<ContentItem[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    const [searchParams, setSearchParams] = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    
    const category = searchParams.get('category') || '';
    const country = searchParams.get('country') || '';
    const year = searchParams.get('year') || '';
    const status = searchParams.get('status') || 'dang-phat-hanh';

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
        const fetchData = async () => {
            const isComic = type === 'truyen-tranh';
            
            const cats = await getCategories(isComic);
            setCategories(cats);

            if (!isComic) {
                const countriesList = await getCountries();
                setCountries(countriesList);
            } else {
                setCountries([]); 
            }
        };
        fetchData();
        
    }, [type]);

    useEffect(() => {
        setItems([]);
        setPage(1);
        setHasMore(true);
        loadData(1, true);
    }, [type, category, country, year, status]);

    const loadData = async (pageNum: number, isNew: boolean) => {
        setLoading(true);
        const newItems = await getDetailedList(type, pageNum, {
            category,
            country,
            year,
            status: type === 'truyen-tranh' ? status : undefined
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

    const activeFiltersCount = [category, country, year].filter(Boolean).length + (status !== 'dang-phat-hanh' && type === 'truyen-tranh' ? 1 : 0);

    return (
        <div className="p-4 md:p-8 min-h-screen">
            <div className="flex flex-col mb-8 sticky top-0 bg-[#0b0a15]/95 backdrop-blur-md z-30 py-4 border-b border-white/5 -mx-4 px-4 md:-mx-8 md:px-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <span className="w-1.5 h-8 bg-purple-600 rounded-full"></span>
                        {title}
                    </h1>
                    
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                            showFilters || activeFiltersCount > 0
                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20' 
                                : 'bg-[#1a1825] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                    >
                        <Icons.Settings size={18} />
                        <span className="text-sm font-medium">Bộ lọc</span>
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 w-5 h-5 flex items-center justify-center bg-white text-purple-600 rounded-full text-[10px] font-bold">
                                {activeFiltersCount}
                            </span>
                        )}
                        <Icons.ChevronLeft size={16} className={`transition-transform duration-200 ${showFilters ? 'rotate-90' : '-rotate-90'}`} />
                    </button>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-[#1a1825] border border-white/10 rounded-xl p-4 shadow-xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {type === 'truyen-tranh' && (
                                <CustomSelect 
                                    value={status}
                                    onChange={(val) => {
                                        updateParam('status', val);
                                        if (category) updateParam('category', ''); 
                                    }}
                                    options={COMIC_STATUSES}
                                    placeholder="Trạng thái"
                                    className="w-full"
                                />
                            )}

                            <CustomSelect 
                                value={category}
                                onChange={(val) => updateParam('category', val)}
                                options={categoryOptions}
                                placeholder="Thể loại"
                                className="w-full"
                            />

                            {type !== 'truyen-tranh' && !is$Mode() && (
                                <CustomSelect 
                                    value={country}
                                    onChange={(val) => updateParam('country', val)}
                                    options={countryOptions}
                                    placeholder="Quốc gia"
                                    className="w-full"
                                />
                            )}

                            {type !== 'truyen-tranh' && (
                                <CustomSelect 
                                    value={year}
                                    onChange={(val) => updateParam('year', val)}
                                    options={YEARS}
                                    placeholder="Năm"
                                    className="w-full"
                                />
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

            {!loading && items.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
                    <Icons.Search size={48} className="mb-4 opacity-50" />
                    <p>Không tìm thấy nội dung phù hợp.</p>
                </div>
            )}
            
            {!hasMore && items.length > 0 && (
                <div className="text-center py-8 text-slate-600 text-sm">
                    Đã hiển thị hết danh sách.
                </div>
            )}
        </div>
    );
};