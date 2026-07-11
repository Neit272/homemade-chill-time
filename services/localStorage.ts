import { ContentItem, HistoryItem } from '../types';

const KEYS = {
    FAVORITES: 'Movie Time_favorites',
    HISTORY: 'Movie Time_history'
};

export const getFavorites = (): ContentItem[] => {
    try {
        const data = localStorage.getItem(KEYS.FAVORITES);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const isFavorite = (id: string): boolean => {
    const favs = getFavorites();
    return favs.some(item => item.id === id);
};

export const toggleFavorite = (item: ContentItem): boolean => {
    const favs = getFavorites();
    const index = favs.findIndex(f => f.id === item.id);
    let newFavs;
    let isAdded = false;

    if (index > -1) {
        newFavs = favs.filter(f => f.id !== item.id);
    } else {
        const minimalItem: ContentItem = {
            id: item.id,
            title: item.title,
            type: item.type,
            coverImage: item.coverImage,
            backdropImage: item.backdropImage,
            description: item.description, 
            rating: item.rating,
            year: item.year,
            tags: item.tags
        };
        newFavs = [minimalItem, ...favs];
        isAdded = true;
    }

    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(newFavs));
    return isAdded;
};

export const getHistory = (): HistoryItem[] => {
    try {
        const data = localStorage.getItem(KEYS.HISTORY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const addToHistory = (item: ContentItem, meta?: {
    chapterName?: string, chapterId?: string, chapterNumber?: number,
    episodeName?: string, episodeNumber?: number,
    serverIdx?: number
}) => {
    const history = getHistory();
    const existing = history.find(h => h.id === item.id);
    const filtered = history.filter(h => h.id !== item.id);

    const sameEpisode = existing && existing.lastEpisodeNumber === meta?.episodeNumber &&
                        existing.lastChapterNumber === meta?.chapterNumber;

    const newItem: HistoryItem = {
        id: item.id,
        title: item.title,
        type: item.type,
        coverImage: item.coverImage,
        backdropImage: item.backdropImage,
        description: item.description,
        rating: item.rating,
        year: item.year,
        tags: item.tags,
        lastViewedAt: Date.now(),
        lastChapterName: meta?.chapterName,
        lastChapterId: meta?.chapterId,
        lastChapterNumber: meta?.chapterNumber,
        lastEpisodeName: meta?.episodeName,
        lastEpisodeNumber: meta?.episodeNumber,
        serverIdx: meta?.serverIdx,
        progress: sameEpisode ? existing.progress : undefined,
        duration: sameEpisode ? existing.duration : undefined,
    };

    const newHistory = [newItem, ...filtered].slice(0, 20);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(newHistory));
};

export const updateProgress = (id: string, progress: number, duration?: number) => {
    const history = getHistory();
    const idx = history.findIndex(h => h.id === id);
    if (idx === -1) return;
    history[idx].progress = progress;
    if (duration) history[idx].duration = duration;
    history[idx].lastViewedAt = Date.now();
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
};

export const removeFromHistory = (id: string) => {
    const history = getHistory();
    const filtered = history.filter(h => h.id !== id);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(filtered));
};

export const clearHistory = () => {
    localStorage.removeItem(KEYS.HISTORY);
};
