/**
 * Operation Templates CRUD Tests
 * Tests Operation Template Create/Read/Update/Delete operations
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runOperationTemplatesTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('🔧 OPERATION TEMPLATES TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // OPERATION TEMPLATES LIST
    // ============================================

    // Test 1: Templates list page
    await runTest('Operation Templates - List Page', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'operation-templates-list');

        // Verify page loaded
        const heading = page.locator('h1, h2, .page-title');
        if (await heading.isVisible()) {
            const text = await heading.textContent();
            if (!text.toLowerCase().includes('template') && !text.toLowerCase().includes('operation')) {
                console.log('   Warning: Page may not be operation templates list');
            }
        }

        const table = page.locator('table, .template-list');
        if (!await table.isVisible()) {
            console.log('   Warning: Template list/table not visible');
        }
    }, page, results, screenshots);

    // Test 2: New template button
    await runTest('Operation Templates - New Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Use more specific selector and first() to avoid multiple matches
        const newBtn = page.locator('button:has-text("New Template"), a:has-text("New Template"), button:has-text("+ New")').first();
        if (await newBtn.isVisible({ timeout: 2000 })) {
            await screenshots.capture(page, 'operation-templates-new-button');
        } else {
            // Fallback to any create/new button
            const fallbackBtn = page.locator('button:has-text("New"), button:has-text("Create")').first();
            if (await fallbackBtn.isVisible({ timeout: 2000 })) {
                await screenshots.capture(page, 'operation-templates-new-button');
            } else {
                console.log('   New template button not found - page may have different layout');
            }
        }
    }, page, results, screenshots);

    // Test 3: Navigate to create form
    await runTest('Operation Templates - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newBtn = page.locator('button:has-text("New"), a:has-text("New")');
        if (await newBtn.isVisible()) {
            await newBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'operation-templates-create-form');

            const form = page.locator('form');
            if (!await form.isVisible()) {
                throw new Error('Template create form not visible');
            }
        }
    }, page, results, screenshots);

    // Test 4: Form fields
    await runTest('Operation Templates - Form Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for required fields
        const opName = page.locator('input[formControlName="operationName"], #operationName, #name');
        const opCode = page.locator('input[formControlName="operationCode"], #operationCode, #code');
        const opType = page.locator('select[formControlName="operationType"], #operationType, #type');
        const qtyType = page.locator('select[formControlName="quantityType"], #quantityType');
        const duration = page.locator('input[formControlName="estimatedDurationMinutes"], #estimatedDurationMinutes, #duration');

        let fieldsFound = 0;
        if (await opName.isVisible()) fieldsFound++;
        if (await opCode.isVisible()) fieldsFound++;
        if (await opType.isVisible()) fieldsFound++;
        if (await qtyType.isVisible()) fieldsFound++;
        if (await duration.isVisible()) fieldsFound++;

        await screenshots.capture(page, 'operation-templates-form-fields');

        console.log(`   Found ${fieldsFound} form fields`);
    }, page, results, screenshots);

    // Test 5: Operation type dropdown
    await runTest('Operation Templates - Type Dropdown', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const opType = page.locator('select[formControlName="operationType"], #operationType, #type');
        if (await opType.isVisible()) {
            await opType.click();
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'operation-templates-type-dropdown');

            const options = await opType.locator('option').count();
            console.log(`   Found ${options} operation type options`);
        }
    }, page, results, screenshots);

    // Test 6: Quantity type dropdown
    await runTest('Operation Templates - Quantity Type Dropdown', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const qtyType = page.locator('select[formControlName="quantityType"], #quantityType');
        if (await qtyType.isVisible()) {
            await qtyType.click();
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'operation-templates-qty-type-dropdown');
        }
    }, page, results, screenshots);

    // Test 7: Equipment type field
    await runTest('Operation Templates - Equipment Type', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const equipType = page.locator('input[formControlName="defaultEquipmentType"], select[formControlName="defaultEquipmentType"], #defaultEquipmentType, #equipmentType');
        if (await equipType.isVisible()) {
            if (await equipType.evaluate(el => el.tagName === 'SELECT')) {
                await equipType.selectOption({ index: 1 });
            } else {
                await equipType.fill('FURNACE');
            }
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'operation-templates-equipment-type');
        }
    }, page, results, screenshots);

    // Test 8: Duration field
    await runTest('Operation Templates - Duration Field', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const duration = page.locator('input[formControlName="estimatedDurationMinutes"], #estimatedDurationMinutes, #duration');
        if (await duration.isVisible()) {
            await duration.fill('120');
            await page.waitForTimeout(300);
            await screenshots.capture(page, 'operation-templates-duration');
        }
    }, page, results, screenshots);

    // Test 9: Form validation
    await runTest('Operation Templates - Form Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check that submit button is disabled for empty form (proper validation)
        const submitBtn = page.locator('button[type="submit"]');
        if (await submitBtn.isVisible()) {
            const isDisabled = await submitBtn.isDisabled();
            await screenshots.capture(page, 'operation-templates-validation');

            if (isDisabled) {
                console.log('   Submit button correctly disabled for empty form');
            } else {
                // Try to click and check for errors
                await submitBtn.click();
                await page.waitForTimeout(300);
                const errors = page.locator('.error-message, .invalid-feedback, .text-danger');
                const errorCount = await errors.count();
                console.log(`   Found ${errorCount} validation error(s)`);
            }
        }
    }, page, results, screenshots);

    // ============================================
    // TEMPLATE STATUS
    // ============================================

    // Test 10: Status filter
    await runTest('Operation Templates - Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const statusFilter = page.locator('select#status, select[name="status"]');
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption('ACTIVE');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'operation-templates-filter-active');
        }
    }, page, results, screenshots);

    // Test 11: Search
    await runTest('Operation Templates - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const searchInput = page.locator('input[type="search"], input#search');
        if (await searchInput.isVisible()) {
            await searchInput.fill('Melt');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'operation-templates-search');
        }
    }, page, results, screenshots);

    // Test 12: View template detail
    await runTest('Operation Templates - View Detail', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible()) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'operation-templates-detail');
        }
    }, page, results, screenshots);

    // Test 13: Edit button
    await runTest('Operation Templates - Edit Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const editBtn = page.locator('table tbody tr button:has-text("Edit")').first();
        if (await editBtn.isVisible()) {
            await screenshots.capture(page, 'operation-templates-edit-button');
        } else {
            // Click row first, then look for edit button
            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const detailEditBtn = page.locator('button:has-text("Edit")');
                if (await detailEditBtn.isVisible()) {
                    await screenshots.capture(page, 'operation-templates-edit-button-detail');
                }
            }
        }
    }, page, results, screenshots);

    // Test 14: Activate/Deactivate buttons
    await runTest('Operation Templates - Status Actions', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const firstRow = page.locator('table tbody tr').first();
        if (await firstRow.isVisible({ timeout: 3000 })) {
            await firstRow.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            // Use first() to avoid strict mode violation with multiple buttons
            const activateBtn = page.locator('button:has-text("Activate")').first();
            const deactivateBtn = page.locator('button:has-text("Deactivate")').first();

            if (await activateBtn.isVisible({ timeout: 2000 }) || await deactivateBtn.isVisible({ timeout: 2000 })) {
                await screenshots.capture(page, 'operation-templates-status-actions');
                console.log('   Status action buttons found');
            } else {
                console.log('   No status action buttons visible on this template');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // COMPLETE CRUD (with submit)
    // ============================================

    if (submitActions) {
        // Test 15: Create template
        await runTest('Operation Templates - Create', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.operationTemplate;

            // Fill operation name
            const opName = page.locator('input[formControlName="operationName"], #operationName, #name');
            if (await opName.isVisible()) {
                await opName.fill(data.name);
            }

            // Fill operation code
            const opCode = page.locator('input[formControlName="operationCode"], #operationCode, #code');
            if (await opCode.isVisible()) {
                await opCode.fill(data.code);
            }

            // Select operation type
            const opType = page.locator('select[formControlName="operationType"], #operationType, #type');
            if (await opType.isVisible()) {
                await opType.selectOption({ index: 1 });
            }

            // Select quantity type
            const qtyType = page.locator('select[formControlName="quantityType"], #quantityType');
            if (await qtyType.isVisible()) {
                await qtyType.selectOption({ index: 1 });
            }

            // Fill equipment type
            const equipType = page.locator('input[formControlName="defaultEquipmentType"], #defaultEquipmentType, #equipmentType');
            if (await equipType.isVisible()) {
                await equipType.fill(data.equipmentType);
            }

            // Fill duration
            const duration = page.locator('input[formControlName="estimatedDurationMinutes"], #estimatedDurationMinutes, #duration');
            if (await duration.isVisible()) {
                await duration.fill(data.duration);
            }

            await screenshots.capture(page, 'operation-templates-create-filled');

            // Submit
            const submitBtn = page.locator('button[type="submit"]');
            if (await submitBtn.isEnabled()) {
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);
                await screenshots.capture(page, 'operation-templates-create-success');
            }
        }, page, results, screenshots);

        // Test 16: Update template
        await runTest('Operation Templates - Update', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Click on template to edit
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
                    const opName = page.locator('input[formControlName="operationName"], #operationName, #name');
                    if (await opName.isVisible()) {
                        await opName.fill(TEST_DATA.crud.operationTemplate.updatedName);
                    }

                    await screenshots.capture(page, 'operation-templates-update-filled');

                    // Submit
                    const submitBtn = page.locator('button[type="submit"]');
                    if (await submitBtn.isEnabled()) {
                        await submitBtn.click();
                        await page.waitForLoadState('networkidle');
                        await page.waitForTimeout(1000);
                        await screenshots.capture(page, 'operation-templates-update-success');
                    }
                }
            }
        }, page, results, screenshots);

        // Test 17: Delete template
        await runTest('Operation Templates - Delete', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Click on last template
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
                        await screenshots.capture(page, 'operation-templates-delete-success');
                    }
                }
            }
        }, page, results, screenshots);

        // Test 18: Activate template
        await runTest('Operation Templates - Activate', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}?status=INACTIVE`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const activateBtn = page.locator('button:has-text("Activate")');
                if (await activateBtn.isVisible()) {
                    await activateBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'operation-templates-activate-success');
                }
            }
        }, page, results, screenshots);

        // Test 19: Deactivate template
        await runTest('Operation Templates - Deactivate', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATES}?status=ACTIVE`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const firstRow = page.locator('table tbody tr').first();
            if (await firstRow.isVisible()) {
                await firstRow.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const deactivateBtn = page.locator('button:has-text("Deactivate")');
                if (await deactivateBtn.isVisible()) {
                    await deactivateBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                    await screenshots.capture(page, 'operation-templates-deactivate-success');
                }
            }
        }, page, results, screenshots);
    }

    console.log('\n✅ Operation templates tests finished');
}

module.exports = { runOperationTemplatesTests };
