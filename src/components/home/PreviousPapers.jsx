import React from 'react';

const PreviousPapers = () => {
    const papers = [
        'APPSC', 'TGPSC', 'Police', 'Banking',
        'Railway', 'SSC', 'UPSC', 'Teaching'
    ];

    return (
        <section className="previous-papers">
            <div className="container">
                <h2 className="section-title">Previous Papers</h2>
                <div className="papers-grid">
                    {papers.map((paper, index) => (
                        <a href="#" key={index} className="paper-card">
                            <i className="fas fa-file-pdf"></i>
                            <span>{paper}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PreviousPapers;
