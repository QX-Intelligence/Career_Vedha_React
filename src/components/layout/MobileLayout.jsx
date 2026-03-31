import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from '../navigation/BottomNavigation';
import MobileTopBar from '../navigation/MobileTopBar';
import MobileDrawer from '../navigation/MobileDrawer';
import { isHandheld } from '../../constants/breakpoints';

const AdSenseUnit = ({ slot = "5794503693" }) => {
  const insRef = React.useRef(null);

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    let pushed = false;

    const tryPush = () => {
      if (pushed) return;
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        pushed = true;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.error("AdSense error", e);
        }
      }
    };

    // Try immediately in case already visible
    tryPush();

    // Watch for when the container gains a real width (e.g. media query kicks in)
    let observer;
    if (!pushed && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        tryPush();
        if (pushed && observer) observer.disconnect();
      });
      observer.observe(el);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: 'block', width: '160px', height: '600px' }}
      data-ad-client="ca-pub-6974648434148802"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

const MobileLayout = ({ children }) => {
  const [isMobileView, setIsMobileView] = useState(isHandheld());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(isHandheld());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location]);

  // Determine if we should show global ads and restricted layout
  const isCmsRoute = location.pathname.startsWith('/admin') || 
                     location.pathname.startsWith('/cms') || 
                     location.pathname.startsWith('/dashboard') ||
                     location.pathname.startsWith('/user-management');
                     
  const isStoreRoute = location.pathname.startsWith('/e-store');

  // Completely bypass mobile responsiveness and global layout for E-Store
  if (isStoreRoute) {
    return <>{children}</>;
  }

  return (
    <div className={isMobileView ? "mobile-layout-wrapper" : `desktop-layout-container ${isCmsRoute ? 'admin-panel-layout' : ''}`}>
      {isMobileView && <MobileTopBar />}
      
      {/* Global Side Advertisements - Only on Desktop & Public Routes, NOT on Store */}
      {!isMobileView && !isCmsRoute && (
        <>
          <div className="global-side-ad left">
            <div className="ad-placeholder-text">Advertisement</div>
            <AdSenseUnit />
          </div>
          <div className="global-side-ad right">
            <div className="ad-placeholder-text">Advertisement</div>
            <AdSenseUnit />
          </div>
        </>
      )}

      <main className={isMobileView ? "mobile-main-content" : "desktop-main-content"}>
        {children}
      </main>
      
      {isMobileView && (
        <>
          <BottomNavigation onMenuClick={() => setIsDrawerOpen(true)} />
          <MobileDrawer 
            isOpen={isDrawerOpen} 
            onClose={() => setIsDrawerOpen(false)} 
          />
        </>
      )}
    </div>
  );
};

export default MobileLayout;
