import React, { createContext, useContext, useState, useCallback } from 'react';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
    const [activeLanguage, setActiveLanguageState] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'telugu';
    });

    const setLanguage = useCallback((lang) => {
        setActiveLanguageState(lang);
        localStorage.setItem('preferredLanguage', lang);
    }, []);

    return (
        <LanguageContext.Provider value={{ activeLanguage, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

/**
 * useLanguage — hook to access the global language state.
 * Returns { activeLanguage, setLanguage, langCode }
 * langCode is the short code: 'te' for Telugu, 'en' for English.
 */
export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
    return {
        activeLanguage: ctx.activeLanguage,
        setLanguage: ctx.setLanguage,
        langCode: ctx.activeLanguage === 'telugu' ? 'te' : 'en',
    };
};

export default LanguageContext;
