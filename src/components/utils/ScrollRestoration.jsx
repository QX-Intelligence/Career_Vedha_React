import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Custom ScrollRestoration component for use with BrowserRouter.
 * Automatically scrolls to top on new navigation (PUSH/REPLACE)
 * while allowing the browser to handle scroll restoration on back/forward (POP).
 */
const ScrollRestoration = () => {
    const { pathname, search } = useLocation();
    const navType = useNavigationType();

    useEffect(() => {
        // On new navigation, scroll to top
        if (navType === 'PUSH' || navType === 'REPLACE') {
            window.scrollTo(0, 0);
        }
        // On POP (back/forward), we let the browser handle it, 
        // which it typically does well unless manual restoration is needed.
    }, [pathname, search, navType]);

    return null;
};

export default ScrollRestoration;
