import React from 'react';
import { Link } from 'react-router-dom';

const QuickLinks = () => {
    const links = [
        { title: 'Admit Cards', path: '#' },
        { title: 'Results', path: '#' },
        { title: 'Answer Keys', path: '#' },
        { title: 'Syllabus', path: '#' },
        { title: 'Old Papers', path: '#' },
        { title: 'Scholarships', path: '#' },
    ];

    return (
        <div className="quick-links-bar container">
            <div className="quick-links-wrapper">
                <span className="quick-label">Quick Links:</span>
                <ul>
                    {links.map((link, index) => (
                        <li key={index}>
                            <Link to={link.path}>{link.title}</Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default QuickLinks;
