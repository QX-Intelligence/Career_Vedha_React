import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';

// Mock the hook
vi.mock('../hooks/useHomeContent', () => ({
    useHomeContent: () => ({
        data: {
            hero: [{ id: 1, title: 'Hero Story' }],
            latest: { results: [], count: 0 }
        },
        isLoading: false
    })
}));

// Mock all sub-components to isolate Home.jsx
vi.mock('../components/layout/TopBar', () => ({ default: () => <div data-testid="top-bar">TopBar</div> }));
vi.mock('../components/layout/Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../components/layout/PrimaryNav', () => ({ default: () => <div data-testid="primary-nav">PrimaryNav</div> }));
vi.mock('../components/layout/Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));
vi.mock('../components/home/QuickAccess', () => ({ default: () => <div data-testid="quick-access">QuickAccess</div> }));
vi.mock('../components/home/FeaturedStory', () => ({ default: () => <div data-testid="featured-story">FeaturedStory</div> }));
vi.mock('../components/home/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('../components/home/LatestArticles', () => ({ default: () => <div data-testid="latest-articles">LatestArticles</div> }));
vi.mock('../components/home/SectionCategoryBlocks', () => ({ default: () => <div data-testid="section-category">SectionCategory</div> }));
vi.mock('../components/home/HeroIntro', () => ({ default: () => <div data-testid="hero-intro">HeroIntro</div> }));
vi.mock('../components/home/MustRead', () => ({ default: () => <div data-testid="must-read">MustRead</div> }));

describe('Home Page', () => {
    it('renders all main sections correctly', () => {
        render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        );

        expect(screen.getByTestId('top-bar')).toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('primary-nav')).toBeInTheDocument();
        expect(screen.getByTestId('must-read')).toBeInTheDocument();
        expect(screen.getByTestId('hero-intro')).toBeInTheDocument();
        expect(screen.getByTestId('quick-access')).toBeInTheDocument();
        expect(screen.getByTestId('featured-story')).toBeInTheDocument();
        expect(screen.getByTestId('latest-articles')).toBeInTheDocument();
        expect(screen.getAllByTestId('section-category').length).toBeGreaterThan(0);
        expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
});
