import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from '../navigation/BottomNavigation';
import MobileTopBar from '../navigation/MobileTopBar';
import MobileDrawer from '../navigation/MobileDrawer';
import { isHandheld } from '../../constants/breakpoints';

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
                     location.pathname.startsWith('/dashboard');
                     
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
            {/* Google AdSense or Custom Ad Script goes here */}
          </div>
          <div className="global-side-ad right">
            <div className="ad-placeholder-text">Advertisement</div>
             {/* Google AdSense or Custom Ad Script goes here */}
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
