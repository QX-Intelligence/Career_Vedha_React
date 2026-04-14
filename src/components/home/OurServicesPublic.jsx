import React, { useEffect, useState } from 'react';
import { ourServicesService } from '../../services/ourServicesService';
import Skeleton from '../ui/Skeleton';

const OurServicesPublic = ({ activeLanguage }) => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const data = await ourServicesService.getAll(null, 6);
                setServices(data || []);
            } catch (err) {
                console.error("Failed to load services", err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const DEMO_SERVICES = [
        {
            id: 'demo-1',
            title: 'Career Counseling',
            description: 'Expert guidance to help you choose the right career path based on your skills and interests.',
            content: '<p>Our career counseling experts use psychometric testing and personalized interviews to chart your professional future.</p>'
        },
        {
            id: 'demo-2',
            title: 'Job Assistance',
            description: 'Get hired faster with our extensive corporate network and resume building services.',
            content: '<p>We connect you with top-tier recruiters and provide mock interview sessions to boost your confidence.</p>'
        },
        {
            id: 'demo-3',
            title: 'Academic Excellence',
            description: 'Advanced study materials and coaching for competitive exams and academic success.',
            content: '<p>Master your subjects with our curated research materials and structured learning modules.</p>'
        }
    ];

    if (loading) {
        return (
            <div className="container py-12">
                <Skeleton variant="title" width="40%" style={{ marginBottom: '2rem', margin: '0 auto' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <Skeleton variant="card" count={3} />
                </div>
            </div>
        );
    }

    const displayServices = services.length > 0 ? services : DEMO_SERVICES;

    return (
        <section className="our-services-section py-16" style={{ background: '#f8fafc' }}>
            <div className="container">
                <div className="section-header-branded mb-12" style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>Our Premium Services</h2>
                    <div style={{ width: '80px', height: '6px', background: 'linear-gradient(90deg, var(--cv-primary), var(--cv-primary-dark))', borderRadius: '4px', margin: '0 auto 16px' }}></div>
                    <p style={{ color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>Discover our specialized services designed to help you excel in your career and academic journey.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    {displayServices.map((service) => (
                        <div key={service.id} className="service-card-luxury" style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '2.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #f1f5f9',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'default',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div className="service-glow" style={{
                                position: 'absolute',
                                top: '-50%',
                                left: '-50%',
                                width: '200%',
                                height: '200%',
                                background: 'radial-gradient(circle, rgba(123, 63, 228, 0.05) 0%, transparent 70%)',
                                pointerEvents: 'none'
                            }}></div>
                            
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', position: 'relative' }}>{service.title}</h3>
                            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '1.5rem', flex: 1 }}>{service.description}</p>
                            
                            <div 
                                className="service-rich-content prose prose-sm max-w-none"
                                style={{ 
                                    fontSize: '0.95rem', 
                                    color: '#334155',
                                    borderTop: '1px solid #f1f5f9',
                                    paddingTop: '1.5rem'
                                }}
                                dangerouslySetInnerHTML={{ __html: service.content }} 
                            />
                            
                            <style>{`
                                .service-card-luxury:hover {
                                    transform: translateY(-8px);
                                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                                    border-color: var(--cv-primary);
                                }
                                .service-rich-content img {
                                    max-width: 100%;
                                    height: auto;
                                    border-radius: 12px;
                                    margin: 1rem 0;
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                                }
                                .service-rich-content p {
                                    margin-bottom: 0.75rem;
                                }
                            `}</style>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default OurServicesPublic;
