import React, { useEffect, useState } from 'react';

const DomainGuard = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    // Authorized domains - if copied to another domain, it will fail
    const authorizedDomains = [
      'localhost',
      '127.0.0.1',
      'www.quinzexintelligence.com',
      'quinzexintelligence.com',
      'careervedha.in',
      'https://www.careervedha.in',
      'careervedha.com',
      'https://www.careervedha.com'
    ];

    const currentDomain = window.location.hostname;
    console.log('Domain Check:', currentDomain);
    
    // Check if current domain is authorized
    const isAllowed = authorizedDomains.includes(currentDomain) || 
                     authorizedDomains.some(domain => currentDomain.endsWith('.' + domain));

    if (!isAllowed) {
      console.error('Unauthorized license usage detected. System halted.');
      setIsAuthorized(false);
      
      // Nuclear option for thieves: clear storage if found on unauthorized domain
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: '#0a0a0a',
        color: '#62269E',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Playfair Display', serif",
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>License Expired</h1>
        <p style={{ color: '#666', maxWidth: '500px' }}>
          This educational module is not licensed for use on this domain. 
          Please contact the original developer for a valid license.
        </p>
      </div>
    );
  }

  return children;
};

export default DomainGuard;
