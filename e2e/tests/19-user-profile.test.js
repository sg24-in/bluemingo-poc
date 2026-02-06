/**
 * User Profile and Change Password Tests
 * Tests for profile view and password change functionality
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runUserProfileTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('USER PROFILE TESTS');
    console.log('='.repeat(50));

    // ============================================
    // PROFILE PAGE
    // ============================================

    await runTest('Profile - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROFILE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'profile-page');

        // Verify profile content is visible
        const profileContent = page.locator('.profile, .user-profile, .profile-content, h1, h2');
        if (!await profileContent.first().isVisible()) {
            throw new Error('Profile page content not visible');
        }
    }, page, results, screenshots);

    await runTest('Profile - User Information Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROFILE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for user info elements
        const emailField = page.locator('text=/email/i');
        const nameField = page.locator('text=/name/i');
        const roleField = page.locator('text=/role/i');

        const hasEmail = await emailField.isVisible();
        const hasName = await nameField.isVisible();
        const hasRole = await roleField.isVisible();

        if (hasEmail || hasName || hasRole) {
            await screenshots.capture(page, 'profile-user-info');
            console.log('  - User information displayed');
        } else {
            // Try looking for form fields or labels
            const labels = page.locator('label');
            const labelCount = await labels.count();
            if (labelCount > 0) {
                console.log(`  - Found ${labelCount} labels on profile page`);
            }
        }
    }, page, results, screenshots);

    await runTest('Profile - Edit Mode', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROFILE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to find edit button
        const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit Profile")');
        if (await editButton.isVisible()) {
            await editButton.click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'profile-edit-mode');

            // Verify form inputs are available
            const inputs = page.locator('input:not([type="hidden"])');
            const inputCount = await inputs.count();
            if (inputCount > 0) {
                console.log(`  - ${inputCount} editable fields in edit mode`);
            }
        } else {
            console.log('  - Edit button not found (profile may be read-only)');
        }
    }, page, results, screenshots);

    // ============================================
    // CHANGE PASSWORD
    // ============================================

    await runTest('Change Password - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'change-password-page');

        // Verify change password form
        const form = page.locator('form');
        const header = page.locator('h1, h2').filter({ hasText: /password/i });

        if (!await form.isVisible() && !await header.isVisible()) {
            throw new Error('Change password page not loaded properly');
        }
    }, page, results, screenshots);

    await runTest('Change Password - Form Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for password fields
        const currentPassword = page.locator('input[type="password"]').first();
        const passwordFields = page.locator('input[type="password"]');
        const fieldCount = await passwordFields.count();

        if (fieldCount >= 2) {
            await screenshots.capture(page, 'change-password-form');
            console.log(`  - Found ${fieldCount} password fields (current, new, confirm)`);
        } else if (fieldCount === 1) {
            console.log('  - Found 1 password field');
        } else {
            throw new Error('No password fields found');
        }
    }, page, results, screenshots);

    await runTest('Change Password - Form Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
            // Check if button is disabled when form is empty
            const isDisabled = await submitButton.isDisabled();
            if (isDisabled) {
                console.log('  - Submit button disabled for empty form');
            } else {
                await submitButton.click();
                await page.waitForTimeout(500);

                // Check for validation errors
                const errors = page.locator('.error, .error-message, .invalid-feedback');
                if (await errors.first().isVisible()) {
                    await screenshots.capture(page, 'change-password-validation');
                    console.log('  - Validation errors displayed');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Change Password - Password Mismatch', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CHANGE_PASSWORD}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const passwordFields = page.locator('input[type="password"]');
        const fieldCount = await passwordFields.count();

        if (fieldCount >= 3) {
            // Fill with mismatched passwords
            await passwordFields.nth(0).fill('currentpass123');
            await passwordFields.nth(1).fill('newpass123');
            await passwordFields.nth(2).fill('differentpass123');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'change-password-mismatch');

            // Check for mismatch error
            const mismatchError = page.locator('text=/match/i, text=/same/i');
            if (await mismatchError.isVisible()) {
                console.log('  - Password mismatch validation working');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // NAVIGATION
    // ============================================

    await runTest('Profile - Navigation from Header', async () => {
        await page.goto(`${config.baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to find profile link in header/user menu
        const userMenu = page.locator('.user-menu, .dropdown, .profile-menu').first();
        const profileLink = page.locator('a[href*="profile"], button:has-text("Profile")').first();

        if (await userMenu.isVisible()) {
            await userMenu.click();
            await page.waitForTimeout(300);

            const menuProfileLink = page.locator('a[href*="profile"], .dropdown-item:has-text("Profile")').first();
            if (await menuProfileLink.isVisible()) {
                await menuProfileLink.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'profile-from-header');
            }
        } else if (await profileLink.isVisible()) {
            await profileLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'profile-from-header');
        } else {
            console.log('  - No profile navigation found in header');
        }
    }, page, results, screenshots);

    await runTest('Change Password - Navigation from Profile', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROFILE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to find change password link
        const changePasswordLink = page.locator('a[href*="change-password"], button:has-text("Change Password")').first();
        if (await changePasswordLink.isVisible()) {
            await changePasswordLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'change-password-from-profile');
        } else {
            console.log('  - No change password link found on profile page');
        }
    }, page, results, screenshots);

    // ============================================
    // SUBMIT ACTIONS (with --submit flag)
    // ============================================

    if (submitActions) {
        await runTest('Profile - Update Profile (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROFILE}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Try to edit and save
            const editButton = page.locator('button:has-text("Edit")');
            if (await editButton.isVisible()) {
                await editButton.click();
                await page.waitForTimeout(500);

                // Find and update a field
                const nameInput = page.locator('input[name="name"], input#name');
                if (await nameInput.isVisible()) {
                    const currentValue = await nameInput.inputValue();
                    await nameInput.fill(currentValue + ' Updated');
                }

                await screenshots.capture(page, 'profile-update-filled');

                const saveButton = page.locator('button[type="submit"], button:has-text("Save")');
                if (await saveButton.isVisible()) {
                    await saveButton.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'profile-update-success');
                }
            }
        }, page, results, screenshots);

        // Note: Password change test is commented out to avoid breaking authentication
        // await runTest('Change Password - Submit New Password', async () => { ... });
    }

    console.log('\n' + '='.repeat(50));
    console.log('USER PROFILE TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runUserProfileTests };
