import { useQuery } from '@tanstack/react-query';
import { newsService } from '../services';
import { filterPublishedArticles } from '../utils/articleUtils';

export const homeKeys = {
    all: ['home-content'],
    content: (lang) => [...homeKeys.all, lang],
};

export const useHomeContent = (lang = 'telugu', limit = 20, offset = 0) => {
    const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);

    return useQuery({
        queryKey: [...homeKeys.content(langCode), limit, offset],
        queryFn: async () => {
            const data = await newsService.getHomeContent(langCode, limit, offset);
            
            // Apply filtering logic here so components get clean data
            return {
                hero: filterPublishedArticles(data.hero || []),
                breaking: filterPublishedArticles(data.breaking || []),
                top_stories: filterPublishedArticles(data.top_stories || []),
                featured: filterPublishedArticles(data.featured || []),
                trending: filterPublishedArticles(data.trending || []),
                must_read: filterPublishedArticles(data.must_read || []),
                latest: {
                    ...data.latest,
                    results: filterPublishedArticles(data.latest?.results || [])
                }
            };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useCategoryBlocks = (section, lang = 'telugu') => {
    const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);

    return useQuery({
        queryKey: ['category-blocks', section, langCode],
        queryFn: async () => {
            const data = await newsService.getCategoryBlocks(section, langCode);
            
            // Filter scheduled articles from each block
            return (data.blocks || []).map(block => ({
                ...block,
                results: filterPublishedArticles(block.results || [])
            })).filter(block => block.results.length > 0); // Remove empty blocks
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useTrendingArticles = (limit = 5, lang = 'telugu') => {
    const langCode = lang === 'telugu' ? 'te' : (lang === 'english' ? 'en' : lang);

    return useQuery({
        queryKey: ['trending-articles', langCode, limit],
        queryFn: async () => {
            const data = await newsService.getTrendingArticles({ limit, lang: langCode });
            return data.results || [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};
