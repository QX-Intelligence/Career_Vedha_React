import React, { memo } from 'react';
import NewsletterForm from '../ui/NewsletterForm';
import AppDownload from '../ui/AppDownload';
import QuizWidget from '../ui/QuizWidget';
import TrendingWidget from '../ui/TrendingWidget';
import RelatedWidget from '../ui/RelatedWidget';
import { mockLatestUpdates } from '../../utils/mockData';

const Sidebar = memo(({ tags, currentId, section, slug }) => {
    return (
        <aside className="sidebar">
            {tags && (
                <RelatedWidget 
                    tags={tags} 
                    currentId={currentId} 
                    section={section} 
                    slug={slug} 
                />
            )}
            
            <TrendingWidget />

            {/* <NewsletterForm /> */}
            {/* <AppDownload /> */}
            {/* <QuizWidget /> */}
        </aside>
    );
});

export default Sidebar;
