import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AdminLogin from '../modules/auth/pages/AdminLogin';
import { SnackbarProvider } from '../context/SnackbarContext';
import api, { getUserContext } from '../services/api';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// We'll use MemoryRouter and a helper component to track navigation
let testLocation;
const LocationDisplay = () => {
    const { pathname } = useLocation();
    testLocation = pathname;
    return <div data-testid="location-display">{pathname}</div>;
};

// Mock the services
vi.mock('../services/api', () => ({
    default: {
        post: vi.fn(),
    },
    setUserContext: vi.fn(),
    getUserContext: vi.fn(),
}));

// Mock useNavigate from react-router-dom specifically if needed, 
// but using MemoryRouter is generally more robust for testing navigation.
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importActual) => {
    const actual = await importActual();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderWithProviders = (ui) => {
    return render(
        <SnackbarProvider>
            <MemoryRouter>
                {ui}
            </MemoryRouter>
        </SnackbarProvider>
    );
};

describe('AdminLogin Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getUserContext.mockReturnValue({ isAuthenticated: false });
    });

    it('renders email input initially', () => {
        renderWithProviders(<AdminLogin />);
        expect(screen.getByPlaceholderText('admin@careervedha.com')).toBeInTheDocument();
        expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
    });

    it('shows error if email is submitted empty', async () => {
        renderWithProviders(<AdminLogin />);
        const button = screen.getByText('Send Verification Code');

        // Use fireEvent but maybe bypass native validation if any
        fireEvent.click(button);

        // The error might be a bit slow to show up or needs act
        await waitFor(() => {
            expect(screen.queryByText(/Please enter your email address/i) ||
                screen.queryByText(/Enter your authorized email/i)).toBeTruthy();
        }, { timeout: 2000 });
    });

    it('proceeds to OTP step on successful email submission', async () => {
        api.post.mockResolvedValueOnce({});
        renderWithProviders(<AdminLogin />);

        const input = screen.getByPlaceholderText('admin@careervedha.com');
        fireEvent.change(input, { target: { value: 'test@admin.com' } });

        const button = screen.getByText('Send Verification Code');
        fireEvent.click(button);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/login/send-otp', null, expect.any(Object));
            expect(screen.getByText(/Enter the OTP sent to test@admin.com/)).toBeInTheDocument();
        });
    });

    it('shows error on failed OTP verification', async () => {
        api.post.mockResolvedValueOnce({}); // Send OTP success
        renderWithProviders(<AdminLogin />);

        // Step 1
        fireEvent.change(screen.getByPlaceholderText('admin@careervedha.com'), { target: { value: 'test@admin.com' } });
        fireEvent.click(screen.getByText('Send Verification Code'));

        await waitFor(() => expect(screen.getByText(/Enter the OTP sent to test@admin.com/)).toBeInTheDocument());

        // Step 2
        api.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid OTP' } } });

        const otpInputs = screen.getAllByRole('textbox');
        otpInputs.forEach((input) => fireEvent.change(input, { target: { value: '1' } }));

        fireEvent.click(screen.getByText('Verify & Login'));

        await waitFor(() => {
            expect(screen.getByText('Invalid OTP')).toBeInTheDocument();
        });
    });

    it('redirects to dashboard on successful login', async () => {
        api.post.mockResolvedValueOnce({}); // Send OTP success
        renderWithProviders(<AdminLogin />);

        // Step 1
        fireEvent.change(screen.getByPlaceholderText('admin@careervedha.com'), { target: { value: 'test@admin.com' } });
        fireEvent.click(screen.getByText('Send Verification Code'));

        await waitFor(() => expect(screen.getByText(/Enter the OTP sent to test@admin.com/)).toBeInTheDocument());

        // Step 2
        api.post.mockResolvedValueOnce({
            data: { accessToken: 'token', role: 'ADMIN', email: 'test@admin.com' }
        });

        const otpInputs = screen.getAllByRole('textbox');
        otpInputs.forEach((input) => fireEvent.change(input, { target: { value: '1' } }));

        fireEvent.click(screen.getByText('Verify & Login'));

        await waitFor(() => {
            expect(screen.getByText('Login successful!')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        }, { timeout: 2000 });
    });

    it('redirects to dashboard if already authenticated', () => {
        getUserContext.mockReturnValue({ isAuthenticated: true, role: 'ADMIN' });
        renderWithProviders(<AdminLogin />);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
});
