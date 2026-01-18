import React, { createContext, useContext, useState, useCallback } from 'react';

const SnackbarContext = createContext();

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};

export const SnackbarProvider = ({ children }) => {
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        type: 'info', // 'success' | 'error' | 'info' | 'warning'
    });

    const showSnackbar = useCallback((message, type = 'info') => {
        setSnackbar({ open: true, message, type });

        // Auto-close after 4 seconds
        setTimeout(() => {
            setSnackbar(prev => ({ ...prev, open: false }));
        }, 4000);
    }, []);

    const closeSnackbar = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            {snackbar.open && (
                <div className={`snackbar-container ${snackbar.type}`}>
                    <div className="snackbar-content">
                        <i className={`fas ${getIcon(snackbar.type)}`}></i>
                        <span>{snackbar.message}</span>
                    </div>
                    <button className="snackbar-close" onClick={closeSnackbar}>
                        <i className="fas fa-times"></i>
                    </button>
                    <div className="snackbar-progress"></div>
                </div>
            )}
        </SnackbarContext.Provider>
    );
};

const getIcon = (type) => {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
};
