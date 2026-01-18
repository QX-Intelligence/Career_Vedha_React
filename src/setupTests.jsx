import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Minimal global mocks
afterEach(() => {
    vi.clearAllMocks();
});
