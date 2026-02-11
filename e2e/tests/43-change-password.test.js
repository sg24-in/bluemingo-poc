/**
 * Change Password Page Tests
 * Tests for the change password form, validation, and navigation
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runChangePasswordTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('CHANGE PASSWORD PAGE TESTS');
    console.log('─'.repeat(50));

    await runTest('Change Password - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify page title
        const title = page.locator('h1, h2, .page-title');
        if (await title.isVisible({ timeout: 3000 })) {
            const text = await title.textContent();
            console.log(`   Page title: ${text.trim()}`);
        }

        // Verify form fields exist
        const currentPwd = page.locator('input[formControlName="currentPassword"], #currentPassword');
        const newPwd = page.locator('input[formControlName="newPassword"], #newPassword');
        const confirmPwd = page.locator('input[formControlName="confirmPassword"], #confirmPassword');

        const currentVisible = await currentPwd.isVisible({ timeout: 2000 });
        const newVisible = await newPwd.isVisible({ timeout: 2000 });
        const confirmVisible = await confirmPwd.isVisible({ timeout: 2000 });

        console.log(`   Current Password field: ${currentVisible ? 'visible' : 'not found'}`);
        console.log(`   New Password field: ${newVisible ? 'visible' : 'not found'}`);
        console.log(`   Confirm Password field: ${confirmVisible ? 'visible' : 'not found'}`);

        await screenshots.capture(page, 'change-password-page');
    }, page, results, screenshots);

    await runTest('Change Password - Password Visibility Toggle', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for visibility toggle buttons
        const toggleBtns = page.locator('button.toggle-password, button[class*="visibility"], .password-toggle, .toggle-visibility');
        const toggleCount = await toggleBtns.count();
        console.log(`   Found ${toggleCount} password visibility toggle(s)`);

        // Check initial type is password
        const pwdInput = page.locator('input[formControlName="newPassword"], #newPassword');
        if (await pwdInput.isVisible({ timeout: 2000 })) {
            const inputType = await pwdInput.getAttribute('type');
            console.log(`   New password field type: ${inputType}`);
        }

        await screenshots.capture(page, 'change-password-toggles');
    }, page, results, screenshots);

    await runTest('Change Password - Validation Errors', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Try to submit empty form - click submit button
        const submitBtn = page.locator('button[type="submit"], button:has-text("Change Password")');
        if (await submitBtn.isVisible({ timeout: 2000 })) {
            const isDisabled = await submitBtn.isDisabled();
            console.log(`   Submit button disabled (empty form): ${isDisabled}`);
        }

        // Touch fields to trigger validation
        const currentPwd = page.locator('input[formControlName="currentPassword"], #currentPassword');
        const newPwd = page.locator('input[formControlName="newPassword"], #newPassword');
        const confirmPwd = page.locator('input[formControlName="confirmPassword"], #confirmPassword');

        if (await currentPwd.isVisible({ timeout: 2000 })) {
            await currentPwd.click();
            await newPwd.click();
            await confirmPwd.click();
            await currentPwd.click(); // Blur confirm to trigger validation
            await page.waitForTimeout(500);
        }

        // Check for validation error messages
        const errors = page.locator('.error-message, .invalid-feedback, .form-error, mat-error');
        const errorCount = await errors.count();
        console.log(`   Validation errors shown: ${errorCount}`);

        await screenshots.capture(page, 'change-password-validation');
    }, page, results, screenshots);

    await runTest('Change Password - Password Strength Indicator', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newPwd = page.locator('input[formControlName="newPassword"], #newPassword');
        if (await newPwd.isVisible({ timeout: 2000 })) {
            // Type weak password
            await newPwd.fill('abc');
            await page.waitForTimeout(300);

            const strengthIndicator = page.locator('.strength-bar, .password-strength, [class*="strength"]').first();
            if (await strengthIndicator.isVisible({ timeout: 2000 })) {
                console.log('   Password strength indicator visible');
                await screenshots.capture(page, 'change-password-weak');
            }

            // Type strong password
            await newPwd.fill('StrongP@ss123!');
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'change-password-strong');

            const strengthLabel = page.locator('.strength-label, .strength-text, [class*="strength"] span').first();
            if (await strengthLabel.isVisible({ timeout: 1000 })) {
                const label = await strengthLabel.textContent();
                console.log(`   Strength label: ${label.trim()}`);
            }
        }
    }, page, results, screenshots);

    await runTest('Change Password - Password Mismatch', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newPwd = page.locator('input[formControlName="newPassword"], #newPassword');
        const confirmPwd = page.locator('input[formControlName="confirmPassword"], #confirmPassword');

        if (await newPwd.isVisible({ timeout: 2000 })) {
            await newPwd.fill('NewPassword123!');
            await confirmPwd.fill('DifferentPassword456!');
            // Blur to trigger mismatch validation
            await page.locator('input[formControlName="currentPassword"], #currentPassword').click();
            await page.waitForTimeout(500);

            // Check for mismatch error
            const mismatchError = page.locator(':has-text("match"), .password-mismatch').first();
            if (await mismatchError.isVisible({ timeout: 2000 })) {
                console.log('   Password mismatch error displayed');
            }

            await screenshots.capture(page, 'change-password-mismatch');
        }
    }, page, results, screenshots);

    await runTest('Change Password - Cancel Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const cancelBtn = page.locator('button:has-text("Cancel"), a:has-text("Cancel"), a:has-text("Back")').first();
        if (await cancelBtn.isVisible({ timeout: 2000 })) {
            await cancelBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);
            if (url.includes('/profile')) {
                console.log('   Correctly navigated back to profile');
            }
            await screenshots.capture(page, 'change-password-cancel');
        } else {
            console.log('   No cancel button found');
        }
    }, page, results, screenshots);

    await runTest('Change Password - Back Link to Profile', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const backLink = page.locator('a[routerLink*="profile"], a:has-text("Back to Profile"), .back-link').first();
        if (await backLink.isVisible({ timeout: 2000 })) {
            const href = await backLink.getAttribute('href') || await backLink.getAttribute('routerLink');
            console.log(`   Back link target: ${href || 'click handler'}`);
            await screenshots.capture(page, 'change-password-back-link');
        } else {
            console.log('   No back-to-profile link found');
        }
    }, page, results, screenshots);
}

module.exports = { runChangePasswordTests };
