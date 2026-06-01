import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContentById, getContentByCategory } from '../services/api';
import DOMPurify from 'dompurify';
import { isFavorite, toggleFavorite } from '../services/localStorage';
import { ContentDetails, ContentItem, ContentType } from '../types';
import { Icons } from '../components/Icon';
import { ContentCard } from '../components/ContentCard';

export const Details = () => {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<ContentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  
  const [isFav, setIsFav] = useState(false);
  const [relatedContent, setRelatedContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (id) {
        const data = await getContentById(id);
        if (data) {
            setContent(data);
            setIsFav(isFavorite(data.id));
        }
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (!content?.categories?.length) return;
    const catSlug = content.categories[0].slug;
    const type = content.type === ContentType.COMIC || content.type === ContentType.MANGA ? 'truyen-tranh' : undefined;
    getContentByCategory(catSlug, 1, {}, type).then(items => {
      setRelatedContent(items.filter(i => i.id !== content.id).slice(0, 10));
    }).catch(() => {});
  }, [content]);

  const handleToggleFav = () => {
      if (!content) return;
      const newState = toggleFavorite(content);
      setIsFav(newState);
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Đang tải chi tiết...</div>;
  if (!content) return <div className="flex h-screen items-center justify-center text-red-500">Không tìm thấy nội dung.</div>;

  const currentEpisodes = content.episodes?.[selectedServerIndex]?.server_data || [];
  const isSingleEpisodeMovie = content.type === ContentType.MOVIE && currentEpisodes.length <= 1;

  const shouldShowListHeader = (!isSingleEpisodeMovie && currentEpisodes.length > 0) || (content.chapters && content.chapters.length > 0);

  const getStatusDisplay = (status: string) => {
      const s = status.toLowerCase();
      if (s === 'completed' || s === 'hoan-thanh') return 'Hoàn thành';
      if (s === 'coming_soon' || s === 'sap-ra-mat') return 'Sắp ra mắt';
      return 'Đang phát hành';
  };

  const getStatusColor = (status: string) => {
      const s = status.toLowerCase();
      if (s === 'completed' || s === 'hoan-thanh') return 'text-green-400';
      if (s === 'coming_soon' || s === 'sap-ra-mat') return 'text-blue-400';
      return 'text-purple-400';
  };

  return (
    <div className="relative min-h-screen bg-[#0b0a15] pb-24 md:pb-12 overflow-x-hidden">
      <div className="relative h-[40vh] md:h-[50vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a15] via-[#0b0a15]/60 to-transparent z-10" />
        <img src={content.backdropImage} alt="Backdrop" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"%3E%3Crect fill="%231a1825" width="1200" height="675"/%3E%3C/svg%3E'; e.currentTarget.onerror = null; }} />
        
        <Link to="/" className="absolute top-4 left-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/10 md:hidden">
            <Icons.ChevronLeft size={24} />
        </Link>
      </div>

      <div className="relative z-20 -mt-24 md:-mt-32 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="flex-shrink-0 mx-auto md:mx-0 relative">
                <img src={content.coverImage} alt={content.title} className="w-[140px] md:w-[200px] aspect-[2/3] rounded-xl shadow-2xl shadow-black/50 object-cover border border-white/5" onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"%3E%3Crect fill="%231a1825" width="200" height="300"/%3E%3Ccircle cx="100" cy="120" r="30" fill="%233b3555"/%3E%3Crect x="60" y="170" width="80" height="70" rx="5" fill="%233b3555"/%3E%3C/svg%3E'; e.currentTarget.onerror = null; }} />
            </div>

            <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">{content.title}</h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 text-slate-400 text-xs md:text-sm mb-6">
                    <span className="px-2 py-1 bg-[#1a1825] rounded border border-white/10">
                        {content.type === ContentType.SERIES ? 'Phim Bộ' : 
                         content.type === ContentType.COMIC ? 'Truyện Tranh' : 'Phim Lẻ'}
                    </span>
                    
                    <Link to={`/year/${content.year}`} className="hover:text-purple-400 transition-colors">
                        {content.year}
                    </Link>
                    
                    {content.countries && content.countries.length > 0 ? (
                        <span>
                            {content.countries.map((c, index) => (
                                <React.Fragment key={c.id}>
                                    <Link to={`/country/${c.slug}`} className="hover:text-purple-400 transition-colors">
                                        {c.name}
                                    </Link>
                                    {index < content.countries!.length - 1 && ", "}
                                </React.Fragment>
                            ))}
                        </span>
                    ) : (
                        content.country && <span>{content.country}</span>
                    )}

                    <span className="flex items-center gap-1 text-yellow-500">
                        {content.rating > 0 && <><Icons.Heart size={14} className="fill-current" /> {content.rating}</>}
                    </span>
                    <span className={`capitalize ${getStatusColor(content.status)}`}>
                        {getStatusDisplay(content.status)}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-8 justify-center md:justify-start px-4 sm:px-0">
                    {(content.type === ContentType.COMIC || content.type === ContentType.MANGA) && content.status === 'Coming Soon' && (!content.chapters || content.chapters.length === 0) ? (
                        <span className="px-8 py-3 bg-slate-700 text-slate-400 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed w-full sm:w-auto">
                            <Icons.BookOpen size={20} /> Sắp ra mắt
                        </span>
                    ) : (
                    <Link 
                        to={`/watch/${content.id}?server=${selectedServerIndex}`} 
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30 w-full sm:w-auto"
                    >
                        {content.type === ContentType.COMIC || content.type === ContentType.MANGA ? 
                            <><Icons.BookOpen size={20} /> Đọc Ngay</> : 
                            <><Icons.Play size={20} /> Xem Ngay</>
                        }
                    </Link>
                    )}
                    
                    <button 
                        onClick={handleToggleFav}
                        className={`px-4 py-3 border rounded-xl font-medium flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${
                            isFav 
                            ? 'bg-pink-600/20 border-pink-600 text-pink-400 hover:bg-pink-600/30' 
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                    >
                        <Icons.Heart size={20} className={isFav ? 'fill-current' : ''} />
                    </button>
                </div>

                {content.author && content.author !== 'Unknown' && content.author !== 'Đang cập nhật' && (
                    <div className="mb-4 text-sm text-slate-400">
                        <span className="text-slate-500">{content.type === ContentType.COMIC ? 'Tác giả' : 'Đạo diễn'}:</span> <span className="text-slate-200">{content.author}</span>
                    </div>
                )}

                <p className="text-slate-300 leading-relaxed max-w-2xl mb-6 text-sm md:text-base text-left md:text-left mx-auto md:mx-0 px-2 md:px-0" dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content.description)}} />

                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8">
                    {content.categories && content.categories.length > 0 ? (
                        content.categories.map(cat => (
                            <Link 
                                to={(content.type === ContentType.COMIC || content.type === ContentType.MANGA) ? `/comic-category/${cat.slug}` : `/category/${cat.slug}`} 
                                key={cat.id} 
                                className="px-3 py-1 bg-[#1a1825] rounded-full text-[10px] md:text-xs text-slate-400 border border-white/10 hover:bg-purple-600 hover:text-white transition-colors cursor-pointer"
                            >
                                {cat.name}
                            </Link>
                        ))
                    ) : (
                        content.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-[#1a1825] rounded-full text-[10px] md:text-xs text-slate-400 border border-white/10">
                                {tag}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </div>

        <div className="mt-8 md:mt-16 pb-8">
            {content.episodes && content.episodes.length > 1 && (
                <div className="mb-6 px-2 md:px-0">
                    <div className="flex items-center gap-2 mb-3">
                        <Icons.Server size={18} className="text-purple-400"/>
                        <span className="text-sm font-medium text-slate-300">Chọn Server Nguồn Phát</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {content.episodes.map((server, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedServerIndex(idx)}
                                className={`px-4 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors border ${
                                    selectedServerIndex === idx 
                                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/20' 
                                    : 'bg-[#1a1825] text-slate-400 border-white/10 hover:bg-[#252236] hover:text-slate-200'
                                }`}
                            >
                                {server.server_name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {shouldShowListHeader && (
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 px-2 md:px-0">
                    {content.type === ContentType.COMIC || content.type === ContentType.MANGA ? 'Danh Sách Chương' : 'Danh Sách Tập'}
                </h2>
            )}
            
            {!isSingleEpisodeMovie && currentEpisodes.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 px-2 md:px-0">
                    {currentEpisodes.map(ep => (
                        <Link 
                            to={`/watch/${content.id}?ep=${ep.number}&server=${selectedServerIndex}`} 
                            key={ep.id} 
                            className="flex items-center justify-center py-3 px-2 bg-[#1a1825] hover:bg-purple-600 rounded-lg border border-white/5 hover:border-purple-500/50 transition-all group text-center shadow-sm"
                        >
                            <span className="text-slate-300 group-hover:text-white font-medium text-sm truncate">
                                {ep.title}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
            
            {content.chapters && content.chapters.length > 0 && (
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 px-2 md:px-0">
                    {content.chapters.map(ch => (
                         <Link 
                            to={`/watch/${content.id}?ch=${ch.number}`} 
                            key={ch.id} 
                            className="flex items-center justify-center py-3 px-2 bg-[#1a1825] hover:bg-emerald-600 rounded-lg border border-white/5 hover:border-emerald-500/50 transition-all group text-center shadow-sm"
                         >
                            <span className="text-slate-300 group-hover:text-white font-medium text-sm truncate" title={ch.title}>
                                {ch.number ? `Chapter ${ch.number}` : ch.title}
                            </span>
                         </Link>
                    ))}
                </div>
            )}

            {relatedContent.length > 0 && (
              <div className="mt-12 px-2 md:px-0">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-7 bg-purple-600 rounded-full"></span>
                  Có thể bạn cũng thích
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {relatedContent.map(item => (
                    <ContentCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};