import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import AdminRegister from '../pages/AdminRegister';
import { SnackbarProvider } from '../context/SnackbarContext';
import api from '../services/api';
import { MemoryRouter } from 'react-router-dom';

// Mock the services
vi.mock('../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    }
}));

// Mock CustomSelect
vi.mock('../components/ui/CustomSelect', () => ({
    default: ({ label, value, onChange, options, placeholder, icon, disabled }) => (
        <div data-testid="custom-select">
            <label>{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    )
}));

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

describe('AdminRegister Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.get.mockResolvedValue({ data: ['STUDENT', 'ADMIN'] });
    });

    it('renders initial registration form', async () => {
        renderWithProviders(<AdminRegister />);

        expect(screen.getByText('Create Admin Account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@careervedha.com')).toBeInTheDocument();
        expect(screen.getByText('Send Verification Code')).toBeInTheDocument();
    });

    it('validates email before sending OTP', async () => {
        renderWithProviders(<AdminRegister />);

        // Fill other fields but leave email empty
        fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });

        const sendOtpBtn = screen.getByText('Send Verification Code');
        fireEvent.click(sendOtpBtn);

        await waitFor(() => {
            expect(screen.getByText(/Please enter your email address/i)).toBeInTheDocument();
        });
    });

    it('proceeds to OTP step on successful OTP request', async () => {
        api.post.mockResolvedValueOnce({});
        renderWithProviders(<AdminRegister />);

        // Fill form
        fireEvent.change(screen.getByPlaceholderText('John'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText('you@careervedha.com'), { target: { value: 'john@test.com' } });

        const sendOtpBtn = screen.getByText('Send Verification Code');
        fireEvent.click(sendOtpBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
            expect(screen.getByText(/Enter the OTP sent to john@test.com/i)).toBeInTheDocument();
        });
    });

    it('handles OTP input correctly', async () => {
        api.post.mockResolvedValueOnce({});
        renderWithProviders(<AdminRegister />);

        // Step 1: Send OTP
        fireEvent.change(screen.getByPlaceholderText('you@careervedha.com'), { target: { value: 'john@test.com' } });
        fireEvent.click(screen.getByText('Send Verification Code'));

        // Wait for step 2 heading
        expect(await screen.findByText(/Verify Email/i)).toBeInTheDocument();

        // Step 2: Fill OTP
        // Select by class is fine if needed, but let's try to find them reliably
        const otpFields = document.querySelectorAll('.otp-field');
        expect(otpFields.length).toBe(6);

        fireEvent.change(otpFields[0], { target: { value: '1' } });
        expect(otpFields[0].value).toBe('1');
    });

    it('shows error on invalid OTP registration', async () => {
        api.post.mockResolvedValueOnce({}); // For OTP send
        renderWithProviders(<AdminRegister />);

        // Step 1
        fireEvent.change(screen.getByPlaceholderText('you@careervedha.com'), { target: { value: 'john@test.com' } });
        fireEvent.click(screen.getByText('Send Verification Code'));

        expect(await screen.findByText(/Verify Email/i)).toBeInTheDocument();

        // Step 2: Attempt registration with incomplete OTP
        const registerBtn = screen.getByText('Register');
        fireEvent.click(registerBtn);

        await waitFor(() => {
            expect(screen.getByText(/Please enter a valid 6-digit OTP/i)).toBeInTheDocument();
        });
    });

    it('redirects after successful registration', async () => {
        api.post.mockResolvedValueOnce({}); // OTP Send
        api.post.mockResolvedValueOnce({}); // Registration

        renderWithProviders(<AdminRegister />);

        // Step 1
        fireEvent.change(screen.getByPlaceholderText('you@careervedha.com'), { target: { value: 'john@test.com' } });
        fireEvent.click(screen.getByText('Send Verification Code'));

        expect(await screen.findByText(/Verify Email/i)).toBeInTheDocument();

        // Step 2: Fill full OTP
        const otpFields = document.querySelectorAll('.otp-field');
        otpFields.forEach(field => fireEvent.change(field, { target: { value: '1' } }));

        fireEvent.click(screen.getByText('Register'));

        await waitFor(() => {
            expect(screen.getByText(/Registration submitted for approval!/i)).toBeInTheDocument();
        });

        // The navigation happens after a 2000ms timeout in the component
        // We can wait for the mockNavigate to be called
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/admin-login');
        }, { timeout: 3000 });
    });
});
