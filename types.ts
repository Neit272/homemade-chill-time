export enum ContentType {
  MOVIE = 'MOVIE',
  SERIES = 'SERIES',
  COMIC = 'COMIC',
  MANGA = 'MANGA'
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Country {
  id: string;
  name: string;
  slug: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  coverImage: string;
  backdropImage: string;
  description: string;
  rating: number;
  year: number;
  tags: string[];
  progress?: number;
}

export interface Episode {
  id: string;
  title: string;
  number: number;
  duration: string;
  thumbnail: string;
  link_embed?: string;
  link_m3u8?: string;
  filename?: string;
  slug?: string;
}

export interface EpisodeServer {
  server_name: string;
  server_data: Episode[];
}

export interface Chapter {
  id: string;
  title: string;
  number: number;
  pages: string[];
  apiUrl?: string;
}

export interface ContentDetails extends ContentItem {
  episodes?: EpisodeServer[];
  chapters?: Chapter[];
  cast?: string[];
  author?: string;
  country?: string;
  countries?: Country[];
  status: string;
  categories?: Category[];
}

export interface HistoryItem extends ContentItem {
    lastViewedAt: number;
    lastChapterName?: string;
    lastChapterId?: string;
    lastChapterNumber?: number;
    lastEpisodeName?: string;
    lastEpisodeNumber?: number;
    progress?: number;
    duration?: number;
    serverIdx?: number;
    chapterProgress?: number;
}

export enum ReaderMode {
  VERTICAL = 'VERTICAL',
  PAGINATED = 'PAGINATED'
}