import React, { useState } from 'react';
import { mockShorts } from '../../utils/mockData';

const Shorts = () => {
    const [shorts] = useState(mockShorts);

    const handleShortClick = (title) => {
        alert(`Playing: ${title}\n\nVideo player will be integrated soon!`);
    };

    return (
        <section className="shorts-section">
            <div className="container">
                <h2 className="section-title">Shorts</h2>
                <div className="shorts-grid">
                    {shorts.map((short) => (
                        <div
                            key={short.id}
                            className="short-item"
                            onClick={() => handleShortClick(short.title)}
                        >
                            <img src={short.thumbnail} alt={short.title} />
                            <div className="short-overlay">
                                <i className="fas fa-play"></i>
                                <span>{short.title}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Shorts;
