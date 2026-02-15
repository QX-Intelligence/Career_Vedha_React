import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { getTranslations } from '../../utils/translations';

const QuickAccess = memo(({ activeLanguage = 'telugu' }) => {
    const t = getTranslations(activeLanguage);
    
    const accessCards = [
        {
            icon: 'fas fa-book',
            title: t.studyMaterials,
            description: t.studyMaterialsDesc,
            link: '/academic-exams',
            buttonText: t.exploreNow
        },
        {
            icon: 'fas fa-newspaper',
            title: t.currentAffairs,
            description: t.currentAffairsDesc,
            link: '/current-affairs',
            buttonText: t.startLearning
        },
        {
            icon: 'fas fa-user-tie',
            title: t.latestJobs,
            description: t.latestJobsDesc,
            link: '/jobs',
            buttonText: t.exploreNow
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
                                {card.buttonText} <i className="fas fa-arrow-right"></i>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
});

export default QuickAccess;
