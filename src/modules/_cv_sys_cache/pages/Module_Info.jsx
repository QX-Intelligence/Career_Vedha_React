import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { HelpCircle, Loader2, Sparkles, ArrowRight, Zap, Target, Shield, BookOpen } from 'lucide-react';
import { ourServicesService } from '../../../services/ourServicesService';

const Module_Info = () => {
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

  const faqs = [
    { q: 'How do I access my digital books?', a: 'Once purchased, your books are added to your "Secure Library" which can be accessed via your account dashboard.' },
    { q: 'Can I return a physical book?', a: 'Yes, we offer a 7-day hassle-free return policy for physical editions in their original condition.' },
    { q: 'Is my data secure?', a: 'Absolutely. We use bank-grade encryption to protect your personal and payment information.' }
  ];

  const iconMap = [Zap, Shield, Target, Sparkles, BookOpen];

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: '8rem', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Hero Section */}
        <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <h4 style={{ color: '#62269e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>Our Ecosystem</h4>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(3rem, 5vw, 4.5rem)', color: '#0F172A', marginBottom: '2rem', lineHeight: 1.1, fontWeight: 800 }}>Beyond Every Page</h1>
          <p style={{ color: '#64748B', lineHeight: 1.8, fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
            At Career Vedha, we provide more than just literature. Our ecosystem is built to empower knowledge seekers through specialized professional services and curated resources.
          </p>
        </Motion.div>

        {/* Services Section */}
        <div style={{ marginBottom: '8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', color: '#0F172A', fontWeight: 800 }}>Premium Services</h2>
            {!loading && <span style={{ padding: '0.5rem 1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '100px', color: '#62269e', fontSize: '0.8rem', fontWeight: 700 }}>{services.length} AVAILABLE</span>}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <Loader2 size={48} className="animate-spin" style={{ color: '#62269e', margin: '0 auto' }} />
              <p style={{ marginTop: '1rem', color: '#64748B' }}>Loading our premium offerings...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 350px))', gap: '2rem', justifyContent: 'center' }}>
              {services.map((s, i) => {
                const Icon = iconMap[i % iconMap.length];
                return (
                  <Motion.div 
                    key={s.id || i} 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    style={{ 
                      background: '#FFFFFF', 
                      padding: '2rem', 
                      borderRadius: '1.5rem', 
                      border: '1px solid #e2e8f0', 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '1.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease'
                    }}
                    whileHover={{ y: -5, borderColor: '#62269e', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                  >
                    <div style={{ width: '48px', height: '48px', background: 'rgba(98,38,158,0.08)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#62269e' }}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 style={{ color: '#0F172A', fontSize: '1.25rem', marginBottom: '0.75rem', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>{s.title}</h3>
                      <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '0.9rem' }}>{s.description}</p>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                      <Link to={`/e-store/service/${s.id}`} style={{ textDecoration: 'none', color: '#62269e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        Learn More <ArrowRight size={16} />
                      </Link>
                    </div>
                  </Motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <HelpCircle size={32} color="#62269e" />
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.5rem', color: '#0F172A', fontWeight: 800 }}>Common Questions</h2>
          </div>
          <div style={{ display: 'grid', gap: '2rem' }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ padding: '2rem', background: '#ffffff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <h4 style={{ color: '#0F172A', fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: 700 }}>{f.q}</h4>
                <p style={{ color: '#64748B', lineHeight: 1.6 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Module_Info;
