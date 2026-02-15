import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsService } from '../services';

// Query key factory for taxonomy/categories
export const taxonomyKeys = {
    all: ['taxonomy'],
    categories: () => [...taxonomyKeys.all, 'categories'],
    categoriesBySection: (section) => [...taxonomyKeys.categories(), section],
    adminCategories: () => [...taxonomyKeys.all, 'admin', 'categories'],
    list: (params) => [...taxonomyKeys.adminCategories(), 'list', params],
    tree: (section) => [...taxonomyKeys.adminCategories(), 'tree', section],
    children: (section, parentId) => [...taxonomyKeys.tree(section), 'children', parentId],
    sections: () => [...taxonomyKeys.all, 'sections'],
};

/**
 * Hook to fetch taxonomy list (paginated)
 */
export function useTaxonomyList(params) {
    return useQuery({
        queryKey: taxonomyKeys.list(params),
        queryFn: () => newsService.getAdminCategories(params),
        staleTime: 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Hook to fetch taxonomy tree
 */
export function useTaxonomyTree(section) {
    return useQuery({
        queryKey: taxonomyKeys.tree(section),
        queryFn: () => newsService.getTaxonomyTree(section),
        staleTime: 60 * 1000,
    });
}

/**
 * Hook to fetch category children (for tree expansion)
 * This might be better as a manual fetch triggered by user interaction, 
 * but useQuery allows caching.
 * However, since it's loaded on demand per node, we can expose a hook that returns a fetch function 
 * or use useQuery with enabled: false, but dealing with dynamic keys for many rows is tricky.
 * Best approach for tree expansion is usually on-demand fetching.
 * We'll keep it as a mutation or just use queryClient.fetchQuery in component?
 * Or we can create a hook that returns a mutation/fetcher.
 * Let's use useMutation for "fetch children" action to handle state easily, or just a simple async function wrapper.
 * Actually, `useQuery` is fine if we want to cache, but for tree nodes, I'll stick to a simple wrapper or 
 * let the component use `useQuery` dynamically? No, that's complex.
 * Let's provide a hook that exposes a fetch function using queryClient.
 */
export function useFetchCategoryChildren() {
    const queryClient = useQueryClient();
    return (section, parentId) => {
        return queryClient.fetchQuery({
            queryKey: taxonomyKeys.children(section, parentId),
            queryFn: () => newsService.getCategoryChildren(section, parentId),
            staleTime: 5 * 60 * 1000,
        });
    };
}


/**
 * Hook to fetch all admin categories (legacy/simple list)
 */
export function useAdminCategories() {
    return useQuery({
        queryKey: taxonomyKeys.adminCategories(),
        queryFn: () => newsService.getAdminCategories(),
        staleTime: 30 * 60 * 1000, 
        gcTime: 60 * 60 * 1000, 
    });
}

/**
 * Hook to fetch categories by section
 */
export function useCategoriesBySection(section) {
    return useQuery({
        queryKey: taxonomyKeys.categoriesBySection(section),
        queryFn: () => newsService.getTaxonomyBySection(section),
        enabled: !!section,
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    });
}

/**
 * Hook to fetch all sections (derived from categories)
 */
export function useSections() {
    const { data: categories } = useAdminCategories();
    
    return useQuery({
        queryKey: taxonomyKeys.sections(),
        queryFn: () => {
            if (!categories?.results) return [];
            
            const uniqueSections = [...new Set(categories.results.map(cat => cat.section))];
            return uniqueSections.map(sec => ({
                id: sec,
                name: sec.charAt(0).toUpperCase() + sec.slice(1).replace(/_/g, ' ')
            }));
        },
        enabled: !!categories,
        staleTime: 30 * 60 * 1000,
    });
}

/**
 * Hook to create a new category
 */
export function useCreateCategory() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (categoryData) => newsService.createCategory(categoryData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });
        },
    });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ id, data }) => newsService.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });
        },
    });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (id) => newsService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });
        },
    });
}

/**
 * Hook to toggle category status
 */
export function useToggleCategoryStatus() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (category) => {
            if (category.is_active) {
                return newsService.disableCategory(category.id);
            } else {
                return newsService.enableCategory(category.id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });
        },
    });
}
