import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { newsService } from '../services';

// Query key factory for consistent cache keys
export const articleKeys = {
    all: ['articles'],
    lists: () => [...articleKeys.all, 'list'],
    list: (filters) => [...articleKeys.lists(), { ...filters }],
    publicList: (filters) => [...articleKeys.all, 'public', 'list', { ...filters }],
    details: () => [...articleKeys.all, 'detail'],
    detail: (id) => [...articleKeys.details(), id],
    adminList: (filters) => [...articleKeys.all, 'admin', 'list', { ...filters }],
    homeContent: (lang) => [...articleKeys.all, 'home', lang],
};

/**
 * Hook to fetch articles list for admin
 * @param {Object} filters - Filter options (section, status, page, etc.)
 */
export function useArticles(filters = {}) {
    return useQuery({
        queryKey: articleKeys.adminList(filters),
        queryFn: async () => {
            const response = await newsService.getAdminArticles(filters);
            return response;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Infinite query hook for public articles with cursor pagination
 * @param {Object} filters - Filter options (lang, section, etc.)
 */
export function useInfiniteArticles(filters = {}) {
    return useInfiniteQuery({
        queryKey: articleKeys.publicList(filters),
        queryFn: async ({ pageParam = null }) => {
            return await newsService.getPublicArticles({
                ...filters,
                cursor: pageParam
            });
        },
        getNextPageParam: (lastPage) => lastPage.next_cursor || undefined,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch single article details
 * @param {string|number} id - Article ID
 */
export function useArticle(id, options = {}) {
    return useQuery({
        queryKey: articleKeys.detail(id),
        queryFn: async () => {
            const article = await newsService.getAdminArticleDetail(id);
            return article;
        },
        enabled: !!id, // Only run if ID exists
        staleTime: 10 * 60 * 1000,
        ...options,
    });
}

/**
 * Hook to fetch home content (for dashboard overview)
 * @param {string} lang - Language code ('en' or 'te')
 */
export function useHomeContent(lang = 'en') {
    return useQuery({
        queryKey: articleKeys.homeContent(lang),
        queryFn: () => newsService.getHomeContent(lang),
        staleTime: 5 * 60 * 1000, // 5 minutes for home content
    });
}

/**
 * Hook to create a new article
 */
export function useCreateArticle() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (articleData) => newsService.createArticle(articleData),
        onSuccess: () => {
            // Invalidate all article lists to refetch
            queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: articleKeys.all });
        },
    });
}

/**
 * Hook to update an existing article
 */
export function useUpdateArticle() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }) => newsService.updateArticle(id, data),
        onSuccess: (data, variables) => {
            // Invalidate the specific article and all lists
            queryClient.invalidateQueries({ queryKey: articleKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: articleKeys.all });
        },
    });
}

/**
 * Hook to delete an article
 */
export function useDeleteArticle() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id) => newsService.deleteArticle(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: articleKeys.all });
        },
    });
}

/**
 * Hook to publish an article directly
 */
export function usePublishArticle() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, payload }) => newsService.directPublish(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: articleKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
            queryClient.invalidateQueries({ queryKey: articleKeys.all });
        },
    });
}

/**
 * Hook to move article to review
 */
export function useMoveToReview() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id) => newsService.moveToReview(id),
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
        },
    });
}

/**
 * Hook to assign categories to an article
 */
export function useAssignCategories() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ articleId, categoryIds }) => 
            newsService.assignCategories(articleId, categoryIds),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: articleKeys.detail(variables.articleId) });
        },
    });
}
