import React from 'react';
import NewsletterForm from '../ui/NewsletterForm';
import AppDownload from '../ui/AppDownload';
import QuizWidget from '../ui/QuizWidget';
import { mockLatestUpdates } from '../../utils/mockData';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="sidebar-widget">
                <h3 className="widget-title">Latest from Career Vedha</h3>
                <ul className="latest-updates">
                    {mockLatestUpdates.map((update, index) => (
                        <li key={index}>
                            <a href="#">
                                <i className="fas fa-angle-right"></i> {update}
                            </a>
                        </li>
                    ))}
                </ul>
                <a href="#" className="view-all">
                    View All Updates <i className="fas fa-chevron-right"></i>
                </a>
            </div>

            <NewsletterForm />
            <AppDownload />
            <QuizWidget />
        </aside>
    );
};

export default Sidebar;
