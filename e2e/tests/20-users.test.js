/**
 * Users Management Tests
 * Tests for user list, form, and detail pages under /manage/users
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runUsersTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('USERS MANAGEMENT TESTS');
    console.log('='.repeat(50));

    // ============================================
    // USER LIST
    // ============================================

    await runTest('Users - List Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'users-list');

        // Verify page header
        const header = page.locator('h1, h2').filter({ hasText: /users/i });
        if (!await header.isVisible()) {
            // Check if we're on the correct page
            const pageContent = page.locator('.users-list, table, .user-table');
            if (!await pageContent.first().isVisible()) {
                throw new Error('Users page not loaded properly');
            }
        }
    }, page, results, screenshots);

    await runTest('Users - Table View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        const emptyState = page.locator('.empty-state, .no-data');

        const hasTable = await table.isVisible();
        const hasEmpty = await emptyState.isVisible();

        if (!hasTable && !hasEmpty) {
            throw new Error('Neither table nor empty state visible');
        }

        if (hasTable) {
            await screenshots.capture(page, 'users-table');

            // Verify expected columns
            const headers = page.locator('table thead th');
            const headerCount = await headers.count();
            console.log(`  - Table has ${headerCount} columns`);
        }
    }, page, results, screenshots);

    await runTest('Users - New Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New User"), a:has-text("New User"), button:has-text("Add User")');
        if (await newButton.isVisible()) {
            await screenshots.capture(page, 'users-new-button');
            console.log('  - New User button found');
        } else {
            console.log('  - New User button not found');
        }
    }, page, results, screenshots);

    await runTest('Users - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input#search');
        if (await searchInput.isVisible()) {
            await searchInput.fill('admin');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'users-search');
        } else {
            console.log('  - No search input found');
        }
    }, page, results, screenshots);

    await runTest('Users - Role Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const roleFilter = page.locator('select#role, select[name="role"]');
        if (await roleFilter.isVisible()) {
            const options = await roleFilter.locator('option').allTextContents();
            console.log('  - Available roles:', options.join(', '));

            if (options.length > 1) {
                await roleFilter.selectOption({ index: 1 });
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'users-filtered');
            }
        } else {
            console.log('  - No role filter found');
        }
    }, page, results, screenshots);

    // ============================================
    // USER FORM
    // ============================================

    await runTest('Users - New User Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'users-new-form');

        // Verify form is displayed
        const form = page.locator('form');
        if (!await form.isVisible()) {
            throw new Error('User form not visible');
        }

        // Check for expected fields
        const nameField = page.locator('input[formcontrolname="name"], input#name');
        const emailField = page.locator('input[type="email"], input#email');
        const passwordField = page.locator('input[type="password"]');
        const roleField = page.locator('select#role, input#role');

        const hasName = await nameField.isVisible();
        const hasEmail = await emailField.isVisible();
        const hasPassword = await passwordField.isVisible();
        const hasRole = await roleField.isVisible();

        console.log(`  - Form fields: name=${hasName}, email=${hasEmail}, password=${hasPassword}, role=${hasRole}`);
    }, page, results, screenshots);

    await runTest('Users - Form Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
            const isDisabled = await submitButton.isDisabled();
            if (isDisabled) {
                console.log('  - Submit button disabled for empty form');
            } else {
                await submitButton.click();
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'users-validation');

                const errors = page.locator('.error, .error-message, .invalid-feedback');
                if (await errors.first().isVisible()) {
                    console.log('  - Validation errors displayed');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Users - Email Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const emailField = page.locator('input[type="email"], input#email');
        if (await emailField.isVisible()) {
            // Enter invalid email
            await emailField.fill('invalid-email');
            await emailField.blur();
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'users-email-invalid');

            // Check for validation error
            const emailError = page.locator('.error:has-text("email"), .invalid-feedback');
            if (await emailError.isVisible()) {
                console.log('  - Email validation working');
            }

            // Enter valid email
            await emailField.fill('valid@example.com');
            await page.waitForTimeout(300);

            await screenshots.capture(page, 'users-email-valid');
        }
    }, page, results, screenshots);

    // ============================================
    // USER DETAIL
    // ============================================

    await runTest('Users - View Detail', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const tableRow = page.locator('table tbody tr').first();
        if (await tableRow.isVisible()) {
            const viewLink = tableRow.locator('a, button:has-text("View")').first();
            if (await viewLink.isVisible()) {
                await viewLink.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'users-detail');
            } else {
                console.log('  - No view link found');
            }
        } else {
            console.log('  - No users in table');
        }
    }, page, results, screenshots);

    await runTest('Users - Edit User', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const editButton = page.locator('table tbody tr').first().locator('button:has-text("Edit"), a:has-text("Edit")');
        if (await editButton.isVisible()) {
            await editButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'users-edit-form');

            // Verify form is pre-filled
            const nameField = page.locator('input[formcontrolname="name"], input#name');
            if (await nameField.isVisible()) {
                const value = await nameField.inputValue();
                if (value) {
                    console.log('  - Form pre-filled with user data');
                }
            }
        } else {
            console.log('  - No edit button found');
        }
    }, page, results, screenshots);

    // ============================================
    // USER ROLES
    // ============================================

    await runTest('Users - Role Selection', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const roleSelect = page.locator('select#role, select[name="role"]');
        if (await roleSelect.isVisible()) {
            const options = await roleSelect.locator('option').allTextContents();
            console.log('  - Available roles:', options.join(', '));

            await screenshots.capture(page, 'users-role-options');
        } else {
            // Check for radio buttons or checkboxes
            const roleRadio = page.locator('input[name="role"]');
            if (await roleRadio.first().isVisible()) {
                const roleCount = await roleRadio.count();
                console.log(`  - Found ${roleCount} role options`);
            }
        }
    }, page, results, screenshots);

    // ============================================
    // CRUD ACTIONS (with --submit flag)
    // ============================================

    if (submitActions) {
        await runTest('Users - Create User (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.USER_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Fill form
            const nameField = page.locator('input[formcontrolname="name"], input#name');
            const emailField = page.locator('input[type="email"], input#email');
            const passwordField = page.locator('input[type="password"]').first();
            const roleSelect = page.locator('select#role, select[name="role"]');

            if (await nameField.isVisible()) {
                await nameField.fill(TEST_DATA.crud.user.name);
            }
            if (await emailField.isVisible()) {
                await emailField.fill(TEST_DATA.crud.user.email);
            }
            if (await passwordField.isVisible()) {
                await passwordField.fill(TEST_DATA.crud.user.password);
            }
            if (await roleSelect.isVisible()) {
                try {
                    await roleSelect.selectOption(TEST_DATA.crud.user.role);
                } catch (e) {
                    // Try selecting by index
                    await roleSelect.selectOption({ index: 1 });
                }
            }

            await screenshots.capture(page, 'users-create-filled');

            const submitButton = page.locator('button[type="submit"]');
            if (await submitButton.isVisible() && !await submitButton.isDisabled()) {
                await submitButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'users-create-success');
            }
        }, page, results, screenshots);

        await runTest('Users - Update User (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const editButton = page.locator('table tbody tr').first().locator('button:has-text("Edit"), a:has-text("Edit")');
            if (await editButton.isVisible()) {
                await editButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const nameField = page.locator('input[formcontrolname="name"], input#name');
                if (await nameField.isVisible()) {
                    await nameField.fill(TEST_DATA.crud.user.updatedName);
                }

                await screenshots.capture(page, 'users-update-filled');

                const submitButton = page.locator('button[type="submit"]');
                if (await submitButton.isVisible() && !await submitButton.isDisabled()) {
                    await submitButton.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'users-update-success');
                }
            }
        }, page, results, screenshots);

        await runTest('Users - Delete User (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Find delete button (usually last row or the test user)
            const deleteButton = page.locator('table tbody tr').filter({ hasText: /e2e/i }).locator('button:has-text("Delete")').first();
            if (!await deleteButton.isVisible()) {
                // Try any delete button
                const anyDelete = page.locator('table tbody tr').last().locator('button:has-text("Delete")');
                if (await anyDelete.isVisible()) {
                    await anyDelete.click();
                    await page.waitForTimeout(500);

                    // Handle confirmation dialog
                    const confirmButton = page.locator('.modal button:has-text("Delete"), .modal button:has-text("Confirm")');
                    if (await confirmButton.isVisible()) {
                        await screenshots.capture(page, 'users-delete-confirm');
                        await confirmButton.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'users-delete-success');
                    }
                }
            } else {
                await deleteButton.click();
                await page.waitForTimeout(500);

                const confirmButton = page.locator('.modal button:has-text("Delete"), .modal button:has-text("Confirm")');
                if (await confirmButton.isVisible()) {
                    await screenshots.capture(page, 'users-delete-confirm');
                    await confirmButton.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'users-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    console.log('\n' + '='.repeat(50));
    console.log('USERS MANAGEMENT TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runUsersTests };
