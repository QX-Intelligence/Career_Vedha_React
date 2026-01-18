import React from 'react';
import { Link } from 'react-router-dom';

const QuickAccess = () => {
    const accessCards = [
        {
            icon: 'fas fa-book-open',
            title: 'Bitbank, Study Material & Syllabus',
            description: 'Comprehensive study materials for all subjects',
            link: '#'
        },
        {
            icon: 'fas fa-newspaper',
            title: 'Current Affairs Year Book & Quizzes',
            description: 'Stay updated with latest current affairs',
            link: '/exam'
        },
        {
            icon: 'fas fa-graduation-cap',
            title: '10th Class Study Material (AP | TG)',
            description: 'Complete preparation for board exams',
            link: '#'
        }
    ];

    return (
        <section className="quick-access">
            <div className="container">
                <div className="access-grid">
                    {accessCards.map((card, index) => (
                        <div key={index} className="access-card">
                            <div className="card-icon">
                                <i className={card.icon}></i>
                            </div>
                            <h3>{card.title}</h3>
                            <p>{card.description}</p>
                            <Link to={card.link} className="card-link">
                                {index === 0 ? 'Explore Now' : index === 1 ? 'Start Learning' : 'Access Now'} <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default QuickAccess;
