import { ContentItem, ContentDetails, ContentType, Episode, Chapter, Category, Country } from '../types';
import { MOCK_DB } from './mockData';
import { is$Mode, get$List, get$Detail, get$Search, get$Cats, get$ByCategory, get$ByYear } from './api.ob';

const API_BASE_URL = 'https://phimapi.com'; 
const COMIC_API_BASE = 'https://otruyenapi.com';

const inferType = (item: any, typeList?: string): ContentType => {
    if (typeList === 'phim-bo') return ContentType.SERIES;
    if (typeList === 'phim-le') return ContentType.MOVIE;
    if (typeList === 'truyen-tranh') return ContentType.COMIC;
    
    const status = item.episode_current || '';
    if (status.toLowerCase().includes('tập') || status.includes('/')) {
        return ContentType.SERIES;
    }
    return ContentType.MOVIE;
};

const optimizeImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.includes('via.placeholder.com') || url.includes('picsum.photos') || url.includes('phimapi.com/image.php')) {
        return url;
    }
    return `https://phimapi.com/image.php?url=${encodeURIComponent(url)}`;
};

const normalizeContentItem = (apiData: any, cdnDomain?: string): ContentItem => {
    let poster = apiData.poster_url;
    let thumb = apiData.thumb_url;

    if (cdnDomain) {
        if (poster && !poster.startsWith('http')) poster = `${cdnDomain}/${poster}`;
        if (thumb && !thumb.startsWith('http')) thumb = `${cdnDomain}/${thumb}`;
    }

    if (!poster) poster = 'https://via.placeholder.com/1200x600?text=No+Image';
    if (!thumb) thumb = 'https://via.placeholder.com/300x450?text=No+Image';

    return {
        id: apiData.slug,
        title: apiData.name,
        type: inferType(apiData),
        coverImage: optimizeImageUrl(thumb),
        backdropImage: optimizeImageUrl(poster),
        description: '', 
        rating: 0, 
        year: apiData.year || new Date().getFullYear(),
        tags: apiData.category?.map((c: any) => c.name) || [],
        progress: 0
    };
};

const normalizeComicItem = (apiData: any, cdnDomain: string): ContentItem => {
    const thumbPath = apiData.thumb_url || '';
    let fullThumb = 'https://via.placeholder.com/300x450?text=No+Image';
    if (thumbPath) {
        fullThumb = thumbPath.startsWith('http') 
            ? thumbPath 
            : (cdnDomain ? `${cdnDomain}/uploads/comics/${thumbPath}` : thumbPath);
    }

    let description = 'Mới cập nhật';
    if (apiData.newest_chapter) {
        description = apiData.newest_chapter;
    } else if (apiData.chaptersLatest && apiData.chaptersLatest.length > 0) {
        description = `Chapter ${apiData.chaptersLatest[0].chapter_name}`;
    } else if (apiData.chapters && apiData.chapters.length > 0) {
        const serverOne = apiData.chapters[0].server_data;
        if (Array.isArray(serverOne) && serverOne.length > 0) {
             const lastChap = serverOne[serverOne.length - 1];
             description = `Chapter ${lastChap.chapter_name}`;
        }
    }

    const hasChapters = !!(apiData.chaptersLatest?.length) || !!(
        apiData.chapters?.length && apiData.chapters[0].server_data?.length
    );

    return {
        id: apiData.slug,
        title: apiData.name,
        type: ContentType.COMIC,
        coverImage: fullThumb,
        backdropImage: fullThumb, 
        description: description, 
        rating: 0,
        year: new Date(apiData.updatedAt || Date.now()).getFullYear(),
        tags: apiData.category?.map((c: any) => c.name) || [],
        progress: 0,
        status: apiData.status,
        hasChapters
    };
};

const normalizeDetails = (apiResponse: any): ContentDetails => {
    const movie = apiResponse.movie;
    const type = inferType(movie);
    
    const rawPoster = movie.poster_url;
    const rawThumb = movie.thumb_url;

    const rawEpisodes = apiResponse.episodes || [];
    
    const episodes: EpisodeServer[] = rawEpisodes.map((server: any) => ({
        server_name: server.server_name,
        server_data: (server.server_data || []).map((ep: any) => {
             const epNum = parseFloat(ep.name.replace(/[^0-9.]/g, '')) || 0;
             return {
                id: ep.slug,
                title: ep.name,
                number: epNum === 0 ? 1 : epNum,
                duration: movie.time || 'N/A',
                thumbnail: optimizeImageUrl(rawPoster),
                link_embed: ep.link_embed,
                link_m3u8: ep.link_m3u8,
                filename: ep.filename,
                slug: ep.slug
             };
        })
    }));

    return {
        id: movie.slug,
        title: movie.name,
        type: type,
        coverImage: optimizeImageUrl(rawThumb),
        backdropImage: optimizeImageUrl(rawPoster),
        description: `${movie.content} (${movie.origin_name})` || 'Chưa có mô tả.',
        rating: 0,
        year: movie.year,
        tags: movie.category?.map((c: any) => c.name) || [],
        categories: movie.category?.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
        countries: movie.country?.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
        status: movie.status === 'completed' ? 'Completed' : 'Ongoing',
        cast: movie.actor || [],
        author: movie.director?.[0] || 'Unknown',
        country: movie.country?.[0]?.name || '',
        episodes: episodes,
        chapters: [] 
    };
};

const normalizeComicDetails = (apiResponse: any): ContentDetails => {
    const item = apiResponse.data.item;
    const seo = apiResponse.data.seoOnPage;
    const cdnDomain = apiResponse.data.APP_DOMAIN_CDN_IMAGE;
    
    const fullThumb = item.thumb_url.startsWith('http') 
        ? item.thumb_url 
        : `${cdnDomain}/uploads/comics/${item.thumb_url}`;
    
    const serverData = item.chapters?.[0]?.server_data || [];
    
    const chapters: Chapter[] = serverData.map((ch: any) => ({
        id: ch.chapter_api_data.split('/').pop() || '',
        title: `Chapter ${ch.chapter_name}`,
        number: parseFloat(ch.chapter_name) || 0,
        apiUrl: ch.chapter_api_data,
        pages: [] 
    }));

    chapters.sort((a, b) => b.number - a.number);

    const updatedAt = item.updatedAt || seo?.updated_time || Date.now();
    const year = new Date(updatedAt).getFullYear();

    let status = 'Ongoing';
    if (item.status === 'completed') status = 'Completed';
    else if (item.status === 'coming_soon') status = 'Coming Soon';

    return {
        id: item.slug,
        title: item.name,
        type: ContentType.COMIC,
        coverImage: fullThumb,
        backdropImage: fullThumb,
        description: item.content || 'Chưa có mô tả.',
        rating: 0,
        year: year,
        tags: item.category?.map((c: any) => c.name) || [],
        categories: item.category?.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })) || [],
        countries: [], 
        status: status,
        cast: [],
        author: item.author?.[0] || 'Unknown',
        country: '',
        episodes: [],
        chapters: chapters
    };
};

export const getCategories = async (isComic: boolean = false): Promise<Category[]> => {
    if (is$Mode()) return get$Cats();
    try {
        if (isComic) {
            const response = await fetch(`${COMIC_API_BASE}/v1/api/the-loai`);
            if (!response.ok) return [];
            const data = await response.json();
            if (data.data && Array.isArray(data.data.items)) {
                return data.data.items.map((item: any) => ({
                    id: item._id,
                    name: item.name,
                    slug: item.slug
                }));
            }
        } else {
            const response = await fetch(`${API_BASE_URL}/the-loai`);
            if (!response.ok) return [];
            const data = await response.json();
            if (Array.isArray(data)) {
                return data.map((item: any) => ({
                    id: item._id,
                    name: item.name,
                    slug: item.slug
                }));
            }
        }
        return [];
    } catch (error) {
        console.error("Lỗi lấy danh sách thể loại:", error);
        return [];
    }
};

export const getCountries = async (): Promise<Country[]> => {
    if (is$Mode()) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/quoc-gia`);
        if (!response.ok) return [];
        const data = await response.json();
        if (Array.isArray(data)) {
            return data.map((item: any) => ({
                id: item._id,
                name: item.name,
                slug: item.slug
            }));
        }
        return [];
    } catch (error) {
        return [];
    }
};

export const getFeaturedContent = async (page: number = 1): Promise<ContentItem[]> => {
    if (is$Mode()) return get$List(page);
    try {
        const response = await fetch(`${API_BASE_URL}/danh-sach/phim-moi-cap-nhat-v2?page=${page}`);
        if (!response.ok) return page === 1 ? MOCK_DB : [];
        const data = await response.json();
        if (!data.status || !data.items) return page === 1 ? MOCK_DB : [];
        return data.items.map((item: any) => normalizeContentItem(item));
    } catch (error) {
        return page === 1 ? MOCK_DB : []; 
    }
};

export const getComicsList = async (page: number = 1, statusSlug: string = 'truyen-moi'): Promise<ContentItem[]> => {
    if (is$Mode()) return [];
    try {
        const url = `${COMIC_API_BASE}/v1/api/danh-sach/${statusSlug}?page=${page}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        
        if (!data.status || !data.data || !data.data.items) return [];
        const cdnDomain = data.data.APP_DOMAIN_CDN_IMAGE;
        
        const hideComingSoon = statusSlug !== 'truyen-moi' && statusSlug !== 'sap-ra-mat';
        return data.data.items
            .filter((item: any) => !hideComingSoon || item.status !== 'coming_soon')
            .map((item: any) => normalizeComicItem(item, cdnDomain));
    } catch (error) {
        console.error("Lỗi lấy danh sách truyện:", error);
        return [];
    }
};

interface FilterParams {
    category?: string;
    country?: string;
    year?: string;
    sort_lang?: string; 
    status?: string;
    scope?: 'all' | 'movie' | 'comic';
}

export const getContentByCategory = async (
    slug: string,
    page: number = 1,
    filters: FilterParams = {},
    type?: string
): Promise<ContentItem[]> => {
    if (is$Mode()) return get$ByCategory(slug, page, filters.year);
    try {
        if (type === 'truyen-tranh') {
            const url = `${COMIC_API_BASE}/v1/api/the-loai/${slug}?page=${page}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            if (!data.status || !data.data || !data.data.items) return [];
            const cdnDomain = data.data.APP_DOMAIN_CDN_IMAGE;
            
            return data.data.items
                .map((item: any) => normalizeComicItem(item, cdnDomain));
        }

        const params = new URLSearchParams({
            page: page.toString(),
            limit: '24', 
            sort_field: 'modified.time',
            sort_type: 'desc',
            ...filters
        });
        
        if (params.has('category')) params.delete('category');
        Object.keys(filters).forEach(key => {
            if (!filters[key as keyof FilterParams]) params.delete(key);
        });

        const url = `${API_BASE_URL}/v1/api/the-loai/${slug}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) return [];
        const data = await response.json();

        if (!data.status || !data.data || !data.data.items) return [];
        const cdnDomain = data.data.APP_DOMAIN_CDN_IMAGE;
        return data.data.items.map((item: any) => normalizeContentItem(item, cdnDomain));
    } catch (error) {
         console.error(`Lỗi lấy danh sách thể loại ${slug}:`, error);
         return [];
    }
};

export const getContentByCountry = async (
    slug: string,
    page: number = 1,
    filters: FilterParams = {},
    type?: string
): Promise<ContentItem[]> => {
    if (is$Mode()) return [];
    try {
        if (type === 'truyen-tranh') {
            return []; // Otruyen API không hỗ trợ lọc theo quốc gia
        }

        const params = new URLSearchParams({
            page: page.toString(),
            limit: '24', 
            sort_field: 'modified.time',
            sort_type: 'desc',
            ...filters
        });
        
        if (params.has('country')) params.delete('country');
        Object.keys(filters).forEach(key => {
            if (!filters[key as keyof FilterParams]) params.delete(key);
        });

        const url = `${API_BASE_URL}/v1/api/quoc-gia/${slug}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) return [];
        const data = await response.json();

        if (!data.status || !data.data || !data.data.items) return [];
        const cdnDomain = data.data.APP_DOMAIN_CDN_IMAGE;
        return data.data.items.map((item: any) => normalizeContentItem(item, cdnDomain));
    } catch (error) {
         console.error(`Lỗi lấy danh sách quốc gia ${slug}:`, error);
         return [];
    }
};

export const getContentByYear = async (
    year: string,
    page: number = 1,
    filters: FilterParams = {},
    type?: string
): Promise<ContentItem[]> => {
    if (is$Mode()) return get$ByYear(year, page);
    try {
        if (type === 'truyen-tranh') {
            return []; 
        }

        const params = new URLSearchParams({
            page: page.toString(),
            limit: '24', 
            sort_field: 'modified.time',
            sort_type: 'desc',
            ...filters
        });
        
        if (params.has('year')) params.delete('year');
        Object.keys(filters).forEach(key => {
            if (!filters[key as keyof FilterParams]) params.delete(key);
        });

        const url = `${API_BASE_URL}/v1/api/nam/${year}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) return [];
        const data = await response.json();

        if (!data.status || !data.data || !data.data.items) return [];
        const cdnDomain = data.data.APP_DOMAIN_CDN_IMAGE;
        return data.data.items.map((item: any) => normalizeContentItem(item, cdnDomain));
    } catch (error) {
         console.error(`Lỗi lấy danh sách năm ${year}:`, error);
         return [];
    }
};

export const getDetailedList = async (
    typeList: 'phim-le' | 'phim-bo' | 'hoat-hinh' | 'tv-shows' | 'truyen-tranh' | 'phim-moi',
    page: number = 1,
    filters: FilterParams = {}
): Promise<ContentItem[]> => {
    if (filters.category) {
        return getContentByCategory(filters.category, page, filters, typeList);
    }
    if (filters.country) {
        return getContentByCountry(filters.country, page, filters, typeList);
    }
    if (filters.year) {
        return getContentByYear(filters.year, page, filters, typeList);
    }
    if (typeList === 'truyen-tranh') {
        const statusSlug = filters.status || 'dang-phat-hanh';
        return getComicsList(page, statusSlug);
    }
    if (typeList === 'phim-moi') {
        return getFeaturedContent(page);
    }

    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '24', 
            sort_field: 'modified.time',
            sort_type: 'desc',
            ...filters
        });

        Object.keys(filters).forEach(key => {
            if (!filters[key as keyof FilterParams]) params.delete(key);
        });

        const url = `${API_BASE_URL}/v1/api/danh-sach/${typeList}?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) return [];
        const data = await response.json();
        
        if (!data.status || !data.data || !data.data.items) return [];
        const cdnDomain = data.data.APP_DOMAIN_CDN_IMAGE;
        return data.data.items.map((item: any) => normalizeContentItem(item, cdnDomain));

    } catch (error) {
        console.error(`Lỗi lấy danh sách ${typeList}:`, error);
        return [];
    }
};

export const getContentById = async (id: string): Promise<ContentDetails | undefined> => {
    if (is$Mode()) return get$Detail(id);
    try {
        const response = await fetch(`${API_BASE_URL}/phim/${id}`);
        if (response.ok) {
            const data = await response.json();
            if (data.status && data.movie) {
                return normalizeDetails(data);
            }
        }
    } catch (error) { }

    try {
        const response = await fetch(`${COMIC_API_BASE}/v1/api/truyen-tranh/${id}`);
        if (response.ok) {
            const data = await response.json();
            if (data.status === 'success' && data.data) {
                return normalizeComicDetails(data);
            }
        }
    } catch (error) { }

    return MOCK_DB.find(c => c.id === id); 
};

export const getChapterPages = async (chapterApiUrl: string): Promise<string[]> => {
    try {
         const response = await fetch(chapterApiUrl);
         if (!response.ok) return [];
         const data = await response.json();
         if (data.status === 'success' && data.data) {
             const domain = data.data.domain_cdn;
             const path = data.data.item.chapter_path;
             return data.data.item.chapter_image.map((img: any) => 
                `${domain}/${path}/${img.image_file}`
             );
         }
         return [];
    } catch (error) {
        console.error("Error fetching chapter pages:", error);
        return [];
    }
};

export const searchContent = async (
    keyword: string, 
    page: number = 1,
    filters: FilterParams = {}
): Promise<ContentItem[]> => {
    if (!keyword) return [];
    if (is$Mode()) return get$Search(keyword, page);

    const scope = filters.scope || 'all';

    const moviePromise = (async () => {
        if (scope === 'comic') return [];

        try {
            const params = new URLSearchParams({
                keyword: keyword,
                page: page.toString(),
                limit: '24',
                sort_field: 'modified.time',
                sort_type: 'desc',
                ...filters
            });

            Object.keys(filters).forEach(key => {
                if (!filters[key as keyof FilterParams] || key === 'scope') params.delete(key);
            });

            const url = `${API_BASE_URL}/v1/api/tim-kiem?${params.toString()}`;
            const response = await fetch(url);
            
            if (!response.ok) return [];
            const data = await response.json();
            
            if (!data.status || !data.data || !data.data.items) return [];

            const cdnDomain = data.data.APP_DOMAIN_CDN_IMAGE;
            return data.data.items.map((item: any) => normalizeContentItem(item, cdnDomain));
        } catch (error) {
            console.error("Lỗi tìm kiếm phim:", error);
            return [];
        }
    })();

    const comicPromise = (async () => {
        if (scope === 'movie') return [];
        if (filters.country || filters.year) return [];

        try {
            const url = `${COMIC_API_BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            
            if (!data.status || !data.data || !data.data.items) return [];
            const cdnDomain = data.data.APP_DOMAIN_CDN_IMAGE;
            
            return data.data.items
                .map((item: any) => normalizeComicItem(item, cdnDomain));
        } catch (error) {
            console.error("Lỗi tìm kiếm truyện:", error);
            return [];
        }
    })();

    const [movies, comics] = await Promise.all([moviePromise, comicPromise]);
    return [...movies, ...comics];
};