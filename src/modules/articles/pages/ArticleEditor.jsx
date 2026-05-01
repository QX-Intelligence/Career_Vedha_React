import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import CustomSelect from '../../../components/ui/CustomSelect';
import LuxuryDateTimePicker from '../../../components/ui/LuxuryDateTimePicker';
import MediaLibraryModal from '../../media/components/MediaLibraryModal';
import api, { getUserContext, subscribeToAuthChanges, logout } from '../../../services/api';
import { newsService } from '../../../services';
import mediaService from '../../../services/mediaService';
import { useSnackbar } from '../../../context/SnackbarContext';
import API_CONFIG from '../../../config/api.config';
import CMSLayout from '../../../components/layout/CMSLayout';
import { MODULES, checkAccess as checkAccessGlobal } from '../../../config/accessControl.config.js';
import { useArticle, useCreateArticle, useUpdateArticle, usePublishArticle, useAssignCategories } from '../../../hooks/useArticles';
import { useAdminCategories, useTaxonomyLevels, useTaxonomyTree, useSections, useCategoryChildren, useFetchCategoryChildren, useCategoriesBySection } from '../../../hooks/useTaxonomy';
import './ArticleEditor.css';
import '../../../styles/Dashboard.css';
import ReactQuill from 'react-quill';

// ─── Custom Embed Blot for Tables ────────────────────────────────────────────
// By making the table an "Embed", Quill treats the entire table as a single, opaque character.
// This prevents Quill from trying to parse the nested HTML or intercepting Enter keys inside cells.
const Quill = ReactQuill.Quill;
if (Quill) {
    const BlockEmbed = Quill.import('blots/block/embed');

    class CustomTableBlot extends BlockEmbed {
        static create(value) {
            const node = super.create();
            node.setAttribute('contenteditable', 'false');
            node.innerHTML = value;

            // Make cells editable but stop event propagation to hide typing from Quill
            setTimeout(() => {
                const cells = node.querySelectorAll('td, th');
                cells.forEach(cell => {
                    cell.setAttribute('contenteditable', 'true');
                    // Prevent Quill from hijacking Enter, Backspace, or Arrow keys inside the table
                    cell.addEventListener('keydown', (e) => {
                        e.stopPropagation();
                    });
                    cell.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                    });
                });
            }, 0);

            return node;
        }

        static value(node) {
            return node.innerHTML;
        }
    }

    CustomTableBlot.blotName = 'custom-table';
    CustomTableBlot.tagName = 'div';
    CustomTableBlot.className = 'custom-table-wrapper';

    Quill.register(CustomTableBlot, true);
}

// ─── Robust Quill Wrapper ────────────────────────────────────────────────────
const QuillWrapper = React.forwardRef(({ value, onChange, placeholder, modules, formats, className }, ref) => {
    const quillRef = useRef(null);

    React.useImperativeHandle(ref, () => ({
        getEditor: () => {
            return quillRef.current ? quillRef.current.getEditor() : null;
        },
        insertTableDirect: (tableHTML) => {
            if (!quillRef.current) return;
            const editor = quillRef.current.getEditor();
            const range = editor.getSelection(true) || { index: editor.getLength() };
            // Insert the table as a custom embed block
            editor.insertEmbed(range.index, 'custom-table', tableHTML, 'user');
            // Move cursor to the next line so the user can continue typing below the table
            editor.setSelection(range.index + 1, 'user');
        }
    }));

    const handleChange = (content, delta, source) => {
        if (source === 'user') {
            onChange(content);
        }
    };

    return (
        <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value || ''}
            onChange={handleChange}
            modules={modules}
            placeholder={placeholder}
            className={className}
        />
    );
});

// Helper to clean internal editor attributes before saving
const cleanEditorHTML = (html) => {
    if (!html) return html;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const editables = tempDiv.querySelectorAll('[contenteditable]');
    editables.forEach(el => el.removeAttribute('contenteditable'));
    return tempDiv.innerHTML;
};

const ArticleEditor = () => {
    const { section: sectionParam, id } = useParams();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const isEditMode = !!id;
    const prefillDoneRef = useRef(false);
    const quillEditorRef = useRef(null);

    // UI State
    const [isCmsOpen, setIsCmsOpen] = useState(true);

    const [formData, setFormData] = useState({
        section: '',
        slug: '',
        language: 'en', // Default English
        eng_title: '',
        eng_content: '',
        eng_summary: '',
        tel_title: '',
        tel_content: '',
        tel_summary: '',
        tags: '',
        category_ids: [],
        noindex: false,
        keywords: '',
        canonical_url: '',
        meta_title: '',
        meta_description: '',
        og_title: '',
        og_image_url: '',
        og_description: '',
        expires_at: '',
        status: 'DRAFT',
        youtube_url: '',
        additional_sections: [],
        is_top_story: false
    });

    // Hierarchical taxonomy state
    const [level1, setLevel1] = useState(''); // Section (e.g. Academics)
    const [level2, setLevel2] = useState(''); // Root Category
    const [level3, setLevel3] = useState(''); // Sub Category
    const [level4, setLevel4] = useState(''); // Segment
    const [level5, setLevel5] = useState(''); // Topic

    // Multi-selection state
    const [selectedCategories, setSelectedCategories] = useState([]);

    const userRole = getUserContext().role;
    const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);
    const isAdminUser = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(userRole);

    // React Query hooks
    const { data: dynamicSections } = useSections(isAdminUser);
    const sections = useMemo(() => Array.isArray(dynamicSections) ? dynamicSections : (dynamicSections?.results || []), [dynamicSections]);

    const treeQueries = useQueries({
        queries: sections.map(s => ({
            queryKey: ['taxonomy', 'admin', 'categories', 'tree', s.slug || s.name],
            queryFn: () => newsService.getTaxonomyTree(s.slug || s.name),
            staleTime: 5 * 60 * 1000,
        }))
    });

    const currentSectionSlug = level1?.toLowerCase() || sectionParam?.toLowerCase() || '';
    const currentLevelsIdx = sections.findIndex(s => {
        const slug = (s.slug || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        return slug === currentSectionSlug || name === currentSectionSlug;
    });

    // Background loading status for UI feedback (localized)
    const activeTreeQuery = (currentLevelsIdx !== -1) ? treeQueries[currentLevelsIdx] : null;

    const loadingTaxonomy = !!(activeTreeQuery?.isLoading);
    const isTaxonomyError = !!(activeTreeQuery?.isError);

    // Derived lists for cascading dropdowns
    // 1. Flatten the ALL taxonomy structures from ALL sections to help with pre-filling and cross-section support
    const fullHierarchy = useMemo(() => {
        const flat = [];

        // Iterate through all tree queries from all sections
        treeQueries.forEach((query, idx) => {
            const sectionSlug = sections[idx]?.slug || sections[idx]?.name;
            const treeData = query.data;

            if (Array.isArray(treeData)) {
                const flatten = (nodes, level = 2, parentId = null) => {
                    nodes.forEach(node => {
                        if (node && node.id) {
                            flat.push({
                                id: node.id,
                                name: node.name,
                                level,
                                parent_id: parentId,
                                section: sectionSlug
                            });

                            // Recursive traversal for all levels
                            if (Array.isArray(node.children) && level < 5) {
                                flatten(node.children, level + 1, node.id);
                            }
                        }
                    });
                };
                flatten(treeData);
            }
        });

        return flat;
    }, [treeQueries.map(q => q.data), sections]);

    // Legacy heirarchy for current section (used for path tracing in step 2)
    const hierarchy = useMemo(() => {
        return fullHierarchy.filter(h => h.section === currentSectionSlug);
    }, [fullHierarchy, currentSectionSlug]);

    // 2. Generate Dropdown Options natively from the nested Tree
    const level2List = useMemo(() => {
        const treeData = activeTreeQuery?.data;
        if (!Array.isArray(treeData)) return [];
        return treeData.map(c => ({ value: c.id?.toString(), label: c.name }));
    }, [activeTreeQuery?.data, level1]);

    const level3List = useMemo(() => {
        if (!level2) return [];
        const treeData = activeTreeQuery?.data;
        if (!Array.isArray(treeData)) return [];

        const l2Node = treeData.find(c => c.id?.toString() === level2?.toString());
        if (!l2Node || !Array.isArray(l2Node.children)) return [];
        return l2Node.children.map(c => ({ value: c.id?.toString(), label: c.name }));
    }, [activeTreeQuery?.data, level2]);

    const level4List = useMemo(() => {
        if (!level3) return [];
        const treeData = activeTreeQuery?.data;
        if (!Array.isArray(treeData)) return [];

        const l2Node = treeData.find(c => c.id?.toString() === level2?.toString());
        if (!l2Node || !Array.isArray(l2Node.children)) return [];

        const l3Node = l2Node.children.find(c => c.id?.toString() === level3?.toString());
        if (!l3Node || !Array.isArray(l3Node.children)) return [];
        return l3Node.children.map(c => ({ value: c.id?.toString(), label: c.name }));
    }, [activeTreeQuery?.data, level2, level3]);

    const level5List = useMemo(() => {
        if (!level4) return [];
        const treeData = activeTreeQuery?.data;
        if (!Array.isArray(treeData)) return [];

        const l2Node = treeData.find(c => c.id?.toString() === level2?.toString());
        if (!l2Node || !Array.isArray(l2Node.children)) return [];

        const l3Node = l2Node.children.find(c => c.id?.toString() === level3?.toString());
        if (!l3Node || !Array.isArray(l3Node.children)) return [];

        const l4Node = l3Node.children.find(c => c.id?.toString() === level4?.toString());
        if (!l4Node || !Array.isArray(l4Node.children)) return [];
        return l4Node.children.map(c => ({ value: c.id?.toString(), label: c.name }));
    }, [activeTreeQuery?.data, level2, level3, level4]);

    const createArticleMutation = useCreateArticle();
    const updateArticleMutation = useUpdateArticle();
    const publishArticleMutation = usePublishArticle();
    const assignCategoriesMutation = useAssignCategories();

    // Mutation loading state (Manual overrides for multipart form submittals)
    const [isSaving, setIsSaving] = useState(false);

    const { data: articleData, isLoading: loadingArticle } = useArticle(id, {
        enabled: isEditMode,
        staleTime: 0,
        gcTime: 0
    });

    // Media Upload State
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerMediaId, setBannerMediaId] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    const [mainFile, setMainFile] = useState(null);
    const [mainMediaId, setMainMediaId] = useState(null);
    const [mainPreview, setMainPreview] = useState(null);

    // PDF Upload State
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfPreview, setPdfPreview] = useState(null); // Just for displaying filename
    const [pdfFile2, setPdfFile2] = useState(null);
    const [pdfPreview2, setPdfPreview2] = useState(null);

    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [activeMediaTarget, setActiveMediaTarget] = useState('banner');

    // Publish State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    // Related Articles Preview
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    /* ================= AUTH CHECK ================= */
    useEffect(() => {
        const { role, isAuthenticated } = getUserContext();
        const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER', 'EDITOR', 'CONTRIBUTOR'];
        if (!isAuthenticated || !allowedRoles.includes(role)) {
            return navigate('/admin-login');
        }
    }, [navigate]);

    // Populate form when article data is loaded
    useEffect(() => {
        if (articleData && isEditMode) {
            const article = articleData;
            const translations = article.translations || [];
            const telTrans = translations.find(t => t.language === 'te' || t.language_code === 'te');
            const engTrans = translations.find(t => t.language === 'en' || t.language_code === 'en');

            setFormData({
                ...article,
                tags: Array.isArray(article.tags)
                    ? article.tags.join(', ')
                    : (article.tags || ''),
                section: article.section || sectionParam || '',
                language: (() => {
                    const teluguRegex = /[\u0c00-\u0c7f]/;
                    const telHasTeluguChars = telTrans && (teluguRegex.test(telTrans.title || '') || teluguRegex.test(telTrans.content || '') || teluguRegex.test(telTrans.summary || ''));
                    if (telHasTeluguChars) return 'te';
                    if (engTrans && (engTrans.content || engTrans.summary)) return 'en';
                    if (telTrans && (telTrans.content || telTrans.summary)) return 'te';
                    return 'te';
                })(),
                eng_title: article.eng_title || engTrans?.title || (article.language === 'en' ? article.title : ''),
                eng_content: article.eng_content || engTrans?.content || (article.language === 'en' ? article.content : ''),
                eng_summary: article.eng_summary || engTrans?.summary || (article.language === 'en' ? article.summary : ''),
                tel_title: article.tel_title || telTrans?.title || (article.language === 'te' ? article.title : ''),
                tel_content: article.tel_content || telTrans?.content || (article.language === 'te' ? article.content : ''),
                tel_summary: article.tel_summary || telTrans?.summary || (article.language === 'te' ? article.summary : ''),
                category_ids: (article.article_categories && article.article_categories.length > 0) ? article.article_categories.map(c => c.category_id) : (article.categories ? article.categories.map(c => c.id) : []),
                youtube_url: article.youtube_url || '',
                is_top_story: article.is_top_story || (article.features && article.features.some(f => f.feature_type === 'TOP')) || false,
                additional_sections: article.additional_sections || [],
            });

            // Set Level 1 from section
            if (article.section) {
                setLevel1(article.section);
            }

            // Prefill Media Previews
            const mediaLinks = article.media_links || [];
            const bannerMedia = mediaLinks.find(m => m.usage === 'BANNER');
            const mainMedia = mediaLinks.find(m => m.usage === 'MAIN');

            if (bannerMedia && bannerMedia.media_details) {
                setBannerMediaId(bannerMedia.media_details.id);
                setBannerPreview(bannerMedia.media_details.url);
            }
            if (mainMedia && mainMedia.media_details) {
                setMainMediaId(mainMedia.media_details.id);
                setMainPreview(mainMedia.media_details.url);
            }

            // Prefill PDF
            const pdfMedias = mediaLinks.filter(m => m.media_type === 'pdf' || (m.media_details && m.media_details.media_type === 'pdf'));
            if (pdfMedias.length > 0) {
                if (pdfMedias[0].media_details) setPdfPreview(pdfMedias[0].media_details.url);
                if (pdfMedias[1] && pdfMedias[1].media_details) setPdfPreview2(pdfMedias[1].media_details.url);
            }
        }
    }, [articleData, isEditMode, sectionParam]);

    // Reset prefill state when ID changes (important for navigation between articles)
    useEffect(() => {
        if (id && isEditMode) {
            prefillDoneRef.current = false;
            setSelectedCategories([]);
            setLevel2(''); setLevel3(''); setLevel4(''); setLevel5('');
        }
    }, [id, isEditMode]);

    // Prefill selected categories when hierarchy is loaded in edit mode
    useEffect(() => {
        // Guard: Wait for all pieces to be ready (level1 MUST be set to avoid premature lock)
        if (isEditMode && fullHierarchy?.length > 0 && articleData && level1 && !prefillDoneRef.current) {
            console.log(`[Prefill] Starting match for IDs:`, articleData.category_ids || articleData.categories);

            const rawIds = (articleData.article_categories && articleData.article_categories.length > 0)
                ? articleData.article_categories.map(c => c.category_id)
                : (articleData.categories ? articleData.categories.map(c => (c.id || c.category_id)) : []);

            const ids = rawIds.map(rid => Number(rid)).filter(rid => !isNaN(rid));

            if (ids.length > 0) {
                const matched = fullHierarchy.filter(h => ids.includes(Number(h.id)));
                if (matched.length > 0) {
                    setSelectedCategories(matched.map(m => ({
                        id: m.id,
                        name: m.name,
                        level: m.level,
                        section: m.section
                    })));

                    // Trace deepest path — use case-insensitive match for current section first
                    const currentSectionItems = matched.filter(m =>
                        (m.section || '').toLowerCase() === (level1 || '').toLowerCase()
                    );

                    // Fallback: if no categories match current section, use ALL matched items
                    const itemsToTrace = currentSectionItems.length > 0 ? currentSectionItems : matched;
                    const maxLevelItem = itemsToTrace.reduce((max, item) => (item.level || 0) > (max.level || 0) ? item : max, { level: 0 });

                    if (maxLevelItem && maxLevelItem.level > 1) {
                        // If categories are from a different section, switch Level 1 to match
                        if (currentSectionItems.length === 0 && maxLevelItem.section) {
                            console.log(`[Prefill] Switching Level 1 from "${level1}" to "${maxLevelItem.section}" to match category section`);
                            setLevel1(maxLevelItem.section);
                        }

                        let curr = maxLevelItem;
                        let l5 = '', l4 = '', l3 = '', l2 = '';

                        while (curr) {
                            if (curr.level === 5) l5 = String(curr.id);
                            if (curr.level === 4) l4 = String(curr.id);
                            if (curr.level === 3) l3 = String(curr.id);
                            if (curr.level === 2) l2 = String(curr.id);

                            // Move up to the parent using Number safe comparison within the SAME section
                            const parentId = curr.parent_id;
                            curr = parentId ? fullHierarchy.find(h => Number(h.id) === Number(parentId) && h.section === curr.section) : null;
                        }

                        if (l2) setLevel2(l2);
                        if (l3) setLevel3(l3);
                        if (l4) setLevel4(l4);
                        if (l5) setLevel5(l5);
                    }
                    prefillDoneRef.current = true;
                }
            } else {
                prefillDoneRef.current = true;
            }
        }
    }, [isEditMode, fullHierarchy, articleData, level1]);

    // Sync level1 to formData.section
    useEffect(() => {
        if (level1) {
            setFormData(prev => {
                if (prev.section === level1) return prev;
                return { ...prev, section: level1 };
            });
        }
    }, [level1]);

    // Removed cascading array resets from effect logic safely.
    // They are now handled explicitly inline during UI onChange actions.

    // Help keep selected categories in sync with formData
    useEffect(() => {
        // Skip sync if we are in Edit mode but pre-filling hasn't happened yet
        if (isEditMode && !prefillDoneRef.current && selectedCategories.length === 0) {
            return;
        }

        const categoryIds = selectedCategories.map(cat => cat.id);

        // Automatically derive additional sections from selected categories
        const primarySection = level1;
        const otherSections = [...new Set(
            selectedCategories
                .map(cat => cat.section)
                .filter(sec => sec && sec !== primarySection)
        )];

        setFormData(prev => ({
            ...prev,
            category_ids: categoryIds,
            additional_sections: [...new Set([...(prev.additional_sections || []), ...otherSections])]
        }));
    }, [selectedCategories, isEditMode, level1]);

    // Helper to add a category to the list
    const addCategory = useCallback((id, name, level) => {
        if (!id) return;
        setSelectedCategories(prev => {
            if (prev.find(c => String(c.id) === String(id))) return prev;
            return [...prev, { id, name, level, section: level1 }];
        });
    }, [level1]);

    const removeCategory = useCallback((id) => {
        setSelectedCategories(prev => prev.filter(c => String(c.id) !== String(id)));
    }, []);

    // Toggle an additional secondary section
    const toggleAdditionalSection = (secSlug) => {
        if (!secSlug || secSlug === formData.section) return;
        setFormData(prev => {
            const current = prev.additional_sections || [];
            if (current.includes(secSlug)) {
                return { ...prev, additional_sections: current.filter(s => s !== secSlug) };
            }
            return { ...prev, additional_sections: [...current, secSlug] };
        });
    };

    const [errors, setErrors] = useState({});

    const isContentEmpty = (content) => {
        if (!content) return true;
        const hasMedia = content.includes('<img') || content.includes('<iframe');
        const textContent = content.replace(/<[^>]*>/g, '').trim();
        return !textContent && !hasMedia;
    };

    const validateForm = () => {
        const newErrors = {};

        // 1. Core Mandatory Fields
        if (!String(formData.slug || '').trim()) {
            newErrors.slug = true;
            showSnackbar('URL Slug is required', 'error');
        }

        if (!level1) {
            newErrors.level1 = true;
            showSnackbar('Main Section (Level 1) is required', 'error');
        }

        if (selectedCategories.length === 0 && (formData.category_ids || []).length === 0) {
            newErrors.categories = true;
            showSnackbar('At least one Category is required *', 'error');
        }

        // 2. Content Requirement: (tel_title && tel_summary) OR (eng_title && eng_summary)
        const hasTelugu = String(formData.tel_title || '').trim() && !isContentEmpty(formData.tel_content) && String(formData.tel_summary || '').trim();
        const hasEnglish = String(formData.eng_title || '').trim() && !isContentEmpty(formData.eng_content) && String(formData.eng_summary || '').trim();

        if (!hasTelugu && !hasEnglish) {
            showSnackbar('Please provide Title, Content, and Summary in at least one language (Telugu or English)', 'error');
            if (formData.language === 'te') {
                if (!String(formData.tel_title || '').trim()) newErrors.tel_title = true;
                if (isContentEmpty(formData.tel_content)) newErrors.tel_content = true;
                if (!String(formData.tel_summary || '').trim()) newErrors.tel_summary = true;
            } else {
                if (!String(formData.eng_title || '').trim()) newErrors.eng_title = true;
                if (isContentEmpty(formData.eng_content)) newErrors.eng_content = true;
                if (!String(formData.eng_summary || '').trim()) newErrors.eng_summary = true;
            }
        }

        // 3. Additional Required Fields
        if (!String(formData.keywords || '').trim()) {
            newErrors.keywords = true;
            showSnackbar('Keywords are required for better SEO *', 'error');
        }

        // 4. Media Requirement
        if (!mainFile && !mainMediaId && !bannerFile && !bannerMediaId) {
            newErrors.media = true;
            showSnackbar('Please upload or select at least one image *', 'error');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return false;
        }

        setErrors({});
        return true;
    };

    const handleInputChange = (e) => {
        let { name, value, type, checked } = e.target;

        // 🔗 Auto-slugify: Replace spaces with hyphens and convert to lowercase in real-time
        if (name === 'slug' && value) {
            value = value.toLowerCase().replace(/\s+/g, '-');
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Effect to fetch related articles preview
    useEffect(() => {
        const fetchRelatedPreview = async () => {
            if (!formData.section || (formData.category_ids.length === 0 && !formData.tags)) {
                setRelatedArticles([]);
                return;
            }
            try {
                setLoadingRelated(true);
                const results = await newsService.getAdminArticles?.({
                    section: formData.section,
                    limit: 5
                }) || { results: [] };

                // Safely handle source tags (from form)
                const rawTags = formData.tags;
                const tagsToMatch = Array.isArray(rawTags)
                    ? rawTags.map(t => String(t || '').trim().toLowerCase()).filter(t => t)
                    : (typeof rawTags === 'string' ? rawTags.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : []);

                const filtered = results.results?.filter(a => {
                    if (a.id == id) return false;

                    // Safely handle target article tags
                    const aTagsRaw = a.tags || [];
                    const aTags = Array.isArray(aTagsRaw)
                        ? aTagsRaw.map(t => String(t || '').trim().toLowerCase()).filter(t => t)
                        : (typeof aTagsRaw === 'string' ? aTagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(t => t) : []);

                    const matchesTags = aTags.some(at => tagsToMatch.includes(at));
                    const matchesCats = a.article_categories?.some(ac => formData.category_ids?.includes(ac.category_id));

                    return matchesTags || matchesCats;
                }).slice(0, 5) || [];
                setRelatedArticles(filtered);
            } catch (error) {
                console.error("Error fetching related preview:", error);
            } finally {
                setLoadingRelated(false);
            }
        };
        const timeoutId = setTimeout(fetchRelatedPreview, 1000);
        return () => clearTimeout(timeoutId);
    }, [formData.category_ids, formData.tags, formData.section, id]);

    const handleEditorChange = (name, content) => {
        setFormData(prev => ({ ...prev, [name]: content }));
    };

    // Enhanced Quill modules with full formatting
    // Enhanced Quill modules with full formatting (Memoized to prevent cursor jump/loss of focus)
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'font': [] }],
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link', 'image', 'video'],
                ['blockquote', 'code-block'],
                ['clean']
            ]
        }
    }), []);

    const insertTableHTML = () => {
        if (!quillEditorRef.current) return;

        const rowsStr = prompt('Enter number of rows:', '3');
        const colsStr = prompt('Enter number of columns:', '3');
        if (rowsStr && colsStr) {
            const rows = parseInt(rowsStr);
            const cols = parseInt(colsStr);
            if (!isNaN(rows) && !isNaN(cols) && rows > 0 && cols > 0) {
                let tableHTML = '<table class="ql-table-custom" style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 1rem;"><tbody>';
                for (let i = 0; i < rows; i++) {
                    tableHTML += '<tr>';
                    for (let j = 0; j < cols; j++) {
                        tableHTML += '<td style="border: 1px solid #ccc; padding: 8px; min-height: 30px; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; max-width: 250px; vertical-align: top;"><br></td>';
                    }
                    tableHTML += '</tr>';
                }
                tableHTML += '</tbody></table><p><br></p>';

                quillEditorRef.current.insertTableDirect(tableHTML);
            }
        }
    };

    // Removed formats constraint to allow all registered formats (like table blots)

    // Media Upload Handlers
    const handleImageFileChange = (e, target = 'main') => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const maxSize = 10 * 1024 * 1024;
            if (!validTypes.includes(file.type)) {
                showSnackbar('Invalid file type. Please upload an image (JPEG, PNG, WebP).', 'error');
                return;
            }
            if (file.size > maxSize) {
                showSnackbar('File size exceeds 10MB limit.', 'error');
                return;
            }

            if (target === 'banner') {
                setBannerFile(file);
                setBannerMediaId(null);
                const reader = new FileReader();
                reader.onloadend = () => setBannerPreview(reader.result);
                reader.readAsDataURL(file);
            } else {
                setMainFile(file);
                setMainMediaId(null);
                const reader = new FileReader();
                reader.onloadend = () => setMainPreview(reader.result);
                reader.readAsDataURL(file);
            }
        }
    };


    const handleMediaLibrarySelect = (mediaId, mediaUrl) => {
        if (activeMediaTarget === 'banner') {
            setBannerMediaId(mediaId);
            setBannerFile(null);
            setBannerPreview(mediaUrl);
        } else {
            setMainMediaId(mediaId);
            setMainFile(null);
            setMainPreview(mediaUrl);
        }
        setShowMediaLibrary(false);
    };

    const clearBannerMedia = () => {
        setBannerFile(null);
        setBannerMediaId(null);
        setBannerPreview(null);
    };

    const clearMainMedia = () => {
        setMainFile(null);
        setMainMediaId(null);
        setMainPreview(null);
    };

    const handlePdfFileChange = (e, index = 1) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                showSnackbar('Please upload a valid PDF file', 'error');
                return;
            }
            if (file.size > 20 * 1024 * 1024) { // 20MB limit
                showSnackbar('PDF file size should be less than 20MB', 'error');
                return;
            }
            if (index === 2) {
                setPdfFile2(file);
                setPdfPreview2(file.name);
            } else {
                setPdfFile(file);
                setPdfPreview(file.name);
            }
        }
    };

    const clearPdfMedia = (index = 1) => {
        if (index === 2) {
            setPdfFile2(null);
            setPdfPreview2(null);
        } else {
            setPdfFile(null);
            setPdfPreview(null);
        }
    };


    // ─── Pre-upload helper ────────────────────────────────────────────────────
    // For PUBLISHER+ roles: uploads raw files to /media/upload/ BEFORE the
    // article save request. This keeps the article payload lightweight, preventing
    // Nginx/S3 timeouts that block publish & schedule.
    // For CONTRIBUTOR/EDITOR: falls back to embedding raw files in the article
    // payload (media/upload requires PUBLISHER+).
    const preUploadFiles = async ({ bannerFile, mainFile, section }) => {
        let resolvedBannerMediaId = bannerMediaId;  // keep existing library ID if set
        let resolvedMainMediaId   = mainMediaId;
        let fallbackBannerFile    = null;  // raw file fallback for lower roles
        let fallbackMainFile      = null;

        const canPreUpload = ['SUPER_ADMIN', 'ADMIN', 'PUBLISHER'].includes(userRole);

        if (bannerFile) {
            if (canPreUpload) {
                showSnackbar('Uploading banner image...', 'info');
                const fd = new FormData();
                fd.append('file', bannerFile);
                fd.append('purpose', 'article');
                fd.append('section', section || '');
                
                const result = await mediaService.upload(fd, (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (percentCompleted % 20 === 0) { // Reduce snackbar noise
                        showSnackbar(`Uploading banner: ${percentCompleted}%`, 'info');
                    }
                });
                
                resolvedBannerMediaId = result.media_id;
                setBannerMediaId(result.media_id);
                setBannerFile(null);
                showSnackbar('Banner uploaded successfully', 'success');
            } else {
                // CONTRIBUTOR/EDITOR: send raw file directly in article payload
                fallbackBannerFile = bannerFile;
            }
        }

        if (mainFile) {
            if (canPreUpload) {
                showSnackbar('Uploading main image...', 'info');
                const fd = new FormData();
                fd.append('file', mainFile);
                fd.append('purpose', 'article');
                fd.append('section', section || '');
                
                const result = await mediaService.upload(fd, (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    if (percentCompleted % 20 === 0) {
                        showSnackbar(`Uploading main image: ${percentCompleted}%`, 'info');
                    }
                });

                resolvedMainMediaId = result.media_id;
                if (canPreUpload) setBannerMediaId(resolvedBannerMediaId); // keep in sync
                setMainMediaId(result.media_id);
                setMainFile(null);
                showSnackbar('Main image uploaded successfully', 'success');
            } else {
                fallbackMainFile = mainFile;
            }
        }

        return { resolvedBannerMediaId, resolvedMainMediaId, fallbackBannerFile, fallbackMainFile };
    };

    const handleDirectPublish = async (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (isSaving || publishArticleMutation.isPending || createArticleMutation.isPending) return;
        if (!validateForm()) return;

        setIsSaving(true);
        let hasError = false;
        try {
            // ── Step 1: Pre-upload raw image files to /media/upload/ first ──────
            // This prevents S3 upload latency from blocking the article save+publish
            // transaction and triggering Nginx timeouts.
            const { resolvedBannerMediaId, resolvedMainMediaId, fallbackBannerFile, fallbackMainFile } = await preUploadFiles({
                bannerFile,
                mainFile,
                section: formData.section
            });

            const formDataToSubmit = new FormData();

            // Required fields
            formDataToSubmit.append('slug', formData.slug);
            formDataToSubmit.append('section', formData.section);

            // Language fields — sent as-is (language switch handler already placed content correctly)
            const finalEngTitle = formData.eng_title || '';
            const finalEngContent = cleanEditorHTML(formData.eng_content || '');
            const finalEngSummary = formData.eng_summary || '';
            const finalTelTitle = formData.tel_title || '';
            const finalTelContent = cleanEditorHTML(formData.tel_content || '');
            const finalTelSummary = formData.tel_summary || '';

            formDataToSubmit.append('tel_title', finalTelTitle);
            formDataToSubmit.append('tel_content', finalTelContent);
            formDataToSubmit.append('tel_summary', finalTelSummary);
            formDataToSubmit.append('eng_title', finalEngTitle);
            formDataToSubmit.append('eng_content', finalEngContent);
            formDataToSubmit.append('eng_summary', finalEngSummary);

            // Taxonomy and Sections
            const cleanCategoryIds = (formData.category_ids || [])
                .map(id => parseInt(id, 10))
                .filter(id => !isNaN(id));

            // Using standard key for array fields in multipart data
            cleanCategoryIds.forEach(id => formDataToSubmit.append('category_ids', id));
            (formData.additional_sections || []).forEach(sec => formDataToSubmit.append('additional_sections', sec));

            // Tags and Keywords
            const tagsArray = String(formData.tags || '').split(',').map(t => t.trim()).filter(t => t);
            const keywordsArray = String(formData.keywords || '').split(',').map(t => t.trim()).filter(t => t);
            formDataToSubmit.append('tags', JSON.stringify(tagsArray));
            formDataToSubmit.append('keywords', JSON.stringify(keywordsArray));

            // Media — PUBLISHER+ uses pre-uploaded media IDs; lower roles embed raw files
            if (pdfFile) formDataToSubmit.append('pdf_file', pdfFile);
            if (pdfFile2) formDataToSubmit.append('pdf_file_2', pdfFile2);
            if (resolvedBannerMediaId) formDataToSubmit.append('banner_media_id', resolvedBannerMediaId);
            if (resolvedMainMediaId) formDataToSubmit.append('main_media_id', resolvedMainMediaId);
            if (fallbackBannerFile) formDataToSubmit.append('banner_file', fallbackBannerFile);
            if (fallbackMainFile) formDataToSubmit.append('main_file', fallbackMainFile);

            // SEO and Metadata
            formDataToSubmit.append('meta_title', formData.meta_title || '');
            formDataToSubmit.append('meta_description', formData.meta_description || '');
            formDataToSubmit.append('og_title', formData.og_title || '');
            formDataToSubmit.append('og_description', formData.og_description || '');
            formDataToSubmit.append('og_image_url', formData.og_image_url || '');
            formDataToSubmit.append('noindex', formData.noindex ? 'true' : 'false');
            formDataToSubmit.append('youtube_url', formData.youtube_url || '');
            if (formData.expires_at) {
                formDataToSubmit.append('expires_at', new Date(formData.expires_at).toISOString());
            }
            formDataToSubmit.append('is_top_story', formData.is_top_story ? 'true' : 'false');

            // Status and Scheduling
            if (scheduleDate) {
                formDataToSubmit.append('status', 'SCHEDULED');
                formDataToSubmit.append('scheduled_at', new Date(scheduleDate).toISOString());
            } else {
                formDataToSubmit.append('status', 'PUBLISHED');
            }

            // Ensure we have section and slug (crucial for backend validator)
            if (!formDataToSubmit.has('section')) formDataToSubmit.append('section', formData.section);
            if (!formDataToSubmit.has('slug')) formDataToSubmit.append('slug', formData.slug);

            if (!isEditMode) {
                const newArticle = await newsService.createArticle(formDataToSubmit);
                if (formData.is_top_story && newArticle && newArticle.id) {
                    await newsService.pinArticle(newArticle.id, { feature_type: 'TOP', section: formData.section || 'General' }).catch(console.error);
                }
                showSnackbar(`Article ${scheduleDate ? 'scheduled' : 'published'} successfully`, 'success');
            } else {
                await newsService.updateArticle(id, formDataToSubmit);

                // Directly manage the explicit state transition for Admins
                await newsService.directPublish(id, scheduleDate ? { scheduled_at: new Date(scheduleDate).toISOString() } : {});

                if (formData.is_top_story) {
                    await newsService.pinArticle(id, { feature_type: 'TOP', section: formData.section || 'General' }).catch(console.error);
                } else {
                    await newsService.unpinArticle(id, { feature_type: 'TOP', section: formData.section || 'General' }).catch(console.error);
                }
                showSnackbar(`Article ${scheduleDate ? 'scheduled' : 'published'} successfully`, 'success');
            }

            navigate('/dashboard?tab=articles');
        } catch (error) {
            hasError = true;
            console.error('Publish error:', error);
            let errorMessage = 'Failed to publish article';
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (typeof data === 'object') {
                    const fieldErrors = Object.entries(data)
                        .filter(([k]) => k !== 'statusCode' && k !== 'status')
                        .map(([field, msgs]) => {
                            const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
                            const errStr = Array.isArray(msgs) ? msgs.join(', ') : msgs;
                            return `${formattedField}: ${errStr}`;
                        });
                    if (fieldErrors.length > 0) errorMessage = fieldErrors.join(' | ');
                }
            }
            showSnackbar(errorMessage, 'error');
        } finally {
            setIsSaving(false);
            if (!hasError) {
                setShowPublishModal(false);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving || createArticleMutation.isPending || updateArticleMutation.isPending) return;
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            // ── Step 1: Pre-upload raw image files to /media/upload/ first ──────
            const { resolvedBannerMediaId, resolvedMainMediaId, fallbackBannerFile, fallbackMainFile } = await preUploadFiles({
                bannerFile,
                mainFile,
                section: formData.section
            });

            const formDataToSubmit = new FormData();

            // Required fields
            formDataToSubmit.append('slug', formData.slug);
            formDataToSubmit.append('section', formData.section);

            // Language fields — sent as-is (language switch handler already placed content correctly)
            const finalEngTitle = formData.eng_title || '';
            const finalEngContent = cleanEditorHTML(formData.eng_content || '');
            const finalEngSummary = formData.eng_summary || '';
            const finalTelTitle = formData.tel_title || '';
            const finalTelContent = cleanEditorHTML(formData.tel_content || '');
            const finalTelSummary = formData.tel_summary || '';

            formDataToSubmit.append('tel_title', finalTelTitle);
            formDataToSubmit.append('tel_content', finalTelContent);
            formDataToSubmit.append('tel_summary', finalTelSummary);
            formDataToSubmit.append('eng_title', finalEngTitle);
            formDataToSubmit.append('eng_content', finalEngContent);
            formDataToSubmit.append('eng_summary', finalEngSummary);

            // Taxonomy and Sections
            const cleanCategoryIds = (formData.category_ids || [])
                .map(id => parseInt(id, 10))
                .filter(id => !isNaN(id));

            // Using standard key for array fields in multipart data
            cleanCategoryIds.forEach(id => formDataToSubmit.append('category_ids', id));
            (formData.additional_sections || []).forEach(sec => formDataToSubmit.append('additional_sections', sec));

            // Tags and Keywords
            const tagsArray = String(formData.tags || '').split(',').map(t => t.trim()).filter(t => t);
            const keywordsArray = String(formData.keywords || '').split(',').map(t => t.trim()).filter(t => t);
            formDataToSubmit.append('tags', JSON.stringify(tagsArray));
            formDataToSubmit.append('keywords', JSON.stringify(keywordsArray));

            // Media — PUBLISHER+ uses pre-uploaded media IDs; lower roles embed raw files
            if (pdfFile) formDataToSubmit.append('pdf_file', pdfFile);
            if (pdfFile2) formDataToSubmit.append('pdf_file_2', pdfFile2);
            if (resolvedBannerMediaId) formDataToSubmit.append('banner_media_id', resolvedBannerMediaId);
            if (resolvedMainMediaId) formDataToSubmit.append('main_media_id', resolvedMainMediaId);
            if (fallbackBannerFile) formDataToSubmit.append('banner_file', fallbackBannerFile);
            if (fallbackMainFile) formDataToSubmit.append('main_file', fallbackMainFile);

            // SEO and Metadata
            formDataToSubmit.append('meta_title', formData.meta_title || '');
            formDataToSubmit.append('meta_description', formData.meta_description || '');
            formDataToSubmit.append('og_title', formData.og_title || '');
            formDataToSubmit.append('og_description', formData.og_description || '');
            formDataToSubmit.append('og_image_url', formData.og_image_url || '');
            formDataToSubmit.append('noindex', formData.noindex ? 'true' : 'false');
            formDataToSubmit.append('youtube_url', formData.youtube_url || '');
            if (formData.expires_at) {
                formDataToSubmit.append('expires_at', new Date(formData.expires_at).toISOString());
            }
            formDataToSubmit.append('is_top_story', formData.is_top_story ? 'true' : 'false');

            // Status - Use DRAFT for handleSave
            formDataToSubmit.append('status', 'DRAFT');

            // Ensure we have section and slug
            if (!formDataToSubmit.has('section')) formDataToSubmit.append('section', formData.section);
            if (!formDataToSubmit.has('slug')) formDataToSubmit.append('slug', formData.slug);

            if (isEditMode) {
                await newsService.updateArticle(id, formDataToSubmit);
                if (formData.is_top_story) {
                    await newsService.pinArticle(id, { feature_type: 'TOP', section: formData.section || 'General' }).catch(console.error);
                } else {
                    await newsService.unpinArticle(id, { feature_type: 'TOP', section: formData.section || 'General' }).catch(console.error);
                }
                showSnackbar('Article updated successfully', 'success');
            } else {
                const newArticle = await newsService.createArticle(formDataToSubmit);
                if (formData.is_top_story && newArticle && newArticle.id) {
                    await newsService.pinArticle(newArticle.id, { feature_type: 'TOP', section: formData.section || 'General' }).catch(console.error);
                }
                showSnackbar('Article created as Draft', 'success');
            }

            navigate('/dashboard?tab=articles');
        } catch (error) {
            console.error('Save error:', error);
            let errorMessage = 'Failed to save article';
            if (error.response?.data) {
                const data = error.response.data;
                if (typeof data === 'string') {
                    errorMessage = data;
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (typeof data === 'object') {
                    const fieldErrors = Object.entries(data)
                        .filter(([k]) => k !== 'statusCode' && k !== 'status')
                        .map(([field, msgs]) => {
                            const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
                            const errStr = Array.isArray(msgs) ? msgs.join(', ') : msgs;
                            return `${formattedField}: ${errStr}`;
                        });
                    if (fieldErrors.length > 0) errorMessage = fieldErrors.join(' | ');
                }
            }
            showSnackbar(errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // CRITICAL: Removed loadingTaxonomy from here to prevent full-page "refresh"
    const isLoading = (loadingArticle && isEditMode);

    if (isLoading) return (
        <div className="cms-loading-overlay">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading article editor...</p>
        </div>
    );

    // Current language helpers
    const lang = formData.language;
    const titleField = lang === 'en' ? 'eng_title' : 'tel_title';
    const contentField = lang === 'en' ? 'eng_content' : 'tel_content';
    const summaryField = lang === 'en' ? 'eng_summary' : 'tel_summary';
    const titlePlaceholder = lang === 'en' ? 'Enter a compelling headline...' : 'హెడ్ లైన్ ఇవ్వండి...';
    const contentPlaceholder = lang === 'en' ? 'Write your article content here...' : 'కంటెంట్ ఇక్కడ రాయండి...';
    const summaryPlaceholder = lang === 'en' ? 'Short summary/excerpt...' : 'చిన్న సారాంశం...';


    const sidebarProps = {
        activeSection: 'articles',
        checkAccess: (module) => checkAccessGlobal(userRole, module),
        MODULES,
        onLogout: logout,
        isCmsOpen,
        setIsCmsOpen
    };

    const navbarProps = {
        title: isEditMode ? 'Edit Article' : 'Create Article',
        onProfileClick: () => navigate('/dashboard?tab=profile')
    };

    return (
        <CMSLayout sidebarProps={sidebarProps} navbarProps={navbarProps}>
            <form className="article-editor-form" onSubmit={handleSubmit}>

                {/* ═══════ HEADER ═══════ */}
                <div className="ae-header">
                    <div className="ae-header-left">
                        <div className="ae-header-icon">
                            <i className="fas fa-newspaper"></i>
                        </div>
                        <div>
                            <h1>{isEditMode ? 'Edit Article' : 'Create New Article'}</h1>
                            <p>Fill in the details below to {isEditMode ? 'update' : 'create'} your article</p>
                        </div>
                    </div>
                    <div className="ae-header-actions">
                        <button type="button" className="ae-btn ae-btn-ghost" onClick={() => navigate('/dashboard?tab=articles')}>
                            <i className="fas fa-times"></i> Discard
                        </button>
                        <button type="submit" className="ae-btn ae-btn-draft" disabled={isSaving}>
                            {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            {isEditMode ? 'Update' : 'Save Draft'}
                        </button>
                        {isAdmin && (
                            <button
                                type="button"
                                className="ae-btn ae-btn-publish"
                                onClick={() => setShowPublishModal(true)}
                                disabled={isSaving}
                            >
                                <i className="fas fa-rocket"></i> Publish
                            </button>
                        )}
                    </div>
                </div>

                {/* ═══════ PUBLISH MODAL ═══════ */}
                {showPublishModal && (
                    <div className="ae-modal-overlay">
                        <div className="ae-modal">
                            <div className="ae-modal-header">
                                <h3><i className="fas fa-rocket"></i> Publish Options</h3>
                                <button type="button" className="ae-modal-close" onClick={() => setShowPublishModal(false)}>
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="ae-modal-body">
                                <label className="ae-label">SCHEDULE PUBLICATION (OPTIONAL)</label>
                                <LuxuryDateTimePicker
                                    value={scheduleDate}
                                    onChange={setScheduleDate}
                                    placeholder="Pick Date & Time"
                                />
                                <p className="ae-helper"><i className="fas fa-info-circle"></i> Leave blank to publish immediately.</p>
                            </div>
                            <div className="ae-modal-footer">
                                <button type="button" className="ae-btn ae-btn-ghost" onClick={() => setShowPublishModal(false)}>Cancel</button>
                                <button type="button" onClick={handleDirectPublish} className="ae-btn ae-btn-publish" disabled={isSaving}>
                                    {isSaving ? <i className="fas fa-spinner fa-spin"></i> : (scheduleDate ? <i className="fas fa-clock"></i> : <i className="fas fa-rocket"></i>)}
                                    {scheduleDate ? 'Schedule' : 'Publish Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ MAIN FORM ═══════ */}
                <div className="ae-form-body">

                    {/* ── STEP 1: Basic Info ── */}
                    <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">1</span>
                            <h2>Basic Information</h2>
                        </div>

                        <div className="ae-field">
                            <label className="ae-label">
                                Heading <span className="ae-required">*</span>
                            </label>
                            <input
                                name={titleField}
                                value={formData[titleField] || ''}
                                onChange={handleInputChange}
                                placeholder={titlePlaceholder}
                                className={`ae-input ${errors[titleField] ? 'ae-error' : ''}`}
                            />
                        </div>

                        <div className="ae-row-2">
                            <div className="ae-field">
                                <label className="ae-label">
                                    URL Slug <span className="ae-required">*</span>
                                </label>
                                <input
                                    name="slug"
                                    value={formData.slug || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g. ap-inter-results-2024"
                                    className={`ae-input ${errors.slug ? 'ae-error' : ''}`}
                                    disabled={isEditMode}
                                />
                            </div>
                            <div className="ae-field">
                                <label className="ae-label">
                                    Language <span className="ae-required">*</span>
                                </label>
                                <CustomSelect
                                    value={formData.language}
                                    onChange={(val) => {
                                        setFormData(prev => {
                                            const updates = { language: val };
                                            if (val === 'te') {
                                                // Move content from English to Telugu if Telugu is empty
                                                updates.tel_title = prev.tel_title || prev.eng_title || '';
                                                updates.tel_content = prev.tel_content || prev.eng_content || '';
                                                updates.tel_summary = prev.tel_summary || prev.eng_summary || '';
                                                // Clear English fields so old translation gets removed on save
                                                updates.eng_title = '';
                                                updates.eng_content = '';
                                                updates.eng_summary = '';
                                            } else if (val === 'en') {
                                                // Move content from Telugu to English if English is empty
                                                updates.eng_title = prev.eng_title || prev.tel_title || '';
                                                updates.eng_content = prev.eng_content || prev.tel_content || '';
                                                updates.eng_summary = prev.eng_summary || prev.tel_summary || '';
                                                // Clear Telugu fields so old translation gets removed on save
                                                updates.tel_title = '';
                                                updates.tel_content = '';
                                                updates.tel_summary = '';
                                            }
                                            return { ...prev, ...updates };
                                        });
                                    }}
                                    options={[
                                        { value: 'te', label: '🇮🇳 Telugu' },
                                        { value: 'en', label: '🇬🇧 English' }
                                    ]}
                                    placeholder="Select Language"
                                />
                            </div>
                        </div>

                        <div className="ae-field ae-full-width">
                            <label className="ae-label">Long Summary / Excerpt <span className="ae-required">*</span></label>
                            <textarea
                                name={summaryField}
                                value={formData[summaryField] || ''}
                                onChange={handleInputChange}
                                placeholder={summaryPlaceholder}
                                rows="3"
                                className={`ae-textarea ${errors[summaryField] ? 'ae-textarea-error' : ''}`}
                            ></textarea>
                        </div>
                    </div>

                    {/* ── STEP 2: Taxonomy ── */}
                    <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">2</span>
                            <h2>Categorization</h2>
                            {loadingTaxonomy && (
                                <div className="ae-local-loader" style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    <span>Syncing categories...</span>
                                </div>
                            )}
                        </div>

                        <div className="ae-taxonomy-grid">
                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-layer-group"></i>
                                    Main Section (Level 1) <span className="ae-required">*</span>
                                </label>
                                <CustomSelect
                                    value={level1}
                                    onChange={(val) => {
                                        if (val !== level1) {
                                            setLevel1(val);
                                            // DO NOT clear selectedCategories anymore to support multi-section
                                            setLevel2(''); setLevel3(''); setLevel4(''); setLevel5('');
                                        }
                                    }}
                                    options={sections.map(s => ({ value: s.slug || s.name, label: s.name }))}
                                    placeholder="Select Section"
                                    isInvalid={!!errors.level1}
                                />
                            </div>

                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-sitemap"></i>
                                    Level 2 – Category <span className="ae-required">*</span>
                                </label>
                                <CustomSelect
                                    value={level2}
                                    onChange={(val) => {
                                        if (val !== level2) {
                                            setLevel2(val);
                                            setLevel3(''); setLevel4(''); setLevel5('');
                                            const cat = (level2List || []).find(o => o.value === val);
                                            if (cat) addCategory(val, cat.label, 2);
                                        }
                                    }}
                                    options={level2List}
                                    placeholder={loadingTaxonomy ? "Loading categories..." : "Select Root Category"}
                                    isInvalid={!!errors.categories}
                                    noOptionsMessage={() => isTaxonomyError ? "Error loading categories" : "No root categories found"}
                                />
                            </div>

                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-puzzle-piece"></i>
                                    Level 3 – Sub-Category
                                </label>
                                <CustomSelect
                                    value={level3}
                                    onChange={(val) => {
                                        if (val !== level3) {
                                            setLevel3(val);
                                            setLevel4(''); setLevel5('');
                                            const cat = (level3List || []).find(o => o.value === val);
                                            if (cat) addCategory(val, cat.label, 3);
                                        }
                                    }}
                                    options={level3List}
                                    placeholder={loadingTaxonomy ? "Loading..." : (level2 ? "Select Sub-Category" : "Select Category first")}
                                    disabled={!level2 || loadingTaxonomy}
                                    noOptionsMessage={() => loadingTaxonomy ? "Loading..." : "No items found"}
                                />
                            </div>

                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-tag"></i>
                                    Level 4 – Segment
                                </label>
                                <CustomSelect
                                    value={level4}
                                    onChange={(val) => {
                                        if (val !== level4) {
                                            setLevel4(val);
                                            setLevel5('');
                                            const cat = (level4List || []).find(o => o.value === val);
                                            if (cat) addCategory(val, cat.label, 4);
                                        }
                                    }}
                                    options={level4List}
                                    placeholder={level3 ? "Select Segment" : "Select Sub Category first"}
                                    disabled={!level3}
                                />
                            </div>

                            <div className="ae-field">
                                <label className="ae-label">
                                    <i className="fas fa-bullseye"></i>
                                    Level 5 – Topic
                                </label>
                                <CustomSelect
                                    value={level5}
                                    onChange={(val) => {
                                        setLevel5(val);
                                        const cat = (level5List || []).find(o => o.value === val);
                                        if (cat) addCategory(val, cat.label, 5);
                                    }}
                                    options={level5List}
                                    placeholder={level4 ? "Select Topic" : "Select Segment first"}
                                    disabled={!level4}
                                />
                            </div>
                        </div>

                        {selectedCategories.length > 0 && (
                            <div className="ae-selected-categories">
                                <div className="ae-selected-label">
                                    <i className="fas fa-check-double"></i>
                                    Applied Categories ({selectedCategories.length}) <span className="ae-required">*</span>
                                </div>
                                <div className="ae-chips-container">
                                    {selectedCategories.map(cat => (
                                        <div key={cat.id} className="ae-category-chip">
                                            <span className="ae-chip-path">
                                                {cat.section?.toUpperCase()} › L{cat.level}:
                                            </span>
                                            <span className="ae-chip-name">{cat.name}</span>
                                            <button
                                                className="ae-chip-remove"
                                                onClick={() => removeCategory(cat.id)}
                                                type="button"
                                                title="Remove Category"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="ae-field" style={{ marginTop: '1.5rem' }}>
                            <label className="ae-label">Tags</label>
                            <input
                                name="tags"
                                value={formData.tags || ''}
                                onChange={handleInputChange}
                                placeholder="news, updates, education (comma separated)"
                                className="ae-input"
                            />
                        </div>
                    </div>

                    {/* ── STEP 3: Media ── */}
                    <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">3</span>
                            <h2>Media Uploads</h2>
                        </div>

                        <div className="ae-media-grid">
                            {/* Main Media Upload */}
                            <div className="ae-media-box">
                                <div className="ae-media-box-header">
                                    <i className="fas fa-image"></i>
                                    <span>Main Article Media</span>
                                    <span className="ae-size-hint">Max 10MB • Standard Ratio</span>
                                </div>

                                {mainPreview ? (
                                    <div className="ae-media-preview">
                                        <img src={mainPreview} alt="Main Preview" />
                                        <button type="button" className="ae-media-remove" onClick={clearMainMedia}>
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ae-upload-zone">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={(e) => handleImageFileChange(e, 'main')}
                                            id="main-image-upload"
                                            hidden
                                        />
                                        <label htmlFor="main-image-upload" className="ae-upload-label">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <span>Upload Main Media</span>
                                        </label>
                                        <div className="ae-upload-divider"><span>or</span></div>
                                        <button
                                            type="button"
                                            className="ae-btn ae-btn-server"
                                            onClick={() => { setActiveMediaTarget('main'); setShowMediaLibrary(true); }}
                                        >
                                            <i className="fas fa-server"></i> Select Main
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Banner Media Upload */}
                            <div className="ae-media-box">
                                <div className="ae-media-box-header">
                                    <i className="fas fa-panorama"></i>
                                    <span>Wide Banner Media</span>
                                    <span className="ae-size-hint">Max 10MB • 16:9 or 21:9</span>
                                </div>

                                {bannerPreview ? (
                                    <div className="ae-media-preview">
                                        <img src={bannerPreview} alt="Banner Preview" />
                                        <button type="button" className="ae-media-remove" onClick={clearBannerMedia}>
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ae-upload-zone">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            onChange={(e) => handleImageFileChange(e, 'banner')}
                                            id="banner-image-upload"
                                            hidden
                                        />
                                        <label htmlFor="banner-image-upload" className="ae-upload-label">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <span>Upload Banner Media</span>
                                        </label>
                                        <div className="ae-upload-divider"><span>or</span></div>
                                        <button
                                            type="button"
                                            className="ae-btn ae-btn-server"
                                            onClick={() => { setActiveMediaTarget('banner'); setShowMediaLibrary(true); }}
                                        >
                                            <i className="fas fa-server"></i> Select Banner
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* PDF Upload 1 */}
                            <div className="ae-media-box">
                                <div className="ae-media-box-header">
                                    <i className="fas fa-file-pdf"></i>
                                    <span>Primary PDF (Optional)</span>
                                    <span className="ae-size-hint">Max 20MB • PDF only</span>
                                </div>

                                {pdfPreview ? (
                                    <div className="ae-media-preview ae-pdf-preview">
                                        <div className="ae-pdf-info">
                                            <i className="fas fa-file-pdf"></i>
                                            <span title={pdfPreview}>{pdfPreview.length > 30 ? pdfPreview.substring(0, 27) + '...' : pdfPreview}</span>
                                        </div>
                                        <button type="button" className="ae-media-remove" onClick={() => clearPdfMedia(1)}>
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ae-upload-zone">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => handlePdfFileChange(e, 1)}
                                            id="pdf-upload-1"
                                            hidden
                                        />
                                        <label htmlFor="pdf-upload-1" className="ae-upload-label">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <span>Upload Primary PDF</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* PDF Upload 2 */}
                            <div className="ae-media-box">
                                <div className="ae-media-box-header">
                                    <i className="fas fa-file-pdf"></i>
                                    <span>Secondary PDF (Optional)</span>
                                    <span className="ae-size-hint">Max 20MB • PDF only</span>
                                </div>

                                {pdfPreview2 ? (
                                    <div className="ae-media-preview ae-pdf-preview">
                                        <div className="ae-pdf-info">
                                            <i className="fas fa-file-pdf"></i>
                                            <span title={pdfPreview2}>{pdfPreview2.length > 30 ? pdfPreview2.substring(0, 27) + '...' : pdfPreview2}</span>
                                        </div>
                                        <button type="button" className="ae-media-remove" onClick={() => clearPdfMedia(2)}>
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ae-upload-zone">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => handlePdfFileChange(e, 2)}
                                            id="pdf-upload-2"
                                            hidden
                                        />
                                        <label htmlFor="pdf-upload-2" className="ae-upload-label">
                                            <i className="fas fa-cloud-upload-alt"></i>
                                            <span>Upload Secondary PDF</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── STEP 4: Content Editor ── */}
                    <div className="ae-card ae-card-editor">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">4</span>
                            <h2>Article Content <span className="ae-lang-indicator">{lang === 'te' ? 'తెలుగు' : 'English'}</span></h2>
                        </div>

                        <p className="ae-editor-hint">
                            <i className="fas fa-info-circle"></i>
                            Full-featured editor: Bold, Italic, Colors, Fonts, Images, Videos, Tables, and more. Works like a word processor.
                        </p>

                        <div className="ae-quill-wrapper">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                                <button type="button" className="ae-btn ae-btn-secondary" onClick={insertTableHTML} style={{ padding: '6px 12px', fontSize: '12px' }}>
                                    <i className="fas fa-table" style={{ marginRight: '5px' }}></i> Insert Table
                                </button>
                            </div>
                            <QuillWrapper
                                ref={quillEditorRef}
                                value={formData[contentField] || ''}
                                onChange={(content) => handleEditorChange(contentField, content)}
                                modules={modules}
                                placeholder={contentPlaceholder}
                                className={errors[contentField] ? 'ae-quill-error' : ''}
                            />
                        </div>
                    </div>

                    {/* ── STEP 5: SEO & Metadata ── */}
                    {/* <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">5</span>
                            <h2>SEO & Social Media</h2>
                        </div>

                        <div className="ae-row-2">
                            <div className="ae-field">
                                <label className="ae-label">Meta Title</label>
                                <input
                                    name="meta_title"
                                    value={formData.meta_title || ''}
                                    onChange={handleInputChange}
                                    placeholder="SEO Title for Google"
                                    className="ae-input"
                                />
                            </div>
                            <div className="ae-field">
                                <label className="ae-label">OG Title (Social)</label>
                                <input
                                    name="og_title"
                                    value={formData.og_title || ''}
                                    onChange={handleInputChange}
                                    placeholder="Title for Facebook/Twitter"
                                    className="ae-input"
                                />
                            </div>
                        </div>

                        <div className="ae-field">
                            <label className="ae-label">Meta Description</label>
                            <textarea
                                name="meta_description"
                                value={formData.meta_description || ''}
                                onChange={handleInputChange}
                                placeholder="Brief description for search engines..."
                                rows="2"
                                className="ae-textarea"
                            ></textarea>
                        </div>

                        <div className="ae-row-2">
                            <div className="ae-field">
                                <label className="ae-label">OG Image URL</label>
                                <input
                                    name="og_image_url"
                                    value={formData.og_image_url || ''}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                    className="ae-input"
                                />
                            </div>
                            
                        </div>

                        <div className="ae-toggle-row">
                            <div className="ae-toggle-item">
                                <span>NoIndex (Social/Search Hide)</span>
                                <label className="ae-switch">
                                    <input type="checkbox" name="noindex" checked={formData.noindex || false} onChange={handleInputChange} />
                                    <span className="ae-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div> */}

                    {/* ── STEP 6: Additional Settings ── */}
                    <div className="ae-card">
                        <div className="ae-card-header">
                            <span className="ae-step-badge">5</span>
                            <h2>Additional Settings</h2>
                        </div>

                        <div className="ae-row-2">
                            <div className="ae-field">
                                <label className="ae-label">Keywords <span className="ae-required">*</span></label>
                                <input
                                    name="keywords"
                                    value={formData.keywords || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Budget, Finance, AP News"
                                    className={`ae-input ${errors.keywords ? 'ae-input-error' : ''}`}
                                />
                            </div>
                            <div className="ae-field">
                                <label className="ae-label"><i className="fas fa-layer-group"></i> Additional Sections</label>
                                <CustomSelect
                                    placeholder="Add secondary section..."
                                    options={(sections || []).filter(s => s.slug !== formData.section).map(s => ({
                                        value: s.slug || s.name,
                                        label: s.name
                                    }))}
                                    onChange={toggleAdditionalSection}
                                />
                                {formData.additional_sections?.length > 0 && (
                                    <div className="ae-chips-container" style={{ marginTop: '0.75rem' }}>
                                        {formData.additional_sections.map(secSlug => {
                                            const secName = (sections || []).find(s => s.slug === secSlug)?.name || secSlug;
                                            return (
                                                <div key={secSlug} className="ae-category-chip">
                                                    {secName}
                                                    <button
                                                        className="ae-chip-remove"
                                                        onClick={() => toggleAdditionalSection(secSlug)}
                                                        type="button"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="ae-row-2">
                            <div className="ae-field">
                                <label className="ae-label"><i className="fas fa-calendar-alt"></i> Article Expiry Date</label>
                                <input
                                    type="date"
                                    name="expires_at"
                                    value={formData.expires_at || ''}
                                    onChange={handleInputChange}
                                    className="ae-input"
                                />
                            </div>
                            <div className="ae-field">
                                <label className="ae-label"><i className="fab fa-youtube"></i> YouTube URL</label>
                                <input
                                    name="youtube_url"
                                    value={formData.youtube_url || ''}
                                    onChange={handleInputChange}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="ae-input"
                                />
                            </div>
                        </div>

                        <div className="ae-toggle-row">
                            <div className="ae-toggle-item">
                                <span>Mark as Top Story</span>
                                <label className="ae-switch">
                                    <input type="checkbox" name="is_top_story" checked={formData.is_top_story || false} onChange={handleInputChange} />
                                    <span className="ae-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* ── BOTTOM ACTIONS (Mobile) ── */}
                    <div className="ae-bottom-actions">
                        <button type="button" className="ae-btn ae-btn-ghost" onClick={() => navigate('/dashboard?tab=articles')}>
                            <i className="fas fa-times"></i> Discard
                        </button>
                        <button type="submit" className="ae-btn ae-btn-draft" disabled={isSaving}>
                            {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-save"></i>}
                            {isEditMode ? 'Update' : 'Save Draft'}
                        </button>
                        {isAdmin && (
                            <button type="button" className="ae-btn ae-btn-publish" onClick={() => setShowPublishModal(true)} disabled={isSaving}>
                                <i className="fas fa-rocket"></i> Publish
                            </button>
                        )}
                    </div>
                </div>
            </form>

            {/* Media Library Modal */}
            <MediaLibraryModal
                isOpen={showMediaLibrary}
                onClose={() => setShowMediaLibrary(false)}
                onSelect={(id, url) => handleMediaLibrarySelect(id, url)}
                targetType={activeMediaTarget}
            />
        </CMSLayout>
    );
};

export default ArticleEditor;
