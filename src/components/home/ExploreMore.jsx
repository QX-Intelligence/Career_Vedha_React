import React from 'react';

const ExploreMore = () => {
    const exploreItems = [
        { icon: 'fas fa-chalkboard-teacher', label: 'Skill Development' },
        { icon: 'fas fa-school', label: 'Board Education' },
        { icon: 'fas fa-file-alt', label: 'Mock Tests' },
        { icon: 'fas fa-briefcase', label: 'Careers' },
        { icon: 'fas fa-certificate', label: 'Certifications' },
        { icon: 'fas fa-globe', label: 'Study Abroad' },
        { icon: 'fas fa-calculator', label: 'Calculators' },
        { icon: 'fas fa-lightbulb', label: 'Tips & Tricks' }
    ];

    return (
        <section className="explore-section">
            <div className="container">
                <h2 className="section-title">Explore More</h2>
                <div className="explore-grid">
                    {exploreItems.map((item, index) => (
                        <a href="#" key={index} className="explore-item">
                            <div className="explore-icon">
                                <i className={item.icon}></i>
                            </div>
                            <span>{item.label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ExploreMore;
