import { ContentItem, ContentDetails, ContentType, EpisodeServer } from '../types';

const $k = 'czcja0Q5IW1QMiR2TDVAblI4';
const $u = 'G0NXGzcDDkIxREAULUUpQDFXHhhCGy0XUQUgHVQEI0MpCjcXBVhH';
const $p = 'QQARX3QN';
const $m = 'QgcT';

const _d = (s: string): string => {
    const k = atob($k);
    const d = atob(s);
    let r = '';
    for (let i = 0; i < d.length; i++) {
        r += String.fromCharCode(d.charCodeAt(i) ^ k.charCodeAt(i % k.length));
    }
    return r;
};

const $b = _d($u);
const $c = parseInt(_d($m));

const $0 = (d: any): ContentItem => {
    return {
        id: String(d.id) || d.slug,
        title: d.name || '',
        type: ContentType.MOVIE,
        coverImage: d.thumb_url || d.poster_url || '',
        backdropImage: d.poster_url || d.thumb_url || '',
        description: d.description || '',
        rating: 0,
        year: parseInt(d.year) || new Date().getFullYear(),
        tags: d.category || [],
        progress: 0
    };
};

const $1 = (d: any): ContentDetails => {
    const ep = d.episodes;
    const eps: EpisodeServer[] = [];
    if (ep && ep.server_name) {
        const sd = ep.server_data || {};
        const list = Object.entries(sd).map(([k, v]: any) => ({
            id: v.slug || k,
            title: k,
            number: 1,
            duration: d.time || '',
            thumbnail: d.thumb_url || d.poster_url || '',
            link_embed: v.link_embed,
        }));
        eps.push({ server_name: ep.server_name, server_data: list });
    }
    return {
        id: String(d.id) || d.slug,
        title: d.name || '',
        type: ContentType.MOVIE,
        coverImage: d.thumb_url || d.poster_url || '',
        backdropImage: d.poster_url || d.thumb_url || '',
        description: d.description || '',
        rating: 0,
        year: parseInt(d.year) || new Date().getFullYear(),
        tags: d.category || [],
        cast: d.actor || [],
        status: 'Ongoing',
        episodes: eps,
        chapters: [],
    };
};

const _q = async (u: string): Promise<any> => {
    try {
        const r = await fetch(u);
        if (!r.ok) return null;
        return await r.json();
    } catch { return null; }
};

export const get$List = async (page: number = 1, t?: string): Promise<ContentItem[]> => {
    const url = `${$b}?ac=detail&pg=${page}${t ? `&t=${t}` : ''}`;
    const d = await _q(url);
    if (!d || !d.list) return [];
    return d.list.map($0);
};

export const get$Detail = async (id: string): Promise<ContentDetails | undefined> => {
    const url = `${$b}?ac=detail&ids=${id}`;
    const d = await _q(url);
    if (!d || !d.list || !d.list[0]) return undefined;
    return $1(d.list[0]);
};

export const get$Search = async (q: string, page: number = 1): Promise<ContentItem[]> => {
    const url = `${$b}?ac=detail&wd=${encodeURIComponent(q)}&pg=${page}`;
    const d = await _q(url);
    if (!d || !d.list) return [];
    return d.list.map($0);
};

export const get$ByCategory = async (t: string, page: number = 1, year?: string): Promise<ContentItem[]> => {
    const url = `${$b}?ac=detail&pg=${page}&t=${t}${year ? `&year=${year}` : ''}`;
    const d = await _q(url);
    if (!d || !d.list) return [];
    return d.list.map($0);
};

export const get$ByYear = async (year: string, page: number = 1): Promise<ContentItem[]> => {
    const url = `${$b}?ac=detail&year=${year}&pg=${page}`;
    const d = await _q(url);
    if (!d || !d.list) return [];
    return d.list.map($0);
};

export const is$Mode = (): boolean => {
    return !!sessionStorage.getItem('_a');
};

export const check$Code = (c: string): boolean => {
    return c === _d($p);
};

export const set$Mode = (active: boolean) => {
    if (active) {
        sessionStorage.setItem('_a', '1');
    } else {
        sessionStorage.removeItem('_a');
    }
    window.dispatchEvent(new Event('$modechange'));
};

export const get$Cats = () => {
    return [
        { id: '1', name: 'Censored', slug: '1' },
        { id: '2', name: 'Uncensored', slug: '2' },
        { id: '3', name: 'Uncensored Leaked', slug: '3' },
        { id: '4', name: 'Amateur', slug: '4' },
        { id: '5', name: 'Chinese AV', slug: '5' },
        { id: '6', name: 'Hentai', slug: '6' },
        { id: '7', name: 'English Subtitle', slug: '7' },
    ];
};
