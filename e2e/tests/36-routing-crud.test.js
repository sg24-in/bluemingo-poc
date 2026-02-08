/**
 * Routing CRUD Tests
 * Tests Routing Create/Read/Update/Delete operations including step management
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runRoutingCrudTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('🛤️ ROUTING CRUD TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // ROUTING LIST
    // ============================================

    // Test 1: Routing list page
    await runTest('Routing - List Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'routing-list-page');

        // Verify page loaded
        const heading = page.locator('h1, h2, .page-title');
        if (await heading.isVisible()) {
            const text = await heading.textContent();
            if (!text.toLowerCase().includes('routing')) {
                console.log('   Warning: Page may not be routing list');
            }
        }
    }, page, results, screenshots);

    // Test 2: Routing - New button
    await runTest('Routing - New Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newBtn = page.locator('button:has-text("New Routing"), a:has-text("New Routing"), button:has-text("Create")');
        if (await newBtn.isVisible()) {
            await screenshots.capture(page, 'routing-new-button');
        } else {
            throw new Error('New Routing button not found');
        }
    }, page, results, screenshots);

    // Test 3: Navigate to create form
    await runTest('Routing - Navigate to Create', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newBtn = page.locator('button:has-text("New Routing"), a:has-text("New Routing")');
        if (await newBtn.isVisible()) {
            await newBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'routing-create-form');

            const form = page.locator('form');
            if (!await form.isVisible()) {
                throw new Error('Routing create form not visible');
            }
        }
    }, page, results, screenshots);

    // Test 4: Routing form fields
    await runTest('Routing - Form Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for required fields
        const routingName = page.locator('input[formControlName="routingName"], #routingName');
        const processSelect = page.locator('select[formControlName="processId"], #processId');
        const typeSelect = page.locator('select[formControlName="routingType"], #routingType');

        let fieldsFound = 0;
        if (await routingName.isVisible()) fieldsFound++;
        if (await processSelect.isVisible()) fieldsFound++;
        if (await typeSelect.isVisible()) fieldsFound++;

        await screenshots.capture(page, 'routing-form-fields');

        if (fieldsFound < 2) {
            console.log(`   Warning: Only found ${fieldsFound} form fields`);
        }
    }, page, results, screenshots);

    // Test 5: Routing - Process dropdown
    await runTest('Routing - Process Dropdown', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const processSelect = page.locator('select[formControlName="processId"], #processId');
        if (await processSelect.isVisible()) {
            await processSelect.click();
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'routing-process-dropdown');

            const options = await processSelect.locator('option').count();
            if (options < 2) {
                console.log('   Warning: Process dropdown has few options');
            }
        }
    }, page, results, screenshots);

    // Test 6: Routing - Type dropdown
    await runTest('Routing - Type Dropdown', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const typeSelect = page.locator('select[formControlName="routingType"], #routingType');
        if (await typeSelect.isVisible()) {
            await typeSelect.click();
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'routing-type-dropdown');
        }
    }, page, results, screenshots);

    // ============================================
    // ROUTING STEPS
    // ============================================

    // Test 7: Add Step button
    await runTest('Routing - Add Step Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Fill basic info first
        const routingName = page.locator('input[formControlName="routingName"], #routingName');
        if (await routingName.isVisible()) {
            await routingName.fill('E2E Test Routing');
        }

        const processSelect = page.locator('select[formControlName="processId"], #processId');
        if (await processSelect.isVisible()) {
            await processSelect.selectOption({ index: 1 });
        }

        const addStepBtn = page.locator('button:has-text("Add Step"), button:has-text("Add Operation")');
        if (await addStepBtn.isVisible()) {
            await screenshots.capture(page, 'routing-add-step-button');
        }
    }, page, results, screenshots);

    // Test 8: Step modal form
    await runTest('Routing - Step Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const addStepBtn = page.locator('button:has-text("Add Step"), button:has-text("Add Operation")').first();
        if (await addStepBtn.isVisible()) {
            await addStepBtn.click();
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'routing-step-modal');

            const modal = page.locator('.modal, .step-modal, [role="dialog"]');
            if (!await modal.isVisible()) {
                throw new Error('Step modal did not open');
            }

            // Close modal after test - try cancel button first, then Escape
            const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal .close-btn').first();
            if (await cancelBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                await cancelBtn.click();
            } else {
                await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(300);
        }
    }, page, results, screenshots);

    // Test 9: Step form - Operation template dropdown
    await runTest('Routing - Step Template Dropdown', async () => {
        // Force page reload to clear any modal state
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Close any existing modal by clicking overlay or cancel button
        const modalOverlay = page.locator('.modal-overlay');
        if (await modalOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
            const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal .close-btn, .modal button.btn-secondary').first();
            if (await cancelBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                await cancelBtn.click({ force: true });
            } else {
                await modalOverlay.click({ position: { x: 5, y: 5 }, force: true });
            }
            await page.waitForTimeout(300);
        }

        const addStepBtn = page.locator('button:has-text("Add Step"), button:has-text("Add Operation")').first();
        if (await addStepBtn.isVisible({ timeout: 2000 })) {
            await addStepBtn.click();
            await page.waitForTimeout(500);

            const templateSelect = page.locator('.modal select[formControlName="operationTemplateId"], .modal #operationTemplateId');
            if (await templateSelect.isVisible({ timeout: 2000 })) {
                await templateSelect.click();
                await page.waitForTimeout(300);
                await screenshots.capture(page, 'routing-step-template-dropdown');
            }

            // Close modal after test
            const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal .close-btn').first();
            if (await cancelBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                await cancelBtn.click();
            } else {
                await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(200);
        }
    }, page, results, screenshots);

    // Test 10: Step form - Manual operation name/type
    await runTest('Routing - Step Manual Entry', async () => {
        // Force page reload to clear any modal state
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Close any existing modal by clicking overlay or cancel button
        const modalOverlay = page.locator('.modal-overlay');
        if (await modalOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
            const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal .close-btn, .modal button.btn-secondary').first();
            if (await cancelBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                await cancelBtn.click({ force: true });
            } else {
                await modalOverlay.click({ position: { x: 5, y: 5 }, force: true });
            }
            await page.waitForTimeout(300);
        }

        const addStepBtn = page.locator('button:has-text("Add Step"), button:has-text("Add Operation")').first();
        if (await addStepBtn.isVisible({ timeout: 2000 })) {
            await addStepBtn.click();
            await page.waitForTimeout(500);

            // Fill manual operation name
            const opName = page.locator('.modal input[formControlName="operationName"], .modal #operationName');
            if (await opName.isVisible({ timeout: 2000 })) {
                await opName.fill('E2E Test Step');
            }

            // Select operation type
            const opType = page.locator('.modal select[formControlName="operationType"], .modal #operationType');
            if (await opType.isVisible({ timeout: 1000 })) {
                await opType.selectOption({ index: 1 });
            }

            await screenshots.capture(page, 'routing-step-manual-entry');

            // Close modal after test
            const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal .close-btn').first();
            if (await cancelBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                await cancelBtn.click();
            } else {
                await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(200);
        }
    }, page, results, screenshots);

    // Test 11: Step form - Flags (mandatory, parallel, etc.)
    await runTest('Routing - Step Flags', async () => {
        // Force page reload to clear any modal state
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Close any existing modal by clicking overlay or cancel button
        const modalOverlay = page.locator('.modal-overlay');
        if (await modalOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
            const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal .close-btn, .modal button.btn-secondary').first();
            if (await cancelBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                await cancelBtn.click({ force: true });
            } else {
                await modalOverlay.click({ position: { x: 5, y: 5 }, force: true });
            }
            await page.waitForTimeout(300);
        }

        const addStepBtn = page.locator('button:has-text("Add Step"), button:has-text("Add Operation")').first();
        if (await addStepBtn.isVisible({ timeout: 2000 })) {
            await addStepBtn.click();
            await page.waitForTimeout(500);

            // Check for flag checkboxes
            const mandatoryFlag = page.locator('.modal input[formControlName="mandatoryFlag"], .modal #mandatoryFlag');
            const parallelFlag = page.locator('.modal input[formControlName="isParallel"], .modal #isParallel');
            const producesOutputFlag = page.locator('.modal input[formControlName="producesOutputBatch"], .modal #producesOutputBatch');

            if (await mandatoryFlag.isVisible({ timeout: 1000 })) {
                await mandatoryFlag.check();
            }

            await screenshots.capture(page, 'routing-step-flags');

            // Close modal after test
            const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal .close-btn').first();
            if (await cancelBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                await cancelBtn.click();
            } else {
                await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(200);
        }
    }, page, results, screenshots);

    // Test 12: Add step to routing
    await runTest('Routing - Save Step', async () => {
        // Force page reload to clear any modal state
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Close any existing modal by clicking overlay or cancel button
        const modalOverlay = page.locator('.modal-overlay');
        if (await modalOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
            const cancelBtn = page.locator('.modal button:has-text("Cancel"), .modal .close-btn, .modal button.btn-secondary').first();
            if (await cancelBtn.isVisible({ timeout: 300 }).catch(() => false)) {
                await cancelBtn.click({ force: true });
            } else {
                await modalOverlay.click({ position: { x: 5, y: 5 }, force: true });
            }
            await page.waitForTimeout(300);
        }

        const addStepBtn = page.locator('button:has-text("Add Step"), button:has-text("Add Operation")').first();
        if (await addStepBtn.isVisible({ timeout: 2000 })) {
            await addStepBtn.click();
            await page.waitForTimeout(500);

            // Fill step form
            const opName = page.locator('.modal input[formControlName="operationName"], .modal #operationName');
            if (await opName.isVisible({ timeout: 2000 })) {
                await opName.fill('E2E Test Melt');
            }

            const opType = page.locator('.modal select[formControlName="operationType"], .modal #operationType');
            if (await opType.isVisible({ timeout: 1000 })) {
                await opType.selectOption({ index: 1 });
            }

            const seqNum = page.locator('.modal input[formControlName="sequenceNumber"], .modal #sequenceNumber');
            if (await seqNum.isVisible({ timeout: 1000 })) {
                await seqNum.fill('1');
            }

            // Save step
            const saveBtn = page.locator('.modal button:has-text("Save"), .modal button:has-text("Add")').first();
            if (await saveBtn.isVisible({ timeout: 1000 })) {
                await saveBtn.click();
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'routing-step-saved');
            }
        }
    }, page, results, screenshots);

    // Test 13: Reorder steps (move up/down)
    await runTest('Routing - Reorder Steps', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click on first routing
        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for move up/down buttons
            const moveUpBtn = page.locator('button:has-text("Up"), button[aria-label*="up"], .move-up');
            const moveDownBtn = page.locator('button:has-text("Down"), button[aria-label*="down"], .move-down');

            if (await moveUpBtn.isVisible() || await moveDownBtn.isVisible()) {
                await screenshots.capture(page, 'routing-reorder-buttons');
            }
        }
    }, page, results, screenshots);

    // Test 14: Delete step
    await runTest('Routing - Delete Step', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Look for delete button on a step
            const deleteBtn = page.locator('.step-row button:has-text("Delete"), .step-item .btn-danger');
            if (await deleteBtn.isVisible()) {
                await screenshots.capture(page, 'routing-step-delete-button');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // ROUTING STATUS
    // ============================================

    // Test 15: Activate routing
    await runTest('Routing - Activate Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const activateBtn = page.locator('button:has-text("Activate")');
            if (await activateBtn.isVisible()) {
                await screenshots.capture(page, 'routing-activate-button');
            }
        }
    }, page, results, screenshots);

    // Test 16: Deactivate routing
    await runTest('Routing - Deactivate Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const deactivateBtn = page.locator('button:has-text("Deactivate")');
            if (await deactivateBtn.isVisible()) {
                await screenshots.capture(page, 'routing-deactivate-button');
            }
        }
    }, page, results, screenshots);

    // Test 17: Put routing on hold
    await runTest('Routing - Hold Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            const holdBtn = page.locator('button:has-text("Hold"), button:has-text("Put on Hold")');
            if (await holdBtn.isVisible()) {
                await screenshots.capture(page, 'routing-hold-button');
            }
        }
    }, page, results, screenshots);

    // Test 18: Status filter
    await runTest('Routing - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption('ACTIVE');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'routing-filter-active');
        }
    }, page, results, screenshots);

    // Test 19: Search routing
    await runTest('Routing - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const searchInput = page.locator('input[type="search"], input#search');
        if (await searchInput.isVisible()) {
            await searchInput.fill('Melt');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'routing-search');
        }
    }, page, results, screenshots);

    // ============================================
    // COMPLETE CRUD (with submit)
    // ============================================

    if (submitActions) {
        // Test 20: Create routing
        await runTest('Routing - Create Complete', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.routing;

            // Fill routing name
            const routingName = page.locator('input[formControlName="routingName"], #routingName');
            if (await routingName.isVisible()) {
                await routingName.fill(data.name);
            }

            // Select process
            const processSelect = page.locator('select[formControlName="processId"], #processId');
            if (await processSelect.isVisible()) {
                await processSelect.selectOption({ index: 1 });
            }

            // Select type
            const typeSelect = page.locator('select[formControlName="routingType"], #routingType');
            if (await typeSelect.isVisible()) {
                await typeSelect.selectOption('SEQUENTIAL');
            }

            // Add a step
            const addStepBtn = page.locator('button:has-text("Add Step")');
            if (await addStepBtn.isVisible()) {
                await addStepBtn.click();
                await page.waitForTimeout(500);

                const opName = page.locator('.modal input[formControlName="operationName"]');
                if (await opName.isVisible()) {
                    await opName.fill(data.step.operationName);
                }

                const opType = page.locator('.modal select[formControlName="operationType"]');
                if (await opType.isVisible()) {
                    await opType.selectOption({ index: 1 });
                }

                const saveStepBtn = page.locator('.modal button:has-text("Save")');
                if (await saveStepBtn.isVisible()) {
                    await saveStepBtn.click();
                    await page.waitForTimeout(500);
                }
            }

            await screenshots.capture(page, 'routing-create-filled');

            // Submit
            const submitBtn = page.locator('button[type="submit"]');
            if (await submitBtn.isEnabled()) {
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                await screenshots.capture(page, 'routing-create-success');
            }
        }, page, results, screenshots);

        // Test 21: Update routing
        await runTest('Routing - Update', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const editBtn = page.locator('button:has-text("Edit")');
                if (await editBtn.isVisible()) {
                    await editBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(500);

                    // Update name
                    const routingName = page.locator('input[formControlName="routingName"], #routingName');
                    if (await routingName.isVisible()) {
                        await routingName.fill('Updated E2E Routing');
                    }

                    await screenshots.capture(page, 'routing-update-filled');

                    const submitBtn = page.locator('button[type="submit"]');
                    if (await submitBtn.isEnabled()) {
                        await submitBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);
                        await screenshots.capture(page, 'routing-update-success');
                    }
                }
            }
        }, page, results, screenshots);

        // Test 22: Delete routing
        await runTest('Routing - Delete', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.ADMIN_ROUTING}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const lastRow = page.locator('table tbody tr').last();
            if (await lastRow.isVisible()) {
                await lastRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const deleteBtn = page.locator('button:has-text("Delete")').first();
                if (await deleteBtn.isVisible()) {
                    await deleteBtn.click();
                    await page.waitForTimeout(500);

                    // Confirm dialog
                    const confirmBtn = page.locator('.modal button:has-text("Confirm"), .modal button:has-text("Delete")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);
                        await screenshots.capture(page, 'routing-delete-success');
                    }
                }
            }
        }, page, results, screenshots);
    }

    console.log('\n✅ Routing CRUD tests finished');
}

module.exports = { runRoutingCrudTests };
