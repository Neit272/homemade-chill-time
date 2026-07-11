import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { getCategories } from '../services/api';
import { Category } from '../types';
import { is$Mode, check$Code, set$Mode } from '../services/api.ob';

const MobileNavItem = ({ 
    icon: Icon, 
    label, 
    active, 
    onClick,
    to 
}: { 
    icon: any, 
    label: string, 
    active: boolean, 
    onClick?: () => void,
    to?: string 
}) => {
    const content = (
        <div className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
          active ? 'text-purple-400' : 'text-slate-500'
        }`}>
            <Icon size={24} className={active ? 'fill-current' : ''} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">{label}</span>
        </div>
    );

    if (to) {
        return <Link to={to} className="w-full h-full" onClick={onClick}>{content}</Link>;
    }

    return <button onClick={onClick} className="w-full h-full">{content}</button>;
};

const SubMenuLink = ({ 
    to, 
    label, 
    icon: Icon, 
    onClick, 
    className = "" 
}: { 
    to: string, 
    label: string, 
    icon: any, 
    onClick: () => void,
    className?: string
}) => (
    <Link 
        to={to} 
        onClick={onClick}
        className={`flex items-center rounded-xl transition-all active:scale-95 active:bg-purple-600/20 active:text-purple-300 ${className}`}
    >
        <Icon size={18} className="flex-shrink-0" />
        <span className="font-medium truncate">{label}</span>
    </Link>
);

export const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<'movies' | 'comics' | null>(null);
  const [comicGenres, setComicGenres] = useState<Category[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [c$Cnt, setC$Cnt] = useState(0);
  const [c$Show, setC$Show] = useState(false);
  const [c$Val, setC$Val] = useState('');
  const c$Ref = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    const target = is$Mode() ? '/x' : '/';
    if (location.pathname !== target) {
      navigate(target);
    }
    setActiveMenu(null);
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
      setActiveMenu(null);
  }, [location.pathname]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setActiveMenu(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
        const cats = await getCategories(true);
        if (cats.length > 0) {
            setComicGenres(cats.slice(0, 4));
        }
    };
    fetchGenres();
  }, []);

  useEffect(() => {
      document.body.style.overflow = activeMenu ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
  }, [activeMenu]);

  const toggleMenu = (menu: 'movies' | 'comics') => {
      if (activeMenu === menu) {
          setActiveMenu(null);
      } else {
          setActiveMenu(menu);
      }
  };

  return (
    <>
        {activeMenu && (
            <div className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm transition-opacity" onClick={() => setActiveMenu(null)} />
        )}

        <div 
            ref={menuRef}
            className={`fixed bottom-[4.5rem] left-4 right-4 bg-[#1a1825]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[95] md:hidden transition-all duration-300 origin-bottom transform ${
                activeMenu ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8 pointer-events-none'
            }`}
        >
            <div className="p-3">
                {activeMenu === 'movies' && (
                    <div className="grid grid-cols-3 gap-2">
                        <SubMenuLink 
                            to="/movies" 
                            label="Phim Lẻ" 
                            icon={Icons.Film} 
                            onClick={() => setActiveMenu(null)} 
                            className="flex-col justify-center p-3 gap-2 text-[10px] bg-white/5 hover:bg-white/10 text-slate-300"
                        />
                        <SubMenuLink 
                            to="/series" 
                            label="Phim Bộ" 
                            icon={Icons.Menu} 
                            onClick={() => setActiveMenu(null)} 
                            className="flex-col justify-center p-3 gap-2 text-[10px] bg-white/5 hover:bg-white/10 text-slate-300"
                        />
                        <SubMenuLink 
                            to="/cartoons" 
                            label="Hoạt Hình" 
                            icon={Icons.Sparkles} 
                            onClick={() => setActiveMenu(null)} 
                            className="flex-col justify-center p-3 gap-2 text-[10px] bg-white/5 hover:bg-white/10 text-slate-300"
                        />

                        <div className="col-span-3 border-t border-white/10 my-1"></div>
                        
                        <SubMenuLink 
                            to="/new-movies" 
                            label="Khám phá tất cả Phim" 
                            icon={Icons.Compass} 
                            onClick={() => setActiveMenu(null)} 
                            className="col-span-3 justify-center gap-2 p-3 text-sm bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 font-semibold"
                        />
                    </div>
                )}

                {activeMenu === 'comics' && (
                    <div className="grid grid-cols-2 gap-2">
                        {comicGenres.map(g => (
                            <SubMenuLink 
                                key={g.id}
                                to={`/comic-category/${g.slug}`} 
                                label={g.name} 
                                icon={Icons.BookOpen} 
                                onClick={() => setActiveMenu(null)} 
                                className="gap-2 p-3 text-xs bg-transparent hover:bg-white/5 text-slate-300"
                            />
                        ))}
                        
                        <div className="col-span-2 border-t border-white/10 my-1"></div>
                        
                        <SubMenuLink 
                            to="/comics" 
                            label="Khám phá tất cả Truyện" 
                            icon={Icons.Compass} 
                            onClick={() => setActiveMenu(null)} 
                            className="col-span-2 justify-center gap-2 p-3 text-sm bg-purple-600/10 text-purple-300 hover:bg-purple-600/20 font-semibold"
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0e17] border-t border-white/10 z-[100] pb-3 pb-safe pt-2 shadow-2xl shadow-black h-[60px]">
            <div className="flex items-center justify-around h-full">
                <MobileNavItem 
                    icon={Icons.Home} 
                    label="Home" 
                    active={location.pathname === '/' || location.pathname === '/x'} 
                    onClick={handle$Click}
                />
                
                {!is$Mode() && (
                    <MobileNavItem 
                        icon={Icons.Film} 
                        label="Phim" 
                        active={activeMenu === 'movies' || location.pathname === '/movies' || location.pathname === '/series' || location.pathname === '/cartoons' || location.pathname === '/new-movies' || location.pathname.startsWith('/category/') || location.pathname.startsWith('/country/') || location.pathname.startsWith('/year/')} 
                        onClick={() => toggleMenu('movies')}
                    />
                )}
                
                {!is$Mode() && (
                    <MobileNavItem 
                        icon={Icons.BookOpen} 
                        label="Truyện" 
                        active={activeMenu === 'comics' || location.pathname.startsWith('/comics') || location.pathname.startsWith('/comic-category/')} 
                        onClick={() => toggleMenu('comics')}
                    />
                )}
                
                {!is$Mode() && (
                    <MobileNavItem 
                        to="/favorites" 
                        icon={Icons.Heart} 
                        label="Yêu Thích" 
                        active={location.pathname === '/favorites'} 
                        onClick={() => setActiveMenu(null)}
                    />
                )}

                <MobileNavItem 
                    to="/history" 
                    icon={Icons.Clock} 
                    label="Lịch Sử" 
                    active={location.pathname === '/history'} 
                    onClick={() => setActiveMenu(null)}
                />

                <MobileNavItem 
                    to="/search" 
                    icon={Icons.Search} 
                    label="Tìm Kiếm" 
                    active={location.pathname === '/search'} 
                    onClick={() => setActiveMenu(null)}
                />
            </div>
        </div>

        {c$Show && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm md:hidden" onClick={() => { setC$Show(false); setC$Val(''); }}>
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
    </>
  );
};