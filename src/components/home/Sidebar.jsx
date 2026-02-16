import React, { memo } from 'react';
import NewsletterForm from '../ui/NewsletterForm';
import AppDownload from '../ui/AppDownload';
import QuizWidget from '../ui/QuizWidget';
import TrendingWidget from '../ui/TrendingWidget';
import { mockLatestUpdates } from '../../utils/mockData';

const Sidebar = memo(() => {
    return (
        <aside className="sidebar">
            <TrendingWidget />

            {/* <NewsletterForm /> */}
            {/* <AppDownload /> */}
            {/* <QuizWidget /> */}
        </aside>
    );
});

export default Sidebar;
