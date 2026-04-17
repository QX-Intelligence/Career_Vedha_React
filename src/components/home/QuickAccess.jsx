import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { getTranslations } from '../../utils/translations';
import './QuickAccess.css';

const QuickAccess = memo(({ activeLanguage = 'telugu' }) => {
    const accessCards = [
        { icon: 'fas fa-graduation-cap', title: 'Academics', link: '/academics' },
        { icon: 'fas fa-compass', title: 'Career Guidance', link: '/academics?category=career-guidence' },
        { icon: 'fas fa-pen-nib', title: 'Entrance Exams', link: '/academic-exams?category=entrance-exams' },
        { icon: 'fas fa-file-alt', title: 'Competitive Exams', link: '/academic-exams?category=competitive-exams' },
        { icon: 'fas fa-landmark', title: 'APPSC', link: '/academic-exams?category=competitive-exams&sub_category=appsc' },
        { icon: 'fas fa-map-marker-alt', title: 'TGPSC', link: '/academic-exams?category=competitive-exams&sub_category=tgpsc' },
        { icon: 'fas fa-user-shield', title: 'Civils', link: '/academic-exams?category=competitive-exams&sub_category=civils' },
        { icon: 'fas fa-trophy', title: 'Success Stories', link: '/articles?section=success-stories' },
        { icon: 'fas fa-chart-line', title: 'Budgets & Surveys', link: '/current-affairs?category=budgets-surveys' },
        { icon: 'fas fa-university', title: 'Campus Pages', link: '/articles?section=campus-pages' },
        { icon: 'fas fa-newspaper', title: 'News', link: '/news' },
        { icon: 'fas fa-hand-holding-heart', title: 'Schemes', link: '/news?category=schemes-scholarships' },
        { icon: 'fas fa-briefcase', title: 'Jobs', link: '/jobs' },
        { icon: 'fas fa-chart-bar', title: 'Business', link: '/articles?section=Business' },
        { icon: 'fas fa-laptop-code', title: 'Skills', link: '/articles?section=skills' },
        { icon: 'fas fa-book', title: 'Study Material', link: '/curriculum' },
        { icon: 'fas fa-play-circle', title: 'Videos', link: '/videos' },
        { icon: 'fas fa-shopping-cart', title: 'E-Store', link: '/e-store' }
    ];

    return (
        <section className="quick-access-grid-section">
            <div className="container">
                <div className="quick-access-header">
                    <h2>Explore more</h2>
                    <div className="header-accent"></div>
                </div>
                <div className="quick-access-grid">
                    {accessCards.map((card, index) => (
                        <Link key={index} to={card.link} className="quick-access-item">
                            <div className="quick-access-icon">
                                <i className={card.icon}></i>
                            </div>
                            <span className="quick-access-title">{card.title}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
});

export default QuickAccess;
