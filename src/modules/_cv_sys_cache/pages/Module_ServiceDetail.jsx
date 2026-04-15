import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { ourServicesService } from '../../../services/ourServicesService';

const Module_ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const data = await ourServicesService.getById(id);
                setService(data);
            } catch (err) {
                console.error("Failed to load service", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchService();
        }
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: '8rem 2rem', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: '#62269e', marginBottom: '1rem' }} />
                <p style={{ color: '#64748B' }}>Loading service details...</p>
            </div>
        );
    }

    if (!service) {
        return (
            <div style={{ padding: '8rem 2rem', textAlign: 'center', minHeight: '80vh' }}>
                <h1 style={{ color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>Service not found</h1>
                <button 
                    onClick={() => navigate('/e-store/about')}
                    style={{ background: '#62269e', color: 'white', padding: '1rem 2rem', borderRadius: '100px', border: 'none', cursor: 'pointer', marginTop: '2rem', fontWeight: 'bold' }}
                >
                    Back to Services
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '6rem' }}>
            {/* Minimalist Header */}
            <div style={{ background: '#FFFFFF', borderBottom: '1px solid #e2e8f0', paddingTop: '6rem', paddingBottom: '3rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
                    <button 
                        onClick={() => navigate('/e-store/about')}
                        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: '2rem', fontSize: '0.9rem' }}
                    >
                        <ArrowLeft size={16} /> Back to Services
                    </button>
                    
                    <Motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', color: '#0F172A', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}
                    >
                        {service.title}
                    </Motion.h1>
                    
                    <Motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ color: '#475569', fontSize: '1.25rem', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '700px' }}
                    >
                        {service.description}
                    </Motion.p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} /> {new Date(service.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rich Text Content Body */}
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
                <Motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="ql-editor" 
                    style={{ 
                        background: '#FFFFFF', 
                        padding: '3rem', 
                        borderRadius: '1.5rem', 
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        border: '1px solid #e2e8f0',
                        fontSize: '1.1rem',
                        lineHeight: 1.8,
                        color: '#334155'
                    }}
                    dangerouslySetInnerHTML={{ __html: service.content }} 
                />
            </div>
            
            {/* Global E-store specific styles for Quill injection to ensure it looks beautiful everywhere */}
            <style jsx="true">{`
                .ql-editor h1, .ql-editor h2, .ql-editor h3 {
                    font-family: 'Outfit', sans-serif !important;
                    color: #0F172A !important;
                    margin-top: 2rem !important;
                    margin-bottom: 1rem !important;
                    font-weight: 700 !important;
                }
                .ql-editor img {
                    max-width: 100% !important;
                    height: auto !important;
                    border-radius: 1rem !important;
                    margin: 2rem 0 !important;
                }
                .ql-editor a {
                    color: #62269e !important;
                    text-decoration: underline !important;
                }
                .ql-editor p {
                    margin-bottom: 1.5rem !important;
                }
                .ql-editor ul, .ql-editor ol {
                    margin-bottom: 1.5rem !important;
                    padding-left: 1.5rem !important;
                }
            `}</style>
        </div>
    );
};

export default Module_ServiceDetail;
