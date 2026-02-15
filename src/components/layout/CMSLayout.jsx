import React from 'react';
import CMSSidebar from './CMSSidebar';
import CMSNavbar from './CMSNavbar';
import '../../styles/Dashboard.css';

const CMSLayout = ({ 
    children,
    sidebarProps,
    navbarProps
}) => {
    return (
        <div className="dashboard-wrapper">
            <CMSSidebar {...sidebarProps} />
            
            <div className="dashboard-main">
                <CMSNavbar {...navbarProps} />
                
                <div className="content-container section-fade-in">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CMSLayout;
