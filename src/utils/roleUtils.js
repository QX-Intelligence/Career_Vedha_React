

export const getRoleInitials = (role) => {
    if (!role) return 'U';
    
    switch (role.toUpperCase()) {
        case 'SUPER_ADMIN': return 'SA';
        case 'ADMIN': return 'A';
        case 'PUBLISHER': return 'P';
        case 'CREATOR': return 'CR';
        case 'EDITOR': return 'E';
        case 'CONTRIBUTOR': return 'C';
        default: return role.charAt(0).toUpperCase();
    }
};
