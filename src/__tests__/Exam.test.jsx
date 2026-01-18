import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import Exam from '../pages/Exam';
import { SnackbarProvider } from '../context/SnackbarContext';
import apiClient from '../services/api.service';
import { MemoryRouter } from 'react-router-dom';

// Mock API
vi.mock('../services/api.service', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importActual) => {
    const actual = await importActual();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../services/api', () => ({
    getUserContext: vi.fn(() => ({ email: 'student@test.com' })),
}));

const mockQuestions = [
    { id: 1, question: 'Q1', option1: 'A', option2: 'B', option3: 'C', option4: 'D', correctOption: 'A' },
    { id: 2, question: 'Q2', option1: 'A', option2: 'B', option3: 'C', option4: 'D', correctOption: 'B' },
];

const renderWithProviders = (ui) => {
    return render(
        <SnackbarProvider>
            <MemoryRouter>
                {ui}
            </MemoryRouter>
        </SnackbarProvider>
    );
};

describe('Exam Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiClient.get.mockImplementation(() => Promise.resolve({
            data: {
                content: mockQuestions,
                totalPages: 1,
                totalElements: 2
            }
        }));
        apiClient.post.mockImplementation(() => Promise.resolve({
            data: { score: 1, correctOptions: [{ questionId: 1, correctOption: 'A' }] }
        }));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders instruction screen initially', async () => {
        renderWithProviders(<Exam />);
        await waitFor(() => {
            expect(screen.getByText('Ready to Begin?')).toBeInTheDocument();
            expect(screen.getByText('Start Exam')).toBeInTheDocument();
        });
    });

    it('starts exam and displays questions', async () => {
        renderWithProviders(<Exam />);

        const startButton = await screen.findByText('Start Exam');
        // Ensure questions are loaded
        await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
        // Wait for promise resolution and state update
        await act(async () => { await Promise.resolve(); });

        fireEvent.click(startButton);

        await waitFor(async () => {
            expect(screen.getByText(/1\. Q1/)).toBeInTheDocument();
            const options = await screen.findAllByText('A', { selector: '.premium-options span' });
            expect(options[0]).toBeInTheDocument();
        });
    });

    it('handles option selection', async () => {
        renderWithProviders(<Exam />);
        await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
        await act(async () => { await Promise.resolve(); });

        fireEvent.click(await screen.findByText('Start Exam'));

        const options = await screen.findAllByText('A', { selector: '.premium-options span' });
        fireEvent.click(options[0]);

        const label = options[0].closest('label');
        expect(label).toHaveClass('selected');
    });

    it('submits exam and shows results', async () => {
        renderWithProviders(<Exam />);
        await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
        await act(async () => { await Promise.resolve(); });

        fireEvent.click(await screen.findByText('Start Exam'));

        const options = await screen.findAllByText('A', { selector: '.premium-options span' });
        fireEvent.click(options[0]);

        const submitButton = await screen.findByText('Finalize & Submit');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(apiClient.post).toHaveBeenCalled();
            expect(screen.queryByText(/Assessment Results/i) || screen.queryByText(/Performance Analysis/i)).toBeTruthy();
        });

        const scoreHeader = screen.getByText(/Final Examination Score/i);
        const scoreContainer = scoreHeader.parentElement;
        expect(scoreContainer.textContent).toMatch(/1\s*\/\s*2/);
    });

    it('timer counts down', async () => {
        renderWithProviders(<Exam />);

        // Wait for questions to load and "Start Exam" button to appear using real timers
        const startBtn = await screen.findByText('Start Exam');

        // NOW enable fake timers for the actual timer test
        vi.useFakeTimers();

        fireEvent.click(startBtn);

        // Click handler triggers state change, wait for it
        // and ensure the interval is set up
        await act(async () => {
            // Give it a tick to start the useEffect for the timer
        });

        // Confirm we are on the exam screen and timer started at 30:00
        expect(screen.getByText(/30:00/)).toBeInTheDocument();

        // Advance timer
        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // Re-check
        expect(screen.getByText(/29:59/)).toBeInTheDocument();
    });
});
