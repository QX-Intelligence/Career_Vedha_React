import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, ShoppingBag, LogOut, LogIn, Menu, X, User } from 'lucide-react';
import { useCache } from '../context/Cache_Context';
import api, { getUserContext, subscribeToAuthChanges, setUserContext } from '../../../services/api';
import { useUserProfile } from '../../../hooks/useUserProfile';

const UI_Nav = () => {
  const { count } = useCache();
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState(getUserContext());
  const [menuOpen, setMenuOpen] = useState(false);

  useUserProfile();

  useEffect(() => {
    return subscribeToAuthChanges((newContext) => {
      setAuth(newContext);
    });
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/log-out');
      setUserContext(null, null, null);
      navigate('/e-store');
    } catch (err) {
      setUserContext(null, null, null);
      navigate('/e-store');
    }
  };

  // All nav links for desktop & drawer
  const navLinks = [
    { label: 'Home', path: '/e-store' },
    { label: 'Collection', path: '/e-store/shop' },
    ...(auth.isAuthenticated ? [
      { label: 'My Library', path: '/e-store/library' },
      { label: 'My Orders', path: '/e-store/orders' }
    ] : []),
    { label: 'Our Story', path: '/e-store/about' },
  ];

  return (
    <>
      {/* ── TOP NAVBAR ─────────────────── */}
      <header className="store-nav">

        {/* Logo — always visible */}
        <Link to="/e-store" className="store-nav-brand">
          <GraduationCap size={26} />
          <span>CAREER VEDHA</span>
        </Link>

        {/* ── DESKTOP: centre nav links ── */}
        <nav className="store-nav-links">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`store-nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── DESKTOP: right-side actions ── */}
        <div className="store-nav-actions">


          {/* Cart — always visible in nav when logged in */}
          {auth.isAuthenticated && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Link
                to="/e-store/queue"
                style={{ color: '#fff', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <ShoppingBag size={22} color={count > 0 ? '#D4A843' : '#fff'} />
              </Link>
              {count > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: '#D4A843', color: '#111', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '100px', fontWeight: 800, border: '2px solid #111', pointerEvents: 'none' }}>{count}</span>
              )}
            </div>
          )}

          {/* User info + Logout — desktop only */}
          {auth.isAuthenticated && (
            <div className="store-nav-profile">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                  {auth.firstName ? `${auth.firstName} ${auth.lastName || ''}`.trim() : auth.email?.split('@')[0]}
                </span>
                <span style={{ color: '#D4A843', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>{auth.role}</span>
              </div>
              <button
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.5rem', borderRadius: '50%', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.background = 'rgba(255,68,68,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'none'; }}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

          {/* Sign In — hidden on mobile, drawer handles it */}
          {!auth.isAuthenticated && (
            <div className="store-desktop-only">
              <Link
                to="/e-store/login"
                className={`store-nav-link ${location.pathname === '/e-store/login' ? 'active' : ''}`}
              >
                <LogIn size={18} /> Sign In
              </Link>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="store-nav-hamburger"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* ── MOBILE OVERLAY ─────────────── */}
      {menuOpen && (
        <div className="store-mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* ── MOBILE DRAWER ──────────────── */}
      <div className={`store-mobile-drawer ${menuOpen ? 'open' : ''}`}>

        {/* Drawer header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#D4A843', fontWeight: 800, fontSize: '1rem', letterSpacing: '1px' }}>MENU</span>
          <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                padding: '0.9rem 1.25rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: location.pathname === link.path ? '#D4A843' : '#aaa',
                background: location.pathname === link.path ? 'rgba(212,168,67,0.08)' : 'transparent',
                transition: 'all 0.2s',
                display: 'block',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Drawer footer — Sign In OR user info+logout */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #222' }}>
          {auth.isAuthenticated ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="#D4A843" />
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
                    {auth.firstName ? `${auth.firstName} ${auth.lastName || ''}`.trim() : auth.email?.split('@')[0]}
                  </p>
                  <p style={{ color: '#D4A843', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', margin: 0 }}>{auth.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{ background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.9rem', borderRadius: '0.6rem', fontWeight: 700, fontSize: '0.8rem' }}
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          ) : (
            <Link
              to="/e-store/login"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', background: '#D4A843', color: '#111', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 800, fontSize: '1rem' }}
            >
              <LogIn size={18} /> Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default UI_Nav;
