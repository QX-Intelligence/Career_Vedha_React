import React from 'react';
import { Link } from 'react-router-dom';
import './AcademicsHighlights.css';

const AcademicsHighlights = () => {
    const highlights = [
        {
            title: 'AP Board',
            description: 'Andhra Pradesh Board Study Materials & Syllabus',
            icon: 'fas fa-book-open',
            link: '/academics?board=AP',
            color: '#3498db'
        },
        {
            title: 'TS Board',
            description: 'Telangana State Board Comprehensive Guides',
            icon: 'fas fa-graduation-cap',
            link: '/academics?board=TS',
            color: '#e74c3c'
        },
        {
            title: 'CBSE',
            description: 'Central Board for Secondary Education (Class 1-12)',
            icon: 'fas fa-school',
            link: '/academics?board=CBSE',
            color: '#2ecc71'
        },
        // {
        //     title: 'Higher Education',
        //     description: 'Entrance Exams & Competitive Academic Material',
        //     icon: 'fas fa-university',
        //     link: '/academics?type=higher',
        //     color: '#9b59b6'
        // }
    ];

    return (
        <section className="academics-highlights section-fade-in container">
            <div className="section-header">
                <div className="title-area">
                    <span className="subtitle">LEARNING HUB</span>
                    <h2 className="section-main-title">Academic Excellence</h2>
                </div>
                <Link to="/academics" className="explore-btn">
                    Explore All Boards <i className="fas fa-arrow-right"></i>
                </Link>
            </div>

            <div className="highlights-grid">
                {highlights.map((item, index) => (
                    <Link key={index} to={item.link} className="highlight-card glass-card">
                        <div className="card-icon" style={{ backgroundColor: item.color }}>
                            <i className={item.icon}></i>
                        </div>
                        <div className="card-content">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </div>
                        <div className="card-arrow">
                            <i className="fas fa-chevron-right"></i>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default AcademicsHighlights;
