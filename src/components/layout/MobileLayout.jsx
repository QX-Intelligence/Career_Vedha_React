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

  return (
    <div className={isMobileView ? "mobile-layout-wrapper" : "desktop-layout-container"}>
      {isMobileView && <MobileTopBar />}
      
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
