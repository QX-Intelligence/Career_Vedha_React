import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Query keys
export const accessKeys = {
    all: ['access'],
    roles: () => [...accessKeys.all, 'roles'],
    activeRoles: () => [...accessKeys.roles(), 'active'],
    inactiveRoles: () => [...accessKeys.roles(), 'inactive'],
    permissions: () => [...accessKeys.all, 'permissions'],
};

// --- Roles ---

/**
 * Hook to fetch active roles
 */
export function useActiveRoles() {
    return useQuery({
        queryKey: accessKeys.activeRoles(),
        queryFn: async () => {
            const { data } = await api.get('/get-active-roles');
            return Array.isArray(data) ? data : [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch inactive roles
 * Note: Backend endpoint has a typo 'incative' which we must preserve unless backend is fixed.
 */
export function useInactiveRoles() {
    return useQuery({
        queryKey: accessKeys.inactiveRoles(),
        queryFn: async () => {
            const { data } = await api.get('/get-incative-roles');
            return Array.isArray(data) ? data : [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to create a new role
 */
export function useCreateRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleName) => api.post('/create-role', { roleName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accessKeys.roles() });
            // Also invalidate users lists effectively since roles changed? Maybe not needed.
        },
    });
}

/**
 * Hook to activate a role
 */
export function useActivateRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleName) => api.post('/active-role', { roleName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accessKeys.roles() });
        },
    });
}

/**
 * Hook to inactivate a role (delete in API terms, but functionality is inactivate)
 */
export function useInactivateRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (roleName) => api.delete('/inactive-role', { data: { roleName } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accessKeys.roles() });
        },
    });
}

// --- Permissions ---

/**
 * Hook to fetch all permissions
 */
export function usePermissions() {
    return useQuery({
        queryKey: accessKeys.permissions(),
        queryFn: async () => {
            const { data } = await api.get('/permission-names');
            return Array.isArray(data) ? data : [];
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to create a new permission
 */
export function useCreatePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (permissionName) => api.post('/create-permission', { permissionName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accessKeys.permissions() });
        },
    });
}

/**
 * Hook to delete a permission
 */
export function useDeletePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (permissionName) => api.delete('/delete-permission', { data: { permissionName } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accessKeys.permissions() });
        },
    });
}

/**
 * Hook to assign a permission to a role
 */
export function useAssignPermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roleName, permissionName }) => 
            api.post('/add-permission', { roleName, permissionName }),
        onSuccess: () => {
            // Invalidate anything that depends on role-permissions mapping
            // Currently we don't fetch mapping specifically, logic implies backend handles it.
        },
    });
}

/**
 * Hook to remove a permission from a role
 */
export function useRemovePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roleName, permissionName }) => 
            api.post('/remove-permission', { roleName, permissionName }),
        onSuccess: () => {
        },
    });
}
