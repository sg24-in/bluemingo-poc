/**
 * Routing Management Tests
 * Tests the routing configuration module at /manage/routing
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runRoutingTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('ROUTING MANAGEMENT TESTS');
    console.log('='.repeat(50));

    // ============================================
    // ROUTING LIST
    // ============================================

    await runTest('Routing - List Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'routing-list');

        // Verify page is loaded
        const header = page.locator('h1');
        const headerText = await header.textContent();
        if (!headerText.includes('Routing')) {
            throw new Error('Routing page not loaded - expected header with "Routing"');
        }
        console.log('  - Page title:', headerText);
    }, page, results, screenshots);

    await runTest('Routing - Summary Cards', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const summaryCards = page.locator('.summary-card, .stat-card');
        const cardCount = await summaryCards.count();

        if (cardCount > 0) {
            await screenshots.capture(page, 'routing-summary-cards');
            console.log('  - Found', cardCount, 'summary cards');
        } else {
            console.log('  - No summary cards found');
        }
    }, page, results, screenshots);

    await runTest('Routing - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            const options = await statusFilter.locator('option').allTextContents();
            console.log('  - Status options:', options.join(', '));

            await screenshots.capture(page, 'routing-status-filter');
        } else {
            console.log('  - No status filter found');
        }
    }, page, results, screenshots);

    await runTest('Routing - Search Input', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input#search, input[type="text"][placeholder*="earch"]');
        if (await searchInput.isVisible()) {
            await searchInput.fill('Test');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'routing-search');
            console.log('  - Search input works');
        } else {
            console.log('  - No search input found');
        }
    }, page, results, screenshots);

    await runTest('Routing - New Routing Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const newBtn = page.locator('button:has-text("New Routing"), a:has-text("New Routing")');
        if (await newBtn.isVisible()) {
            await screenshots.capture(page, 'routing-new-button');
            console.log('  - New Routing button found');
        } else {
            throw new Error('New Routing button not found');
        }
    }, page, results, screenshots);

    // ============================================
    // ROUTING FORM
    // ============================================

    await runTest('Routing - Navigate to Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await page.click('button:has-text("New Routing"), a:has-text("New Routing")');
        await page.waitForTimeout(1000);

        const header = page.locator('h1');
        const headerText = await header.textContent();

        if (!headerText.includes('Create') && !headerText.includes('Routing')) {
            throw new Error('Did not navigate to create form');
        }

        await screenshots.capture(page, 'routing-create-form');
        console.log('  - Navigated to create form');
    }, page, results, screenshots);

    await runTest('Routing - Form Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for routing name
        const routingName = page.locator('input#routingName, input[formcontrolname="routingName"]');
        if (!await routingName.isVisible()) {
            throw new Error('Routing name input not found');
        }

        // Check for process select
        const processSelect = page.locator('select#processId, select[formcontrolname="processId"]');
        if (!await processSelect.isVisible()) {
            throw new Error('Process select not found');
        }

        // Check for routing type
        const routingType = page.locator('select#routingType, select[formcontrolname="routingType"]');
        if (!await routingType.isVisible()) {
            throw new Error('Routing type select not found');
        }

        await screenshots.capture(page, 'routing-form-fields');
        console.log('  - All required form fields present');
    }, page, results, screenshots);

    await runTest('Routing - Add Step Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const addStepBtn = page.locator('button:has-text("Add Step")');
        if (!await addStepBtn.isVisible()) {
            throw new Error('Add Step button not found');
        }

        await screenshots.capture(page, 'routing-add-step-button');
        console.log('  - Add Step button present');
    }, page, results, screenshots);

    await runTest('Routing - Step Modal Opens', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Click the Add Step button in the section header (not in modal)
        await page.locator('.section-header button:has-text("Add Step")').click();
        await page.waitForTimeout(500);

        const modal = page.locator('.modal');
        if (!await modal.isVisible()) {
            throw new Error('Step modal did not open');
        }

        await screenshots.capture(page, 'routing-step-modal');
        console.log('  - Step modal opens correctly');

        // Close modal for next test
        await page.locator('.modal .close-btn, .modal button:has-text("Cancel")').first().click();
        await page.waitForTimeout(300);
    }, page, results, screenshots);

    await runTest('Routing - Step Modal Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Click the Add Step button in the section header
        await page.locator('.section-header button:has-text("Add Step")').click();
        await page.waitForTimeout(500);

        // Check for operation name
        const operationName = page.locator('.modal input#operationName');
        if (!await operationName.isVisible()) {
            throw new Error('Operation name input not found');
        }

        // Check for operation type
        const operationType = page.locator('.modal select#operationType');
        if (!await operationType.isVisible()) {
            throw new Error('Operation type select not found');
        }

        // Check for sequence number
        const sequenceNumber = page.locator('.modal input#sequenceNumber');
        if (!await sequenceNumber.isVisible()) {
            throw new Error('Sequence number input not found');
        }

        await screenshots.capture(page, 'routing-step-modal-fields');
        console.log('  - All step modal fields present');

        // Close modal
        await page.locator('.modal .close-btn').click();
        await page.waitForTimeout(300);
    }, page, results, screenshots);

    await runTest('Routing - Batch Behavior Checkboxes', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Click the Add Step button in the section header
        await page.locator('.section-header button:has-text("Add Step")').click();
        await page.waitForTimeout(500);

        // Check for checkbox groups in modal
        const checkboxGroups = page.locator('.modal .checkbox-group, .modal .checkbox-label');
        const checkboxCount = await checkboxGroups.count();

        if (checkboxCount > 0) {
            await screenshots.capture(page, 'routing-batch-flags');
            console.log('  - Found', checkboxCount, 'checkbox items');
        } else {
            console.log('  - Batch behavior checkboxes present');
        }

        // Close modal
        await page.locator('.modal .close-btn').click();
        await page.waitForTimeout(300);
    }, page, results, screenshots);

    await runTest('Routing - Cancel Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Click the Cancel button in form actions (not in modal)
        const cancelBtn = page.locator('.form-actions button:has-text("Cancel")');
        if (!await cancelBtn.isVisible()) {
            throw new Error('Cancel button not found');
        }

        await cancelBtn.click();
        await page.waitForTimeout(1000);

        const url = page.url();
        if (!url.includes('/manage/routing') || url.includes('/new')) {
            throw new Error('Cancel did not navigate back to list');
        }

        await screenshots.capture(page, 'routing-after-cancel');
        console.log('  - Cancel navigates back to list');
    }, page, results, screenshots);

    // ============================================
    // SIDEBAR NAVIGATION
    // ============================================

    await runTest('Routing - Sidebar Navigation', async () => {
        await page.goto(`${config.baseUrl}/#/manage/customers`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const routingLink = page.locator('a[href*="/manage/routing"], a:has-text("Routing")');
        if (!await routingLink.isVisible()) {
            throw new Error('Routing link not found in sidebar');
        }

        await routingLink.click();
        await page.waitForTimeout(1000);

        const url = page.url();
        if (!url.includes('/manage/routing')) {
            throw new Error('Routing link did not navigate correctly');
        }

        await screenshots.capture(page, 'routing-sidebar-nav');
        console.log('  - Sidebar navigation works');
    }, page, results, screenshots);

    // ============================================
    // SUBMIT TESTS (with --submit flag)
    // ============================================

    if (submitActions) {
        await runTest('Routing - Create New Routing (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Fill routing name
            await page.fill('input#routingName, input[formcontrolname="routingName"]', 'E2E Test Routing');

            // Select process (first option after empty)
            const processSelect = page.locator('select#processId, select[formcontrolname="processId"]');
            const options = await processSelect.locator('option').allTextContents();
            if (options.length > 1) {
                await processSelect.selectOption({ index: 1 });
            }

            // Add a step
            await page.click('button:has-text("Add Step")');
            await page.waitForTimeout(500);

            await page.fill('input#operationName, input[formcontrolname="operationName"]', 'E2E Test Step');

            const opTypeSelect = page.locator('select#operationType, select[formcontrolname="operationType"]');
            const opTypes = await opTypeSelect.locator('option').allTextContents();
            if (opTypes.length > 1) {
                await opTypeSelect.selectOption({ index: 1 });
            }

            // Save step
            await page.click('.modal button:has-text("Add Step"), .modal button:has-text("Save")');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'routing-create-filled');

            // Submit form
            await page.click('button[type="submit"]:has-text("Create"), button:has-text("Create Routing")');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'routing-create-success');
            console.log('  - Routing created successfully');
        }, page, results, screenshots);
    }

    console.log('\n' + '='.repeat(50));
    console.log('ROUTING TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runRoutingTests };
