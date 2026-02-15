import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicsService } from '../services/academicsService';

// Query keys
export const academicKeys = {
    all: ['academics'],
    levels: ['admin-levels'],
    subjects: ['admin-subjects'],
    chapters: ['admin-chapters'],
    materials: ['admin-materials'],
    categories: ['admin-categories'],
    hierarchy: ['admin-hierarchy'],
};

// --- Levels ---
export const useLevels = () => {
    return useQuery({
        queryKey: academicKeys.levels,
        queryFn: academicsService.getAdminLevels,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateLevel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: academicsService.createLevel,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: academicKeys.levels }),
    });
};

export const useUpdateLevel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => academicsService.updateLevel(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: academicKeys.levels }),
    });
};

// --- Subjects ---
export const useSubjects = () => {
    return useQuery({
        queryKey: academicKeys.subjects,
        queryFn: academicsService.getAdminSubjects,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateSubject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: academicsService.createSubject,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: academicKeys.subjects }),
    });
};

export const useUpdateSubject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => academicsService.updateSubject(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: academicKeys.subjects }),
    });
};

// --- Chapters ---
export const useChapters = () => {
    return useQuery({
        queryKey: academicKeys.chapters,
        queryFn: academicsService.getAdminChapters,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateChapter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: academicsService.createChapter,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: academicKeys.chapters }),
    });
};

export const useUpdateChapter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => academicsService.updateChapter(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: academicKeys.chapters }),
    });
};

// --- Materials ---
export const useMaterials = () => {
    return useQuery({
        queryKey: academicKeys.materials,
        queryFn: academicsService.getAdminMaterials,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: academicsService.createMaterial,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: academicKeys.materials }),
    });
};

export const useUpdateMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => academicsService.updateMaterial(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: academicKeys.materials }),
    });
};

// --- Categories ---
export const useCategories = () => {
    return useQuery({
        queryKey: academicKeys.categories,
        queryFn: academicsService.getAdminCategories,
        staleTime: 10 * 60 * 1000,
    });
};

// --- Hierarchy ---
export const useAcademicsHierarchy = () => {
    return useQuery({
        queryKey: academicKeys.hierarchy,
        queryFn: academicsService.getAcademicsHierarchy,
        staleTime: 5 * 60 * 1000,
    });
};

export const useAcademicsDjangoHierarchy = () => {
    return useQuery({
        queryKey: [...academicKeys.hierarchy, 'django'],
        queryFn: academicsService.getDjangoHierarchy,
        staleTime: 5 * 60 * 1000,
    });
};
