import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import djangoApi from '../services/djangoApi'; // Keep for other parts if needed, but we use currentAffairsService
import { currentAffairsService } from '../services';
import TopBar from '../components/layout/TopBar';
import Header from '../components/layout/Header';
import PrimaryNav from '../components/layout/PrimaryNav';
import Footer from '../components/layout/Footer';
import '../styles/CurrentAffairs.css';

// Translation data
const translations = {
    en: {
        title: "Current Affairs",
        subtitle: "Stay updated with the latest happenings",
        international: "International",
        national: "India",
        statewide: "State-wise",
        selectState: "Select State",
        loading: "Fetching news...",
        error: "Failed to load news. Please try again later.",
        noNews: "No news articles found for this category.",
        readFull: "Read Full",
        loadMore: "Load More Articles"
    },
    te: {
        title: "ప్రస్తుత వ్యవహారాలు",
        subtitle: "తాజా సంఘటనలతో అప్‌డేట్‌గా ఉండండి",
        international: "అంతర్జాతీయ",
        national: "భారతదేశం",
        statewide: "రాష్ట్ర వారీగా",
        selectState: "రాష్ట్రాన్ని ఎంచుకోండి",
        loading: "వార్తలు తీసుకుంటోంది...",
        error: "వార్తలను లోడ్ చేయడంలో విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
        noNews: "ఈ వర్గానికి వార్తా కథనాలు కనుగొనబడలేదు.",
        readFull: "పూర్తిగా చదవండి",
        loadMore: "మరిన్ని కథనాలు లోడ్ చేయండి"
    }
};

const CurrentAffairs = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Sync with URL param
    const regionParam = searchParams.get('region');
    const [selectedRegion, setSelectedRegion] = useState(() => regionParam || 'ALL');

    useEffect(() => {
        if (regionParam) {
            setSelectedRegion(regionParam);
        } else if (location.search === "") {
            setSelectedRegion('ALL');
        }
    }, [regionParam]);

    const [hasMore, setHasMore] = useState(false);
    // Cursor pagination state
    const [cursorTime, setCursorTime] = useState(null);
    const [cursorId, setCursorId] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null); // Document viewer state
    const LIMIT = 12;

    const [activeLanguage, setActiveLanguage] = useState(() => {
        return localStorage.getItem('preferredLanguage') || 'telugu';
    });

    const lang = activeLanguage === 'telugu' ? 'te' : 'en';
    const langUpper = lang.toUpperCase();
    const t = translations[lang];

    // All Indian states and UTs with their codes and Telugu translations
    const regions = [
        { value: 'ALL', label: lang === 'te' ? 'అన్ని ప్రాంతాలు' : 'All Regions' },
        { value: 'INDIA', label: lang === 'te' ? 'భారతదేశం (జాతీయ)' : 'India (National)' },
        { value: 'AP', label: lang === 'te' ? 'ఆంధ్ర ప్రదేశ్' : 'Andhra Pradesh' },
        { value: 'AR', label: lang === 'te' ? 'అరుణాచల్ ప్రదేశ్' : 'Arunachal Pradesh' },
        { value: 'AS', label: lang === 'te' ? 'అస్సాం' : 'Assam' },
        { value: 'BR', label: lang === 'te' ? 'బీహార్' : 'Bihar' },
        { value: 'CG', label: lang === 'te' ? 'ఛత్తీస్‌గఢ్' : 'Chhattisgarh' },
        { value: 'GA', label: lang === 'te' ? 'గోవా' : 'Goa' },
        { value: 'GJ', label: lang === 'te' ? 'గుజరాత్' : 'Gujarat' },
        { value: 'HR', label: lang === 'te' ? 'హర్యానా' : 'Haryana' },
        { value: 'HP', label: lang === 'te' ? 'హిమాచల్ ప్రదేశ్' : 'Himachal Pradesh' },
        { value: 'JH', label: lang === 'te' ? 'జార్ఖండ్' : 'Jharkhand' },
        { value: 'KA', label: lang === 'te' ? 'కర్ణాటక' : 'Karnataka' },
        { value: 'KL', label: lang === 'te' ? 'కేరళ' : 'Kerala' },
        { value: 'MP', label: lang === 'te' ? 'మధ్య ప్రదేశ్' : 'Madhya Pradesh' },
        { value: 'MH', label: lang === 'te' ? 'మహారాష్ట్ర' : 'Maharashtra' },
        { value: 'MN', label: lang === 'te' ? 'మణిపూర్' : 'Manipur' },
        { value: 'ML', label: lang === 'te' ? 'మేఘాలయ' : 'Meghalaya' },
        { value: 'MZ', label: lang === 'te' ? 'మిజోరం' : 'Mizoram' },
        { value: 'NL', label: lang === 'te' ? 'నాగాలాండ్' : 'Nagaland' },
        { value: 'OD', label: lang === 'te' ? 'ఒడిశా' : 'Odisha' },
        { value: 'PB', label: lang === 'te' ? 'పంజాబ్' : 'Punjab' },
        { value: 'RJ', label: lang === 'te' ? 'రాజస్థాన్' : 'Rajasthan' },
        { value: 'SK', label: lang === 'te' ? 'సిక్కిం' : 'Sikkim' },
        { value: 'TN', label: lang === 'te' ? 'తమిళనాడు' : 'Tamil Nadu' },
        { value: 'TS', label: lang === 'te' ? 'తెలంగాణ' : 'Telangana' },
        { value: 'TR', label: lang === 'te' ? 'త్రిపుర' : 'Tripura' },
        { value: 'UP', label: lang === 'te' ? 'ఉత్తర ప్రదేశ్' : 'Uttar Pradesh' },
        { value: 'UK', label: lang === 'te' ? 'ఉత్తరాఖండ్' : 'Uttarakhand' },
        { value: 'WB', label: lang === 'te' ? 'పశ్చిమ బెంగాల్' : 'West Bengal' },
        { value: 'DL', label: lang === 'te' ? 'ఢిల్లీ' : 'Delhi' },
        { value: 'JK', label: lang === 'te' ? 'జమ్మూ & కాశ్మీర్' : 'Jammu & Kashmir' },
        { value: 'LA', label: lang === 'te' ? 'లడఖ్' : 'Ladakh' },
        { value: 'PY', label: lang === 'te' ? 'పుదుచ్చేరి' : 'Puducherry' },
        { value: 'AN', label: lang === 'te' ? 'అండమాన్ & నికోబార్' : 'Andaman & Nicobar' },
        { value: 'CH', label: lang === 'te' ? 'చండీగఢ్' : 'Chandigarh' },
        { value: 'DN', label: lang === 'te' ? 'దాద్రా & నగర్ హవేలీ' : 'Dadra & Nagar Haveli' },
        { value: 'DD', label: lang === 'te' ? 'దామన్ & డయ్యూ' : 'Daman & Diu' },
        { value: 'LD', label: lang === 'te' ? 'లక్షద్వీప్' : 'Lakshadweep' }
    ];

    useEffect(() => {
        setNews([]);
        setCursorTime(null);
        setCursorId(null);
        fetchNews(null, null, true);
    }, [activeLanguage, selectedRegion]);

    const fetchNews = async (cTime = null, cId = null, isFresh = false) => {
        try {
            setLoading(true);
            const params = { 
                language: langUpper, 
                limit: LIMIT 
            };
            
            if (cTime) params.cursorTime = cTime;
            if (cId) params.cursorId = cId;

            let response;
            if (selectedRegion === 'ALL') {
                // Fetch all current affairs
                response = await currentAffairsService.getAllAffairs(params);
            } else if (selectedRegion === 'INDIA') {
                // Use getAllAffairs with limit 20 for INDIA as specifically requested
                const indiaParams = { ...params, limit: 20 };
                response = await currentAffairsService.getAllAffairs(indiaParams);
            } else {
                // Fetch by specific region
                response = await currentAffairsService.getByRegion(selectedRegion, params);
            }

            console.log(`[CurrentAffairs] Fetched for region: ${selectedRegion}, lang: ${langUpper}`, response);
            const newArticles = Array.isArray(response) ? response : [];
            
            if (isFresh) {
                setNews(newArticles);
            } else {
                setNews(prev => [...prev, ...newArticles]);
            }
            
            // Cursor update for next page
            if (newArticles.length > 0) {
                const lastItem = newArticles[newArticles.length - 1];
                setCursorTime(lastItem.creationorupdationDate);
                setCursorId(lastItem.id);
            }

            // Determine the limit used for this request
            const limitUsed = (selectedRegion === 'INDIA') ? 20 : LIMIT;
            setHasMore(newArticles.length === limitUsed);
            setError(null);
        } catch (err) {
            console.error('Error fetching news:', err);
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        fetchNews(cursorTime, cursorId);
    };

    const handleLanguageChange = (lang) => {
        setActiveLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    const stripHtml = (html) => {
        if (!html) return "";
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    return (
        <div className="current-affairs-page">
            <TopBar />
            <Header
                onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                isMenuOpen={isMobileMenuOpen}
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
            />
            <PrimaryNav isOpen={isMobileMenuOpen} />

            <div className="container py-5">
                <div className="section-header mb-4">
                    <div className="header-title-section">
                        <h1 className="premium-title">{t.title}</h1>
                        <p className="premium-subtitle">{t.subtitle}</p>
                    </div>
                    
                    {/* Region Filter Dropdown */}
                    <div className="controls-row">
                        <div className="region-filter-container">
                            <label htmlFor="region-select" className="filter-label">
                                <i className="fas fa-map-marked-alt"></i> 
                                {lang === 'te' ? 'ప్రాంతం ఎంచుకోండి' : 'Filter by Region'}:
                            </label>
                            <select
                                id="region-select"
                                className="region-select-styled"
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                            >
                                {regions.map((region) => (
                                    <option key={region.value} value={region.value}>
                                        {region.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="premium-loader-container">
                        <div className="premium-spinner"></div>
                        <p>{t.loading}</p>
                    </div>
                ) : error ? (
                    <div className="error-container">
                        <i className="fas fa-exclamation-circle"></i>
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="news-grid">
                            {news.length > 0 ? (
                                news.map((item, index) => (
                                    <div key={item.id || index} className="news-card-premium">
                                        {item.fileUrl && (
                                            <div className="news-card-image">
                                                <img 
                                                    src={item.fileUrl} 
                                                    alt={item.title} 
                                                    onError={(e) => {
                                                        // Fallback for PDF icons or broken images
                                                        if (item.fileUrl.toLowerCase().endsWith('.pdf')) {
                                                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/337/337946.png';
                                                        } else {
                                                            e.target.style.display = 'none';
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="news-card-content">
                                            <span className="region-tag">
                                                {item.region}
                                            </span>
                                            <h3 className="news-title">{item.title}</h3>
                                            <p className="news-description">
                                                {item.summary || stripHtml(item.description)}
                                            </p>
                                            <div className="news-card-footer">
                                                <span className="news-date">
                                                    {item.creationorupdationDate ? new Date(item.creationorupdationDate).toLocaleDateString() : ''}
                                                </span>
                                                <button 
                                                    onClick={() => setSelectedDoc(item)} 
                                                    className="read-more-link"
                                                    style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700', fontSize: '0.9rem'}}
                                                >
                                                    {t.readFull} <i className="fas fa-arrow-right"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-news-message">
                                    <p>{t.noNews}</p>
                                </div>
                            )}
                        </div>

                        {hasMore && (
                            <div className="load-more-container">
                                <button 
                                    className="load-more-btn" 
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="btn-spinner"></div>
                                            {t.loading}
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-plus-circle"></i>
                                            {t.loadMore}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Document Viewer Modal */}
            {selectedDoc && (
                <div className="doc-viewer-overlay" onClick={() => setSelectedDoc(null)}>
                    <div className="doc-viewer-content" onClick={e => e.stopPropagation()}>
                        <div className="doc-viewer-header">
                            <span className="doc-viewer-title">{selectedDoc.title}</span>
                            <button className="doc-viewer-close" onClick={() => setSelectedDoc(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="doc-viewer-body">
                            {(() => {
                                const fileUrl = selectedDoc.fileUrl || '';
                                const cleanUrl = fileUrl.split('?')[0].toLowerCase();
                                const isPdf = cleanUrl.endsWith('.pdf');

                                if (isPdf) {
                                    return (
                                        <iframe 
                                            src={fileUrl} 
                                            className="doc-frame" 
                                            title="Document Viewer"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                document.getElementById('doc-error').style.display = 'block';
                                            }}
                                        ></iframe>
                                    );
                                } else {
                                    return (
                                        <img 
                                            src={fileUrl} 
                                            alt={selectedDoc.title} 
                                            className="doc-image" 
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                // If image fails, try showing as iframe (maybe it's a doc/pdf misclassified?)
                                                // Or just show error
                                                const parent = e.target.parentElement;
                                                const errorMsg = document.createElement('div');
                                                errorMsg.className = 'error-message';
                                                errorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <p>Unable to preview this file correctly.</p><a href="' + fileUrl + '" target="_blank" class="download-link">Open in New Tab</a>';
                                                errorMsg.style.textAlign = 'center';
                                                errorMsg.style.marginTop = '2rem';
                                                parent.appendChild(errorMsg);
                                            }}
                                        />
                                    );
                                }
                            })()}
                            <div id="doc-error" style={{display: 'none', textAlign: 'center', marginTop: '2rem'}}>
                                <p>Unable to load document.</p>
                                <a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="load-more-btn" style={{display: 'inline-flex', marginTop: '1rem'}}>
                                    Open in New Tab
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default CurrentAffairs;
