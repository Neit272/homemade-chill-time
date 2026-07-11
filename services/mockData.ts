import { ContentType, ContentDetails, ContentItem } from '../types';

export const MOCK_DB: ContentDetails[] = [
  {
    id: 'm1',
    title: 'Cyber Runner 2077',
    type: ContentType.MOVIE,
    coverImage: 'https://picsum.photos/300/450?random=1',
    backdropImage: 'https://picsum.photos/1200/600?random=1',
    description: 'In a dystopian future, a lone courier must transport a data chip that contains the secret to immortality, all while being hunted by mega-corporations.',
    rating: 8.9,
    year: 2024,
    tags: ['Sci-Fi', 'Action', 'Thriller'],
    status: 'Completed',
    cast: ['Keanu Reeves', 'Ana de Armas'],
    episodes: [{
        server_name: 'Vietsub',
        server_data: [{ id: 'e1', title: 'Full Movie', number: 1, duration: '2h 14m', thumbnail: 'https://picsum.photos/300/170?random=10' }]
    }]
  },
  {
    id: 'c1',
    title: 'Solo Leveling: Reborn',
    type: ContentType.MANGA,
    coverImage: 'https://picsum.photos/300/450?random=2',
    backdropImage: 'https://picsum.photos/1200/600?random=2',
    description: 'Ten years ago, "the Gate" appeared and connected the real world with the realm of magic and monsters. Ordinary people received superhuman powers and became known as "Hunters".',
    rating: 9.5,
    year: 2023,
    tags: ['Action', 'Fantasy', 'Adventure'],
    status: 'Ongoing',
    author: 'Chugong',
    chapters: Array.from({ length: 10 }).map((_, i) => ({
      id: `ch${i + 1}`,
      title: `Chapter ${i + 1}`,
      number: i + 1,
      pages: Array.from({ length: 8 }).map((__, p) => `https://picsum.photos/800/1200?random=${100 + i + p}`)
    }))
  },
  {
    id: 's1',
    title: 'The Last Horizon',
    type: ContentType.SERIES,
    coverImage: 'https://picsum.photos/300/450?random=3',
    backdropImage: 'https://picsum.photos/1200/600?random=3',
    description: 'A crew of explorers ventures to the edge of the known universe, discovering ancient civilizations and cosmic horrors.',
    rating: 9.1,
    year: 2025,
    tags: ['Sci-Fi', 'Mystery'],
    status: 'Ongoing',
    episodes: [{
        server_name: 'Vietsub',
        server_data: Array.from({ length: 5 }).map((_, i) => ({
            id: `ep${i+1}`,
            title: `Episode ${i+1}`,
            number: i + 1,
            duration: '45m',
            thumbnail: `https://picsum.photos/300/170?random=${200 + i}`
        }))
    }]
  },
  {
    id: 'c2',
    title: 'Midnight Occult',
    type: ContentType.COMIC,
    coverImage: 'https://picsum.photos/300/450?random=4',
    backdropImage: 'https://picsum.photos/1200/600?random=4',
    description: 'A detective specializing in the paranormal investigates a series of impossible crimes in Victorian London.',
    rating: 8.4,
    year: 2022,
    tags: ['Horror', 'Mystery', 'Historical'],
    status: 'Completed',
    author: 'J. Smith',
    chapters: Array.from({ length: 5 }).map((_, i) => ({
        id: `ch${i + 1}`,
        title: `Issue #${i + 1}`,
        number: i + 1,
        pages: Array.from({ length: 6 }).map((__, p) => `https://picsum.photos/800/1200?random=${300 + i + p}`)
      }))
  }
];

export const getFeaturedContent = async (): Promise<ContentItem[]> => {
  return MOCK_DB;
};

export const getContentById = async (id: string): Promise<ContentDetails | undefined> => {
    return MOCK_DB.find(c => c.id === id);
};