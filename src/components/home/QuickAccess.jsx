import React from 'react';
import { Link } from 'react-router-dom';

const QuickAccess = () => {
    const accessCards = [
        {
            icon: 'fas fa-book',
            title: 'Study Materials & Syllabus',
            description: 'Comprehensive study materials for all subjects',
            link: '#'
        },
        {
            icon: 'fas fa-newspaper',
            title: 'Current Affairs',
            description: 'Stay updated with latest current affairs updates',
            link: '/current-affairs'
        },
        {
            icon: 'fas fa-graduation-cap',
            title: '10th Class Study Material (AP)',
            description: 'Comprehensive study materials for comprehensive & academic exams.',
            link: '#'
        }
    ];

    return (
        <section className="quick-access-refined">
            <div className="container">
                <div className="access-grid-refined">
                    {accessCards.map((card, index) => (
                        <div key={index} className="access-card-refined">
                            <div className="icon-box-refined">
                                <i className={card.icon}></i>
                            </div>
                            <h3>{card.title}</h3>
                            <p>{card.description}</p>
                            <Link to={card.link} className="card-link-refined">
                                {index === 1 ? 'Start Learning' : index === 2 ? 'Access Now' : 'Explore Now'} <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default QuickAccess;
