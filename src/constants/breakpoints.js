export const BREAKPOINTS = {
  MOBILE: 480,
  LARGE_MOBILE: 767,
  TABLET: 1024,
};

export const isMobile = () => window.innerWidth <= BREAKPOINTS.MOBILE;
export const isLargeMobile = () => window.innerWidth > BREAKPOINTS.MOBILE && window.innerWidth <= BREAKPOINTS.LARGE_MOBILE;
export const isTablet = () => window.innerWidth > BREAKPOINTS.LARGE_MOBILE && window.innerWidth <= BREAKPOINTS.TABLET;
export const isHandheld = () => window.innerWidth <= BREAKPOINTS.TABLET;
export const isDesktop = () => window.innerWidth > BREAKPOINTS.TABLET;
