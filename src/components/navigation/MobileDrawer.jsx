import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X, GraduationCap, FileText, User, HelpCircle, Info, LayoutDashboard, Users, Brain, Shield, Key, Bell, Briefcase, Tags, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { newsService } from '../../services';
import { getTranslations } from '../../utils/translations';
import { getUserContext, subscribeToAuthChanges } from '../../services/api';
import { checkAccess, MODULES } from '../../config/accessControl.config';
import MobileNavAccordion from './mobile/MobileNavAccordion';

const NAV_CACHE_BASE = 'cv_nav_tree_v4';
const TREE_SECTIONS = ['academics', 'news', 'current-affairs', 'jobs', 'campus-pages', 'exams'];
const LEVEL_SECTIONS = [];

const slugKey = (slug) => {
    return slug.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
};

const MobileDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [userContext, setUserContextState] = useState(getUserContext());
  const { role: userRole, isAuthenticated } = userContext;
  
  const activeLanguage = localStorage.getItem('preferredLanguage') || 'english';
  const t = getTranslations(activeLanguage);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Subscribe to auth changes to ensure reactive UI
  useEffect(() => {
    return subscribeToAuthChanges((newContext) => {
      setUserContextState(newContext);
    });
  }, []);
  
  // States for NavTree
  const [navData, setNavData] = useState({
      news: [],
      currentAffairs: [],
      academics: [],
      jobs: [],
      campusPages: [],
      exams: []
  });
  const [allSections, setAllSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sections & nav tree for mobile nav
  useEffect(() => {
    if (!isOpen) return;
    
    const langCode = activeLanguage === 'telugu' ? 'te' : 'en';
    
    // One-time cleanup of stale cache keys if they exist
    try {
        localStorage.removeItem(`${NAV_CACHE_BASE}_en`);
        localStorage.removeItem(`${NAV_CACHE_BASE}_te`);
    } catch (_) {}

    const fetchNavData = async () => {
        setIsLoading(true);

        // 2. Fetch from API
        try {
            const [treeResults, levelResults, sectionsData] = await Promise.all([
                Promise.all(
                    TREE_SECTIONS.map(async (slug) => {
                        try {
                            let data = await newsService.getTaxonomyTree(slug, activeLanguage);
                            if (!Array.isArray(data) || data.length === 0) {
                                const fallbackLang = activeLanguage === 'english' ? 'telugu' : 'english';
                                data = await newsService.getTaxonomyTree(slug, fallbackLang);
                            }
                            return { slug, data: Array.isArray(data) ? data : [] };
                        } catch (err) {
                            console.warn(`Failed to fetch taxonomy tree for ${slug}:`, err);
                            return { slug, data: [] };
                        }
                    })
                ),
                Promise.all(
                    LEVEL_SECTIONS.map(async (slug) => {
                        try {
                            let data = await newsService.getTaxonomyLevels(slug, activeLanguage);
                            if (!Array.isArray(data) || data.length === 0) {
                                const fallbackLang = activeLanguage === 'english' ? 'telugu' : 'english';
                                data = await newsService.getTaxonomyLevels(slug, fallbackLang);
                            }
                            return { slug, data: Array.isArray(data) ? data : [] };
                        } catch (err) {
                            console.warn(`Failed to fetch taxonomy levels for ${slug}:`, err);
                            return { slug, data: [] };
                        }
                    })
                ),
                newsService.getSections().catch(() => [])
            ]);

            const newData = {};
            [...treeResults, ...levelResults].forEach(({ slug, data }) => {
                newData[slugKey(slug)] = data;
            });

            setNavData(prev => ({ ...prev, ...newData }));
            setAllSections(sectionsData || []);

        } catch (error) {
            console.error('[MobileDrawer] Error fetching nav data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchNavData();
  }, [isOpen, activeLanguage]);

  // Helper for admin navigation that also closes the drawer
  const handleAdminNav = (path) => {
    navigate(path);
    onClose();
  };

  const isAdmin = userRole && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'EDITOR' || userRole === 'CONTRIBUTOR' || userRole === 'PUBLISHER');

  // Definitions for root level elements exactly matching PrimaryNav
  const navItems = [
      { name: t.navHome || "Home", icon: 'fas fa-home', path: '/', hasDropdown: false },
      {
          name: t.navAcademics || "Academics",
          icon: 'fas fa-graduation-cap',
          path: '/academics',
          hasDropdown: true,
          buildUrl: (item, sub) => sub 
              ? `/academics?category=${item.slug}&sub_category=${sub.slug}` 
              : `/academics?category=${item.slug}`,
          dropdownItems: navData.academics
      },
      {
          name: t.navExams || "Exams",
          icon: 'fas fa-pen-nib',
          path: '/academic-exams',
          hasDropdown: true,
          buildUrl: (item, sub) => sub 
              ? `/academic-exams?category=${item.slug}&sub_category=${sub.slug}` 
              : `/academic-exams?category=${item.slug || item.id}`,
          dropdownItems: navData.exams
      },
      {
          name: t.navCurrentAffairs || "Current Affairs",
          icon: 'fas fa-globe-americas',
          path: '/current-affairs',
          hasDropdown: true,
          buildUrl: (item, sub) => sub 
              ? `/current-affairs?category=${item.slug}&sub_category=${sub.slug}` 
              : `/current-affairs?category=${item.slug || item.id}`,
          dropdownItems: navData.currentAffairs
      },
      {
          name: t.navCampusPages || "Campus Pages",
          icon: 'fas fa-university',
          path: '/articles?section=campus-pages',
          hasDropdown: true,
          buildUrl: (item, sub) => sub 
              ? `/articles?section=campus-pages&category=${item.slug}&sub_category=${sub.slug}` 
              : `/articles?section=campus-pages&category=${item.slug || item.id}`,
          dropdownItems: navData.campusPages
      },
      {
          name: t.navNews || "News",
          icon: 'fas fa-bullhorn',
          path: '/news',
          hasDropdown: true,
          buildUrl: (item, sub) => sub 
              ? `/news?category=${item.slug}&sub_category=${sub.slug}` 
              : `/news?category=${item.slug || item.id}`,
          dropdownItems: navData.news
      },
      {
          name: t.navJobs || "Jobs",
          icon: 'fas fa-briefcase',
          path: '/jobs',
          hasDropdown: true,
          buildUrl: (item, sub) => sub 
              ? `/jobs?category=${item.slug}&sub_category=${sub.slug}` 
              : `/jobs?category=${item.slug || item.id}`,
          dropdownItems: navData.jobs
      },
      { name: t.navEStore || "E-Store", icon: 'fas fa-shopping-cart', path: '/e-store', hasDropdown: false },
      {
          name: t.navMore || "More",
          icon: 'fas fa-ellipsis-h',
          path: '#',
          hasDropdown: true,
          dropdownItems: [
              { name: t.navCurriculum || "Course Materials", path: '/curriculum' },
              { name: t.navVideos || "Videos", path: '/videos' },
              { name: t.navPreviousPapers || "Previous Papers", path: '/question-papers' },
              ...(allSections || [])
                  .filter(s => !TREE_SECTIONS.includes(s.slug))
                  .map(s => ({
                      name: s.name,
                      path: `/articles?section=${s.slug}`
                  }))
          ]
      }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="drawer-overlay"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="drawer-content"
          >
            <div className="drawer-header" style={{ padding: '16px 20px', maxHeight: '70px', overflow: 'hidden' }}>
              <NavLink to="/" className="drawer-logo" onClick={onClose} style={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src="/Career Vedha logo1.png" 
                  alt="Career Vedha" 
                  style={{ width: '140px', height: 'auto', objectFit: 'cover', margin: '-30px 0' }}
                />
              </NavLink>
              <button 
                onClick={onClose} 
                className="close-btn" 
                style={{ position: 'relative', top: '-5px' }}
              >
                <X size={24} />
              </button>
            </div>

            <div className="drawer-nav">
              {/* Dynamic Categories using Accordion for deeper nesting */}
              {isLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)' }}>
                      Loading Navigation...
                  </div>
              ) : (
                  navItems.map((item, idx) => (
                      <MobileNavAccordion 
                          key={idx} 
                          item={item} 
                          level={0} 
                          onClose={onClose} 
                      />
                  ))
              )}

              <NavLink to="/about" className="drawer-link" onClick={onClose}>
                <Info size={20} />
                <span>{t.navAbout || "About Us"}</span>
              </NavLink>
              <NavLink to="/contact" className="drawer-link" onClick={onClose}>
                <User size={20} />
                <span>{t.navContact || "Contact Us"}</span>
              </NavLink>

              {/* Admin Section */}
              {isAuthenticated && isAdmin && (
                <>
                  <div className="divider" />
                  <div 
                    className="drawer-link admin-toggle" 
                    onClick={() => setIsAdminOpen(!isAdminOpen)}
                    style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <LayoutDashboard size={20} color="var(--cv-primary)" />
                      <span style={{ fontWeight: '700', color: 'var(--gray-900)' }}>ADMIN CONSOLE</span>
                    </div>
                    {isAdminOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>

                  {isAdminOpen && (
                    <div className="admin-submenu" style={{ paddingLeft: '12px' }}>
                      <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=overview')}>
                        <LayoutDashboard size={18} />
                        <span>Overview</span>
                      </button>
                      
                      {checkAccess(userRole, MODULES.USER_MANAGEMENT) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=users')}>
                          <Users size={18} />
                          <span>Users</span>
                        </button>
                      )}

                      {checkAccess(userRole, MODULES.QUIZ_MANAGER) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=quizzes')}>
                          <Brain size={18} />
                          <span>Quizzes</span>
                        </button>
                      )}

                      {checkAccess(userRole, MODULES.ROLE_CONTROL) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=roles')}>
                          <Shield size={18} />
                          <span>Roles</span>
                        </button>
                      )}

                      {checkAccess(userRole, MODULES.PERMISSIONS) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=permissions')}>
                          <Key size={18} />
                          <span>Permissions</span>
                        </button>
                      )}

                      {userRole !== 'CONTRIBUTOR' && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=notifications')}>
                          <Bell size={18} />
                          <span>Notifications</span>
                        </button>
                      )}

                      <div className="divider" style={{ opacity: 0.3 }} />

                      {checkAccess(userRole, MODULES.ARTICLE_MANAGEMENT) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/dashboard?tab=articles')}>
                          <FileText size={18} />
                          <span>Articles CMS</span>
                        </button>
                      )}

                      {/* Hide Jobs CMS for Contributors explicitly */}
                      {userRole !== 'CONTRIBUTOR' && checkAccess(userRole, MODULES.JOB_MANAGEMENT) && (
                        <button className="drawer-link" onClick={() => handleAdminNav('/cms/jobs')}>
                          <Briefcase size={18} />
                          <span>Jobs CMS</span>
                        </button>
                      )}

                      <button className="drawer-link" onClick={() => handleAdminNav('/cms/taxonomy')}>
                        <Tags size={18} />
                        <span>Taxonomy</span>
                      </button>
                    </div>
                  )}
                </>
              )}

            </div>

            <div className="drawer-footer">
              <p>Version 1.1.0 {isAdmin && '(Admin Enabled)'}</p>
              <p>&copy; 2026 Career Vedha</p>
            </div>
          </motion.div>
        </>
      )}

    </AnimatePresence>
  );
};

export default MobileDrawer;
