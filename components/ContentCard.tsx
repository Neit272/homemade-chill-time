import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ContentItem, ContentType } from '../types';
import { Icons } from './Icon';
import { is$Mode } from '../services/api.ob';

interface ContentCardProps {
  item: ContentItem;
  priority?: boolean;
  to?: string;
  episodeLabel?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item, priority = false, to, episodeLabel }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const getBadgeInfo = (type: ContentType) => {
      if (type === ContentType.SERIES) {
          return { label: 'Phim Bộ', color: 'bg-purple-600' };
      }
      if (type === ContentType.COMIC || type === ContentType.MANGA) {
          return { label: 'Truyện Tranh', color: 'bg-emerald-600' };
      }
      return { label: 'Phim Lẻ', color: 'bg-red-600' };
  };

  const badge = getBadgeInfo(item.type);

  return (
    <Link to={to || `/details/${item.id}`} className="group relative block w-full cursor-pointer h-full">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#1a1825] shadow-lg border border-white/5 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-purple-900/30 group-hover:border-purple-500/30">
        
        {(!isLoaded || isError) && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1e1b2e] animate-pulse z-0">
                <Icons.Film className="text-slate-700 opacity-20" size={24} />
            </div>
        )}

        <img 
          src={item.coverImage} 
          alt={item.title} 
          className={`h-full w-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
        />

        {item.progress !== undefined && item.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-10 h-1 bg-white/10">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(100, (item.progress / (item.duration || item.progress)) * 100)}%` }}
            />
          </div>
        )}
        
        {!is$Mode() && (
        <div className="absolute top-2 left-2 z-10">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider text-white shadow-sm ${badge.color}`}>
                {badge.label}
            </span>
        </div>
        )}

        {episodeLabel && (
          <div className="absolute top-8 left-2 z-10">
            <span className="px-2 py-0.5 text-[10px] font-medium text-white bg-purple-600/90 rounded-md shadow-lg backdrop-blur-sm">
              {episodeLabel}
            </span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-black/20 backdrop-blur-[1px] z-20">
            {(item.type === ContentType.COMIC || item.type === ContentType.MANGA) && item.hasChapters === false ? (
                <span className="px-3 py-1.5 bg-yellow-500/90 text-white text-xs font-bold rounded-lg shadow-lg">
                    Sắp ra mắt
                </span>
            ) : (
                <div className="h-12 w-12 rounded-full bg-purple-600/90 flex items-center justify-center shadow-lg shadow-purple-600/50 transform scale-75 group-hover:scale-100 transition-transform">
                    {item.type === ContentType.COMIC || item.type === ContentType.MANGA ? (
                        <Icons.BookOpen className="text-white fill-white ml-0.5" size={24} />
                    ) : (
                        <Icons.Play className="text-white fill-white ml-1" size={24} />
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-semibold text-slate-100 line-clamp-1 group-hover:text-purple-400 transition-colors" title={item.title}>
            {item.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>{item.year}</span>
            {item.description && (
                <>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="truncate max-w-[120px]">{item.description}</span>
                </>
            )}
            
            {item.rating > 0 && (
                <>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <div className="flex items-center text-yellow-500 gap-1">
                    <Icons.Heart size={10} className="fill-current" />
                    <span>{item.rating}</span>
                </div>
                </>
            )}
        </div>
      </div>
    </Link>
  );
};