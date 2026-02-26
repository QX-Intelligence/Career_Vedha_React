import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import API_CONFIG from '../config/api.config';

/**
 * Normalize question from backend response to a consistent shape.
 * Backend returns correctOption (with GET_ANSWERS authority), but some
 * legacy code may use correctAnswer. This normalizer ensures both fields exist.
 */
const normalizeQuestion = (q) => ({
    ...q,
    option1: q.option1 || q.opt1,
    option2: q.option2 || q.opt2,
    option3: q.option3 || q.opt3,
    option4: q.option4 || q.opt4,
    correctOption: q.correctOption || q.correctAnswer || null,
});

// Query key factory for quiz questions
export const quizKeys = {
    all: ['quiz'],
    categories: () => [...quizKeys.all, 'categories'],
    questions: () => [...quizKeys.all, 'questions'],
    questionList: (params) => [...quizKeys.questions(), 'list', params],
    question: (id) => [...quizKeys.questions(), id],
};

/**
 * Hook to fetch exam categories
 */
export function useExamCategories() {
    return useQuery({
        queryKey: quizKeys.categories(),
        queryFn: async () => {
            const res = await api.get(API_CONFIG.ENDPOINTS.GET_EXAM_CATEGORIES);
            return Array.isArray(res.data) ? res.data : [];
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

/**
 * Hook to fetch quiz questions (by category or chapter)
 * @param {Object} params - Fetch parameters { category, chapterId, count }
 */
export function useQuizQuestions(params = {}) {
    const { category, chapterId, count = 20 } = params;

    return useQuery({
        queryKey: quizKeys.questionList(params),
        queryFn: async () => {
            if (!category && !chapterId) return { content: [] };

            const endpoint = category
                ? API_CONFIG.ENDPOINTS.GET_RANDOM_QUESTIONS_BY_CATEGORY
                : API_CONFIG.ENDPOINTS.GET_RANDOM_QUESTIONS_BY_CHAPTER;

            const queryParams = category
                ? { category, count }
                : { chapterId, count };

            const res = await api.get(endpoint, { params: queryParams });
            const data = res.data || [];

            // Normalize and sort by ID Ascending
            const content = [...data].map(normalizeQuestion).sort((a, b) => a.id - b.id);

            return {
                content,
                totalElements: content.length,
            };
        },
        enabled: !!(category || chapterId),
        staleTime: 5 * 60 * 1000,
        placeholderData: { content: [], totalElements: 0 },
    });
}

/**
 * Hook to create quiz questions (bulk)
 */
export function useCreateQuizQuestions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (questionList) => api.post(API_CONFIG.ENDPOINTS.CREATE_QUESTION, questionList),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quizKeys.questions() });
            queryClient.invalidateQueries({ queryKey: quizKeys.categories() });
        },
    });
}

/**
 * Hook to update a quiz question
 */
export function useUpdateQuizQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => api.put(`${API_CONFIG.ENDPOINTS.EDIT_QUESTION}/${id}`, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: quizKeys.question(variables.id) });
            queryClient.invalidateQueries({ queryKey: quizKeys.questions() });
        },
    });
}

/**
 * Hook to delete quiz questions (sequential for single-id backend)
 */
export function useDeleteQuizQuestions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids) => {
            // Backend only supports DELETE /api/delete-question/{id}
            // We loop through if multiple are provided
            const results = await Promise.all(
                ids.map(id => api.delete(`${API_CONFIG.ENDPOINTS.DELETE_QUESTION}/${id}`))
            );
            return results;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quizKeys.questions() });
            queryClient.invalidateQueries({ queryKey: quizKeys.categories() });
        },
    });
}
