import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { BookOpen, Heart, Zap, Shield, Globe, Award, HelpCircle } from 'lucide-react';

const Module_Info = () => {
  const values = [
    { title: 'Curated Excellence', desc: 'Every title in our collection is handpicked by literary experts for its profound impact and quality.', icon: Award },
    { title: 'Reader Sanctuary', desc: 'We provide a distraction-free, premium environment designed specifically for the modern bibliophile.', icon: Heart },
    { title: 'Global Reach', desc: 'Bridging cultures through the power of storytelling, accessible from anywhere in the world on any device.', icon: Globe },
    { title: 'Secure Access', desc: 'Your private collection is protected by industry-leading security, integrated directly with Career Vedha.', icon: Shield }
  ];

  const faqs = [
    { q: 'How do I access my digital books?', a: 'Once purchased, your books are added to your "Secure Library" which can be accessed via your account dashboard.' },
    { q: 'Can I return a physical book?', a: 'Yes, we offer a 7-day hassle-free return policy for physical editions in their original condition.' },
    { q: 'Is my data secure?', a: 'Absolutely. We use bank-grade encryption to protect your personal and payment information.' }
  ];

  return (
    <div style={{ paddingTop: '8rem', paddingBottom: '8rem', background: '#111', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Hero Section */}
        <Motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '6rem' }}>
          <h4 style={{ color: '#D4A843', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>Our Story</h4>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(3rem, 5vw, 4.5rem)', color: '#fff', marginBottom: '2rem', lineHeight: 1.1 }}>Beyond Every Page</h1>
          <p style={{ color: '#888', lineHeight: 1.8, fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto' }}>
            The Career Vedha E-Store was born from a simple vision: to create a sanctuary for knowledge seekers. 
            We believe that books are more than just paper—they are keys to new worlds, new skills, and new versions of ourselves.
          </p>
        </Motion.div>

        {/* Values Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '8rem' }}>
          {values.map((v, i) => (
            <Motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: i * 0.1 }}
              style={{ background: '#1a1a1a', padding: '3rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}
            >
              <div style={{ color: '#D4A843', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}><v.icon size={40} /></div>
              <h3 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '1rem' }}>{v.title}</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>{v.desc}</p>
            </Motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <section style={{ borderTop: '1px solid #222', paddingTop: '6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <HelpCircle size={32} color="#D4A843" />
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#fff' }}>Common Questions</h2>
          </div>
          <div style={{ display: 'grid', gap: '2rem' }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ padding: '2rem', background: '#161616', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.02)' }}>
                <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.75rem' }}>{f.q}</h4>
                <p style={{ color: '#888', lineHeight: 1.6 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <div style={{ marginTop: '8rem', textAlign: 'center', background: 'linear-gradient(135deg, #1a1a1a 0%, #111 100%)', padding: '5rem 3rem', borderRadius: '2rem', border: '1px solid rgba(212, 168, 67, 0.1)' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: '#fff', marginBottom: '1.5rem' }}>Ready to start your journey?</h2>
          <Link to="/e-store/shop" style={{ padding: '1.25rem 3rem', background: '#D4A843', color: '#111', fontWeight: 800, borderRadius: '100px', textDecoration: 'none', display: 'inline-block', fontSize: '1.1rem' }}>
            Browse the Collection
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Module_Info;
