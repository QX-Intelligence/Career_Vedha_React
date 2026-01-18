
export const getRoleInitials = (role) => {
    switch (role) {
        case 'SUPER_ADMIN': return 'SA';
        case 'ADMIN': return 'A';
        case 'PUBLISHER': return 'P';
        case 'CREATOR': return 'C';
        default: return (role ? role.charAt(0).toUpperCase() : 'U');
    }
};
