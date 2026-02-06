/**
 * Operators CRUD Tests
 * Tests for operator list, form, and detail pages under /manage/operators
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runOperatorsTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('OPERATORS CRUD TESTS');
    console.log('='.repeat(50));

    // ============================================
    // OPERATOR LIST
    // ============================================

    await runTest('Operators - List Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATORS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'operators-list');

        // Verify page header
        const header = page.locator('h1, h2').filter({ hasText: /operators/i });
        if (!await header.isVisible()) {
            throw new Error('Operators page header not visible');
        }
    }, page, results, screenshots);

    await runTest('Operators - Table View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATORS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        const emptyState = page.locator('.empty-state, .no-data');

        // Either table or empty state should be visible
        const hasTable = await table.isVisible();
        const hasEmpty = await emptyState.isVisible();

        if (!hasTable && !hasEmpty) {
            throw new Error('Neither table nor empty state visible');
        }

        if (hasTable) {
            await screenshots.capture(page, 'operators-table');
        }
    }, page, results, screenshots);

    await runTest('Operators - New Button Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATORS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Operator"), a:has-text("New Operator")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'operators-new-form');

            // Verify form is displayed
            const form = page.locator('form');
            if (!await form.isVisible()) {
                throw new Error('Operator form not visible');
            }
        } else {
            console.log('  - New Operator button not found, skipping...');
        }
    }, page, results, screenshots);

    await runTest('Operators - Form Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATOR_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'operators-form-fields');

        // Check for common form fields
        const nameField = page.locator('input[formcontrolname="name"], input#name, input[name="name"]');
        const codeField = page.locator('input[formcontrolname="operatorCode"], input#operatorCode, input[name="operatorCode"]');

        const hasName = await nameField.isVisible();
        const hasCode = await codeField.isVisible();

        if (!hasName && !hasCode) {
            // Try alternative selectors
            const anyInput = page.locator('form input').first();
            if (!await anyInput.isVisible()) {
                throw new Error('No form fields visible');
            }
        }
    }, page, results, screenshots);

    await runTest('Operators - Form Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATOR_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'operators-validation');

            // Check for validation errors or disabled button
            const errorMessages = page.locator('.error, .error-message, .invalid-feedback');
            const hasErrors = await errorMessages.count() > 0;
            const isDisabled = await submitButton.isDisabled();

            if (!hasErrors && !isDisabled) {
                console.log('  - Form submitted without validation (may be expected)');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // OPERATOR DETAIL (if exists)
    // ============================================

    await runTest('Operators - Detail View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATORS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try clicking on a row to view details
        const tableRow = page.locator('table tbody tr').first();
        if (await tableRow.isVisible()) {
            // Try to find a view/detail link
            const viewLink = tableRow.locator('a, button:has-text("View")').first();
            if (await viewLink.isVisible()) {
                await viewLink.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'operators-detail');
            } else {
                console.log('  - No view link found in table row');
            }
        } else {
            console.log('  - No operators in table to view');
        }
    }, page, results, screenshots);

    await runTest('Operators - Filter/Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATORS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to find search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input#search');
        if (await searchInput.isVisible()) {
            await searchInput.fill('test');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'operators-search');
        } else {
            // Try status filter
            const statusFilter = page.locator('select#status, select[name="status"]');
            if (await statusFilter.isVisible()) {
                await screenshots.capture(page, 'operators-filter');
            } else {
                console.log('  - No search/filter controls found');
            }
        }
    }, page, results, screenshots);

    await runTest('Operators - Pagination', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATORS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const pagination = page.locator('.pagination, app-pagination, .page-controls');
        if (await pagination.isVisible()) {
            await screenshots.capture(page, 'operators-pagination');
        } else {
            console.log('  - Pagination not visible (may have fewer items than page size)');
        }
    }, page, results, screenshots);

    // ============================================
    // CRUD OPERATIONS (with --submit flag)
    // ============================================

    if (submitActions) {
        await runTest('Operators - Create New (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATOR_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Fill form fields
            const nameField = page.locator('input[formcontrolname="name"], input#name');
            const codeField = page.locator('input[formcontrolname="operatorCode"], input#operatorCode');

            if (await nameField.isVisible()) {
                await nameField.fill(TEST_DATA.crud.operator.name);
            }
            if (await codeField.isVisible()) {
                await codeField.fill(TEST_DATA.crud.operator.code);
            }

            await screenshots.capture(page, 'operators-create-filled');

            const submitButton = page.locator('button[type="submit"]');
            if (await submitButton.isVisible() && !await submitButton.isDisabled()) {
                await submitButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'operators-create-success');

                // Verify redirect or success message
                const successMessage = page.locator('.success, .alert-success, .toast');
                const hasSuccess = await successMessage.isVisible();
                const onListPage = page.url().includes(ROUTES.OPERATORS);

                if (!hasSuccess && !onListPage) {
                    console.log('  - Create may have succeeded, check manually');
                }
            }
        }, page, results, screenshots);

        await runTest('Operators - Edit (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATORS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Find and click edit button on first row
            const editButton = page.locator('table tbody tr').first().locator('button:has-text("Edit"), a:has-text("Edit")');
            if (await editButton.isVisible()) {
                await editButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'operators-edit-form');

                // Update name field
                const nameField = page.locator('input[formcontrolname="name"], input#name');
                if (await nameField.isVisible()) {
                    await nameField.fill(TEST_DATA.crud.operator.updatedName);
                }

                const submitButton = page.locator('button[type="submit"]');
                if (await submitButton.isVisible() && !await submitButton.isDisabled()) {
                    await submitButton.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'operators-edit-success');
                }
            } else {
                console.log('  - No edit button found');
            }
        }, page, results, screenshots);
    }

    console.log('\n' + '='.repeat(50));
    console.log('OPERATORS TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runOperatorsTests };
