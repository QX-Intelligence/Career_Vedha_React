import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import Home from '../pages/Home';

// Mock all sub-components to isolate Home.jsx
vi.mock('../components/layout/TopBar', () => ({ default: () => <div data-testid="top-bar">TopBar</div> }));
vi.mock('../components/layout/Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../components/layout/PrimaryNav', () => ({ default: () => <div data-testid="primary-nav">PrimaryNav</div> }));
vi.mock('../components/layout/Footer', () => ({ default: () => <div data-testid="footer">Footer</div> }));
vi.mock('../components/home/BreakingNews', () => ({ default: () => <div data-testid="breaking-news">BreakingNews</div> }));
vi.mock('../components/home/QuickAccess', () => ({ default: () => <div data-testid="quick-access">QuickAccess</div> }));
vi.mock('../components/home/FeaturedStory', () => ({ default: () => <div data-testid="featured-story">FeaturedStory</div> }));
vi.mock('../components/home/SecondaryStories', () => ({ default: () => <div data-testid="secondary-stories">SecondaryStories</div> }));
vi.mock('../components/home/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('../components/home/ExploreMore', () => ({ default: () => <div data-testid="explore-more">ExploreMore</div> }));
vi.mock('../components/home/PreviousPapers', () => ({ default: () => <div data-testid="previous-papers">PreviousPapers</div> }));
vi.mock('../components/home/MultiWidgets', () => ({ default: () => <div data-testid="multi-widgets">MultiWidgets</div> }));
vi.mock('../components/home/Shorts', () => ({ default: () => <div data-testid="shorts">Shorts</div> }));

describe('Home Page', () => {
    it('renders all main sections correctly', () => {
        render(<Home />);

        expect(screen.getByTestId('top-bar')).toBeInTheDocument();
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('primary-nav')).toBeInTheDocument();
        expect(screen.getByTestId('breaking-news')).toBeInTheDocument();
        expect(screen.getByTestId('quick-access')).toBeInTheDocument();
        expect(screen.getByTestId('featured-story')).toBeInTheDocument();
        expect(screen.getByTestId('secondary-stories')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('explore-more')).toBeInTheDocument();
        expect(screen.getByTestId('previous-papers')).toBeInTheDocument();
        expect(screen.getByTestId('multi-widgets')).toBeInTheDocument();
        expect(screen.getByTestId('shorts')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
});
