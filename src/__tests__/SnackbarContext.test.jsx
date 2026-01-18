import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { SnackbarProvider, useSnackbar } from '../context/SnackbarContext';

const TestComponent = ({ message, type }) => {
    const { showSnackbar } = useSnackbar();
    return (
        <button onClick={() => showSnackbar(message, type)}>
            Show Snackbar
        </button>
    );
};

describe('SnackbarContext', () => {
    it('throws error when used outside Provider', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<TestComponent />)).toThrow('useSnackbar must be used within a SnackbarProvider');
        consoleSpy.mockRestore();
    });

    it('shows snackbar with correct message and type', async () => {
        render(
            <SnackbarProvider>
                <TestComponent message="Test Message" type="success" />
            </SnackbarProvider>
        );

        const button = screen.getByText('Show Snackbar');
        await act(async () => {
            button.click();
        });

        expect(screen.getByText('Test Message')).toBeInTheDocument();
        expect(document.querySelector('.snackbar-container')).toHaveClass('success');
    });

    it('closes snackbar when close button is clicked', async () => {
        render(
            <SnackbarProvider>
                <TestComponent message="Close Me" type="info" />
            </SnackbarProvider>
        );

        const button = screen.getByText('Show Snackbar');
        await act(async () => {
            button.click();
        });

        const closeButton = screen.getByRole('button', { name: '' }); // The button with the icon
        await act(async () => {
            closeButton.click();
        });

        expect(screen.queryByText('Close Me')).not.toBeInTheDocument();
    });

    it('auto-closes after timeout', async () => {
        vi.useFakeTimers();
        render(
            <SnackbarProvider>
                <TestComponent message="Auto Close" type="warning" />
            </SnackbarProvider>
        );

        const button = screen.getByText('Show Snackbar');
        await act(async () => {
            button.click();
        });

        expect(screen.getByText('Auto Close')).toBeInTheDocument();

        await act(async () => {
            vi.advanceTimersByTime(4000);
        });

        expect(screen.queryByText('Auto Close')).not.toBeInTheDocument();
        vi.useRealTimers();
    });
});
