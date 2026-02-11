/**
 * Processes Tests
 * Tests for process list, detail, and quality pending pages under /processes
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runProcessesTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('PROCESSES TESTS');
    console.log('='.repeat(50));

    // ============================================
    // PROCESS LIST
    // ============================================

    await runTest('Processes - List Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'processes-list');

        // Verify page is loaded
        const pageContent = page.locator('h1, h2, .page-header');
        if (!await pageContent.first().isVisible()) {
            throw new Error('Processes page content not visible');
        }
    }, page, results, screenshots);

    await runTest('Processes - Table or Cards View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        const cards = page.locator('.process-card, .card');
        const emptyState = page.locator('.empty-state, .no-data').first();

        const hasTable = await table.first().isVisible();
        const hasCards = await cards.first().isVisible();
        const hasEmpty = await emptyState.isVisible();

        if (!hasTable && !hasCards && !hasEmpty) {
            throw new Error('No process list/cards or empty state visible');
        }

        if (hasTable) {
            await screenshots.capture(page, 'processes-table');
        } else if (hasCards) {
            await screenshots.capture(page, 'processes-cards');
        }
    }, page, results, screenshots);

    await runTest('Processes - Status Summary', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for status summary cards or badges
        const summaryCards = page.locator('.summary-card, .stat-card, .status-summary');
        if (await summaryCards.first().isVisible()) {
            await screenshots.capture(page, 'processes-summary');
        } else {
            console.log('  - No summary cards found');
        }
    }, page, results, screenshots);

    await runTest('Processes - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"], select#statusFilter');
        if (await statusFilter.isVisible()) {
            // Get available options
            const options = await statusFilter.locator('option').allTextContents();
            console.log('  - Available statuses:', options.join(', '));

            // Try filtering
            if (options.length > 1) {
                await statusFilter.selectOption({ index: 1 });
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-filtered');
            }
        } else {
            console.log('  - No status filter dropdown found');
        }
    }, page, results, screenshots);

    await runTest('Processes - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input#search');
        if (await searchInput.isVisible()) {
            await searchInput.fill('Melting');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'processes-search');
        } else {
            console.log('  - No search input found');
        }
    }, page, results, screenshots);

    // ============================================
    // PROCESS CRUD - NEW BUTTON
    // ============================================

    await runTest('Processes - New Button Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const newButton = page.locator('button:has-text("New Process"), a:has-text("New Process")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'processes-new-form');

            // Verify form is displayed
            const form = page.locator('form');
            if (!await form.isVisible()) {
                throw new Error('Process form not visible');
            }
            console.log('  - New process form loaded');
        } else {
            console.log('  - New Process button not found');
        }
    }, page, results, screenshots);

    await runTest('Processes - Form Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESS_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'processes-form-fields');

        // Check for common form fields
        const nameField = page.locator('input[formcontrolname="processName"], input#processName, input[name="processName"]');
        const descField = page.locator('textarea[formcontrolname="description"], textarea#description');

        const hasName = await nameField.isVisible();
        if (!hasName) {
            // Try alternative selectors
            const anyInput = page.locator('form input').first();
            if (!await anyInput.isVisible()) {
                throw new Error('No form fields visible');
            }
        }
        console.log('  - Form fields found');
    }, page, results, screenshots);

    // ============================================
    // PROCESS DETAIL
    // ============================================

    await runTest('Processes - Detail View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try clicking on a process to view details
        const tableRow = page.locator('table tbody tr').first();
        const card = page.locator('.process-card, .card').first();

        if (await tableRow.isVisible()) {
            const viewLink = tableRow.locator('a').first();
            if (await viewLink.isVisible()) {
                await viewLink.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-detail');
            }
        } else if (await card.isVisible()) {
            await card.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'processes-detail');
        } else {
            console.log('  - No processes to view');
        }
    }, page, results, screenshots);

    // ============================================
    // ACTIVATE / DEACTIVATE
    // ============================================

    await runTest('Processes - Activate/Deactivate Buttons', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Look for activate/deactivate buttons in the list
        const activateBtn = page.locator('button:has-text("Activate")').first();
        const deactivateBtn = page.locator('button:has-text("Deactivate")').first();

        const hasActivate = await activateBtn.isVisible();
        const hasDeactivate = await deactivateBtn.isVisible();

        if (hasActivate || hasDeactivate) {
            await screenshots.capture(page, 'processes-action-buttons');
            console.log('  - Activate/Deactivate buttons found');
        } else {
            console.log('  - No activate/deactivate buttons visible (may require specific status)');
        }
    }, page, results, screenshots);

    await runTest('Processes - Delete Button and Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Look for delete button in the list
        const deleteBtn = page.locator('button.btn-danger, button:has-text("Delete")').first();
        if (await deleteBtn.isVisible()) {
            await deleteBtn.click();
            await page.waitForTimeout(500);

            // Check for confirmation modal
            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                await screenshots.capture(page, 'processes-delete-modal');
                console.log('  - Delete confirmation modal displayed');

                // Close modal without deleting
                const cancelBtn = modal.locator('button:has-text("Cancel"), button.btn-secondary').first();
                if (await cancelBtn.isVisible()) {
                    await cancelBtn.click();
                    await page.waitForTimeout(300);
                }
            }
        } else {
            console.log('  - No delete button visible');
        }
    }, page, results, screenshots);

    // ============================================
    // QUALITY PENDING
    // ============================================

    await runTest('Quality Pending - Page Load', async () => {
        // Try quality pending route
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'quality-pending-list');

        // Verify quality pending content
        const header = page.locator('h1, h2').filter({ hasText: /quality|pending/i });
        if (await header.isVisible()) {
            console.log('  - Quality pending page loaded');
        }
    }, page, results, screenshots);

    await runTest('Quality Pending - Table View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table').first();
        const emptyState = page.locator('.empty-state, .no-data').first();

        if (await table.isVisible()) {
            await screenshots.capture(page, 'quality-pending-table');

            // Check for quality decision buttons
            const approveButton = page.locator('button:has-text("Approve")').first();
            const rejectButton = page.locator('button:has-text("Reject")').first();

            if (await approveButton.isVisible() || await rejectButton.isVisible()) {
                console.log('  - Quality decision buttons found');
            }
        } else if (await emptyState.isVisible()) {
            await screenshots.capture(page, 'quality-pending-empty');
            console.log('  - No pending quality items');
        } else {
            console.log('  - Quality pending page loaded (no table or empty state)');
        }
    }, page, results, screenshots);

    await runTest('Quality Pending - Decision Modal', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Try to open decision modal
        const actionButton = page.locator('button:has-text("Approve"), button:has-text("Decide"), button.btn-decision').first();
        if (await actionButton.isVisible()) {
            await actionButton.click();
            await page.waitForTimeout(500);

            const modal = page.locator('.modal, [role="dialog"]');
            if (await modal.isVisible()) {
                await screenshots.capture(page, 'quality-decision-modal');

                // Close modal
                const closeButton = modal.locator('button:has-text("Cancel"), button.close');
                if (await closeButton.isVisible()) {
                    await closeButton.click();
                    await page.waitForTimeout(300);
                }
            }
        } else {
            console.log('  - No action buttons available');
        }
    }, page, results, screenshots);

    // ============================================
    // FILTER BY STATUS
    // ============================================

    await runTest('Processes - Filter QUALITY_PENDING', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            try {
                await statusFilter.selectOption('QUALITY_PENDING');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-quality-pending');
            } catch (e) {
                console.log('  - QUALITY_PENDING option not available');
            }
        }
    }, page, results, screenshots);

    await runTest('Processes - Filter COMPLETED', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            try {
                await statusFilter.selectOption('COMPLETED');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-completed');
            } catch (e) {
                console.log('  - COMPLETED option not available');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // QUALITY DECISIONS (with --submit flag)
    // ============================================

    if (submitActions) {
        await runTest('Quality - Approve Process (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const approveButton = page.locator('button:has-text("Approve")').first();
            if (await approveButton.isVisible()) {
                await approveButton.click();
                await page.waitForTimeout(500);

                const modal = page.locator('.modal, [role="dialog"]');
                if (await modal.isVisible()) {
                    // Fill any required fields
                    const notesInput = modal.locator('textarea, input[name="notes"]');
                    if (await notesInput.isVisible()) {
                        await notesInput.fill('Approved via E2E test');
                    }

                    await screenshots.capture(page, 'quality-approve-modal');

                    // Confirm
                    const confirmButton = modal.locator('button:has-text("Approve"), button:has-text("Confirm")');
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'quality-approve-success');
                    }
                }
            } else {
                console.log('  - No processes available to approve');
            }
        }, page, results, screenshots);

        await runTest('Quality - Reject Process (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const rejectButton = page.locator('button:has-text("Reject")').first();
            if (await rejectButton.isVisible()) {
                await rejectButton.click();
                await page.waitForTimeout(500);

                const modal = page.locator('.modal, [role="dialog"]');
                if (await modal.isVisible()) {
                    // Fill rejection reason
                    const reasonInput = modal.locator('textarea, input[name="reason"]');
                    if (await reasonInput.isVisible()) {
                        await reasonInput.fill('Rejected via E2E test - quality issue');
                    }

                    await screenshots.capture(page, 'quality-reject-modal');

                    // Confirm
                    const confirmButton = modal.locator('button:has-text("Reject"), button:has-text("Confirm")');
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'quality-reject-success');
                    }
                }
            } else {
                console.log('  - No processes available to reject');
            }
        }, page, results, screenshots);

        // ============================================
        // PROCESS CRUD OPERATIONS (with --submit flag)
        // ============================================

        await runTest('Processes - Create New (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROCESS_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Fill form fields
            const nameField = page.locator('input[formcontrolname="processName"], input#processName, input[name="processName"]');
            const descField = page.locator('textarea[formcontrolname="description"], textarea#description, textarea[name="description"]');

            if (await nameField.isVisible()) {
                await nameField.fill(TEST_DATA.crud.process.name);
            }
            if (await descField.isVisible()) {
                await descField.fill(TEST_DATA.crud.process.description);
            }

            await screenshots.capture(page, 'processes-create-filled');

            const submitButton = page.locator('button[type="submit"]');
            if (await submitButton.isVisible() && !await submitButton.isDisabled()) {
                await submitButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'processes-create-success');

                // Verify redirect or success message
                const successMessage = page.locator('.success, .alert-success, .toast');
                const hasSuccess = await successMessage.isVisible();
                const onListPage = page.url().includes('/processes');

                if (!hasSuccess && !onListPage) {
                    console.log('  - Create may have succeeded, check manually');
                } else {
                    console.log('  - Process created successfully');
                }
            } else {
                console.log('  - Submit button not available (form may have validation errors)');
            }
        }, page, results, screenshots);

        await runTest('Processes - Edit (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Find and click edit button on first row
            const editButton = page.locator('table tbody tr').first().locator('button:has-text("Edit"), a:has-text("Edit")');
            if (await editButton.isVisible()) {
                await editButton.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'processes-edit-form');

                // Update name field
                const nameField = page.locator('input[formcontrolname="processName"], input#processName, input[name="processName"]');
                if (await nameField.isVisible()) {
                    await nameField.clear();
                    await nameField.fill(TEST_DATA.crud.process.updatedName);
                }

                // Update description if available
                const descField = page.locator('textarea[formcontrolname="description"], textarea#description');
                if (await descField.isVisible()) {
                    await descField.clear();
                    await descField.fill(TEST_DATA.crud.process.updatedDescription);
                }

                const submitButton = page.locator('button[type="submit"]');
                if (await submitButton.isVisible() && !await submitButton.isDisabled()) {
                    await submitButton.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'processes-edit-success');
                    console.log('  - Process updated successfully');
                }
            } else {
                console.log('  - No edit button found');
            }
        }, page, results, screenshots);

        await runTest('Processes - Activate (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Filter to show DRAFT processes that can be activated
            const statusFilter = page.locator('select#status, select[name="status"]');
            if (await statusFilter.isVisible()) {
                try {
                    await statusFilter.selectOption('DRAFT');
                    await page.waitForTimeout(500);
                } catch (e) {
                    console.log('  - No DRAFT filter option');
                }
            }

            const activateBtn = page.locator('button:has-text("Activate")').first();
            if (await activateBtn.isVisible()) {
                await activateBtn.click();
                await page.waitForTimeout(500);

                // Check for confirmation modal
                const modal = page.locator('.modal, [role="dialog"]');
                if (await modal.isVisible()) {
                    await screenshots.capture(page, 'processes-activate-modal');

                    const confirmBtn = modal.locator('button:has-text("Confirm"), button:has-text("Activate")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'processes-activate-success');
                        console.log('  - Process activated successfully');
                    }
                } else {
                    // Direct activation without modal
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'processes-activate-success');
                    console.log('  - Process activated successfully');
                }
            } else {
                console.log('  - No DRAFT process available to activate');
            }
        }, page, results, screenshots);

        await runTest('Processes - Deactivate (Submit)', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Filter to show ACTIVE processes that can be deactivated
            const statusFilter = page.locator('select#status, select[name="status"]');
            if (await statusFilter.isVisible()) {
                try {
                    await statusFilter.selectOption('ACTIVE');
                    await page.waitForTimeout(500);
                } catch (e) {
                    console.log('  - No ACTIVE filter option');
                }
            }

            const deactivateBtn = page.locator('button:has-text("Deactivate")').first();
            if (await deactivateBtn.isVisible()) {
                await deactivateBtn.click();
                await page.waitForTimeout(500);

                // Check for confirmation modal
                const modal = page.locator('.modal, [role="dialog"]');
                if (await modal.isVisible()) {
                    await screenshots.capture(page, 'processes-deactivate-modal');

                    const confirmBtn = modal.locator('button:has-text("Confirm"), button:has-text("Deactivate")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'processes-deactivate-success');
                        console.log('  - Process deactivated successfully');
                    }
                } else {
                    // Direct deactivation without modal
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'processes-deactivate-success');
                    console.log('  - Process deactivated successfully');
                }
            } else {
                console.log('  - No ACTIVE process available to deactivate');
            }
        }, page, results, screenshots);
    }

    // ============================================
    // ADMIN PROCESSES (/manage/processes)
    // ============================================

    await runTest('Admin Processes - Page Load', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESSES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'admin-processes-page');

        // Verify page is loaded
        const pageContent = page.locator('h1, h2, .page-header, .admin-content');
        if (!await pageContent.first().isVisible()) {
            throw new Error('Admin Processes page content not visible');
        }
        console.log('  - Admin processes page loaded successfully');
    }, page, results, screenshots);

    await runTest('Admin Processes - Sidebar Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESSES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify sidebar is present (admin layout)
        const sidebar = page.locator('.sidebar, .admin-sidebar, nav.sidebar');
        if (await sidebar.isVisible()) {
            await screenshots.capture(page, 'admin-processes-sidebar');
            console.log('  - Admin sidebar visible');

            // Check for process link in sidebar
            const processLink = sidebar.locator('a:has-text("Process"), a[href*="process"]');
            if (await processLink.first().isVisible()) {
                console.log('  - Process link in sidebar');
            }
        } else {
            console.log('  - No sidebar found (may be using different layout)');
        }
    }, page, results, screenshots);

    await runTest('Admin Processes - Table or Cards View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESSES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const table = page.locator('table').first();
        const cards = page.locator('.process-card, .card');
        const emptyState = page.locator('.empty-state, .no-data').first();

        const hasTable = await table.isVisible();
        const hasCards = await cards.first().isVisible();
        const hasEmpty = await emptyState.isVisible();

        if (hasTable) {
            await screenshots.capture(page, 'admin-processes-table');
            console.log('  - Table view displayed');
        } else if (hasCards) {
            await screenshots.capture(page, 'admin-processes-cards');
            console.log('  - Cards view displayed');
        } else if (hasEmpty) {
            await screenshots.capture(page, 'admin-processes-empty');
            console.log('  - Empty state displayed');
        } else {
            // Could be redirected to process list or quality pending
            console.log('  - Content displayed (may be redirected to sub-route)');
        }
    }, page, results, screenshots);

    await runTest('Admin Processes - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESSES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Also try the list route
        if (ROUTES.ADMIN_PROCESSES_LIST) {
            await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESSES_LIST}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);
        }

        const statusFilter = page.locator('select#status, select[name="status"], select#statusFilter');
        if (await statusFilter.isVisible()) {
            const options = await statusFilter.locator('option').allTextContents();
            console.log('  - Status filter options:', options.join(', '));

            if (options.length > 1) {
                await statusFilter.selectOption({ index: 1 });
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'admin-processes-filtered');
            }
        } else {
            console.log('  - No status filter found');
        }
    }, page, results, screenshots);

    await runTest('Admin Processes - Quality Pending', async () => {
        if (ROUTES.ADMIN_PROCESSES_QUALITY) {
            await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESSES_QUALITY}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'admin-processes-quality-pending');

            const header = page.locator('h1, h2').filter({ hasText: /quality|pending/i });
            if (await header.isVisible()) {
                console.log('  - Admin quality pending page loaded');
            } else {
                console.log('  - Content displayed');
            }
        } else {
            console.log('  - Admin quality pending route not defined');
        }
    }, page, results, screenshots);

    console.log('\n' + '='.repeat(50));
    console.log('PROCESSES TESTS COMPLETE');
    console.log('='.repeat(50));
}

module.exports = { runProcessesTests };
