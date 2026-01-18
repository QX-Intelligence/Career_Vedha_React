import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
    test('should complete the 2-step registration process', async ({ page }) => {
        // 1. Navigate to Registration page
        await page.goto('/admin-register');

        // Check initial state
        await expect(page.locator('h2')).toContainText('Create Admin Account');

        // 2. Fill in details
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'User');
        await page.fill('input[name="email"]', 'testuser@example.com');

        // Select role (using the custom select logic)
        // We can click the custom select and choose an option
        // For simplicity in the first run, let's assume the default 
        // or select by clicking the visible text if it's there.
        // If CustomSelect renders a button/div, we click it.

        // 3. Submit to send OTP
        // Mock the API response if we don't want to hit real backend
        // but for true E2E we can hit it if configured. 
        // Let's mock for now to ensure UI logic is tested.
        await page.route('**/registersendotp**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'OTP Sent' }) });
        });

        await page.click('button:has-text("Send Verification Code")');

        // 4. Verify step 2 transition
        await expect(page.locator('h2')).toContainText('Verify Email');
        // Use a more specific locator for the target email text
        await expect(page.locator('.form-header p')).toContainText('testuser@example.com');

        // 5. Fill OTP
        const otpFields = page.locator('.otp-field');
        for (let i = 0; i < 6; i++) {
            await otpFields.nth(i).fill('1');
        }

        // 6. Submit registration
        await page.route('**/registeruser**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Success' }) });
        });

        await page.click('button:has-text("Register")');

        // 7. Verify success snackbar and navigation
        // Note: Snackbar might disappear, but we can check for it
        await expect(page.locator('text=Registration submitted for approval!')).toBeVisible();

        // 8. Verify redirect to login
        await page.waitForURL('**/admin-login', { timeout: 10000 });
        await expect(page.locator('h2')).toContainText('Admin Portal');
    });
});
