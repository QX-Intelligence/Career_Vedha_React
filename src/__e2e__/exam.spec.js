import { test, expect } from '@playwright/test';

test.describe('Exam Session', () => {
    test('should complete a full exam session', async ({ page }) => {
        // 1. Navigate to Exam page
        await page.goto('/exam');

        // 2. Verify Instruction Screen
        await expect(page.locator('h1')).toContainText('General Instructions');
        await expect(page.locator('button:has-text("Start Exam")')).toBeVisible();

        // 3. Start Exam
        await page.click('button:has-text("Start Exam")');

        // 4. Verify Active Exam UI
        await expect(page.locator('.timer-badge')).toBeVisible();
        await expect(page.locator('text=/1\./i')).toBeVisible();

        // 5. Answer questions
        // Select an option for the first question
        await page.locator('.option-item').first().click();

        // Check if "Next" button exists (pagination)
        const nextBtn = page.getByRole('button', { name: /Next/i });
        if (await nextBtn.isVisible()) {
            await nextBtn.click();
        }

        // 6. Submit Exam
        await page.getByRole('button', { name: /Finalize & Submit/i }).click();

        // 7. Handle confirmation dialog
        const confirmBtn = page.getByRole('button', { name: /Yes, Submit/i });
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }

        // 8. Verify Results Screen
        await expect(page.locator('h2')).toContainText(/Results|Analysis/i);
        await expect(page.locator('.score-circle')).toBeVisible();

        // 9. Exit and Return to Home
        await page.getByRole('button', { name: /Exit to Home/i }).click();
        await expect(page).toHaveURL('http://localhost:3000/');
    });
});
