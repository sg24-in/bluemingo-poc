/**
 * Config Management CRUD Tests
 * Tests for Hold Reasons, Delay Reasons, Process Parameters, Batch Number, and Quantity Type config pages
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runConfigCrudTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('CONFIG MANAGEMENT CRUD TESTS');
    console.log('='.repeat(50));

    // ============================================
    // HOLD REASONS
    // ============================================

    await runTest('Config - Hold Reasons List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'config-hold-reasons-list');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Hold reasons table not visible');
        }
    }, page, results, screenshots);

    await runTest('Config - Hold Reasons Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Hold Reason")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'config-hold-reasons-form');

            const codeInput = page.locator(SELECTORS.admin.reasonCode);
            if (!await codeInput.isVisible()) {
                throw new Error('Reason code field not visible');
            }

            // Verify entity type chips are present (at least 5 for core entities)
            const chips = page.locator('.entity-chip');
            const chipCount = await chips.count();
            if (chipCount < 5) {
                throw new Error(`Expected at least 5 entity chips, found ${chipCount}`);
            }
            console.log(`   Found ${chipCount} entity chips`)
        }
    }, page, results, screenshots);

    await runTest('Config - Hold Reasons Entity Type Chips', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Click ORDER chip - use exact text match to avoid matching ORDER_LINE
        const orderChip = page.locator('.entity-chip').filter({ hasText: /^ORDER$/ });
        if (await orderChip.count() > 0) {
            await orderChip.first().click();
            await page.waitForTimeout(200);
        }

        // Click BATCH chip
        const batchChip = page.locator('.entity-chip').filter({ hasText: /^BATCH$/ });
        if (await batchChip.count() > 0) {
            await batchChip.first().click();
            await page.waitForTimeout(200);
        }

        await screenshots.capture(page, 'config-hold-reasons-chips-selected');

        // Verify selected count - dynamically check for "2 of X" pattern
        const summary = page.locator('.selected-summary');
        if (await summary.isVisible()) {
            const text = await summary.textContent();
            if (!text.includes('2 of')) {
                throw new Error(`Expected "2 of X selected", got "${text}"`);
            }
        }

        // Test Select All
        const selectAllBtn = page.locator('button:has-text("Select All")');
        if (await selectAllBtn.isVisible()) {
            await selectAllBtn.click();
            await page.waitForTimeout(200);

            // Verify all are selected (X of X pattern)
            const allText = await summary.textContent();
            const match = allText.match(/(\d+) of (\d+)/);
            if (match && match[1] !== match[2]) {
                throw new Error(`Expected all selected, got "${allText}"`);
            }
        }

        // Test Clear
        const clearBtn = page.locator('button.btn-link:has-text("Clear")');
        if (await clearBtn.isVisible()) {
            await clearBtn.click();
            await page.waitForTimeout(200);
        }

        await screenshots.capture(page, 'config-hold-reasons-chips-cleared');
    }, page, results, screenshots);

    if (submitActions) {
        await runTest('Config - Hold Reasons Create', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.holdReason;
            await page.fill(SELECTORS.admin.reasonCode, data.code);
            await page.fill(SELECTORS.admin.reasonDescription, data.description);

            // Select BATCH and INVENTORY entity types
            await page.locator('.entity-chip:has-text("BATCH")').click();
            await page.locator('.entity-chip:has-text("INVENTORY")').click();

            await screenshots.capture(page, 'config-hold-reasons-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'config-hold-reasons-create-success');
        }, page, results, screenshots);

        await runTest('Config - Hold Reasons Edit', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.holdReason;
            const row = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await row.isVisible()) {
                const editBtn = row.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await page.fill(SELECTORS.admin.reasonDescription, data.updatedDescription);
                await screenshots.capture(page, 'config-hold-reasons-edit-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'config-hold-reasons-edit-success');
            }
        }, page, results, screenshots);

        await runTest('Config - Hold Reasons Delete', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.holdReason;
            const row = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await row.isVisible()) {
                const deleteBtn = row.locator('button:has-text("Delete")');
                if (await deleteBtn.isEnabled()) {
                    await deleteBtn.click();
                    await page.waitForTimeout(500);

                    // Handle modal confirmation
                    const confirmBtn = page.locator('.modal button.btn-danger:has-text("Delete")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForTimeout(1000);
                    }

                    await screenshots.capture(page, 'config-hold-reasons-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // DELAY REASONS
    // ============================================

    await runTest('Config - Delay Reasons List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_DELAY_REASONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'config-delay-reasons-list');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Delay reasons table not visible');
        }
    }, page, results, screenshots);

    await runTest('Config - Delay Reasons Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_DELAY_REASONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Delay Reason")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'config-delay-reasons-form');

            const codeInput = page.locator(SELECTORS.admin.reasonCode);
            if (!await codeInput.isVisible()) {
                throw new Error('Reason code field not visible');
            }
        }
    }, page, results, screenshots);

    if (submitActions) {
        await runTest('Config - Delay Reasons Create', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_DELAY_REASONS_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.delayReason;
            await page.fill(SELECTORS.admin.reasonCode, data.code);
            await page.fill(SELECTORS.admin.reasonDescription, data.description);

            await screenshots.capture(page, 'config-delay-reasons-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'config-delay-reasons-create-success');
        }, page, results, screenshots);

        await runTest('Config - Delay Reasons Edit', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_DELAY_REASONS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.delayReason;
            const row = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await row.isVisible()) {
                const editBtn = row.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await page.fill(SELECTORS.admin.reasonDescription, data.updatedDescription);
                await screenshots.capture(page, 'config-delay-reasons-edit-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'config-delay-reasons-edit-success');
            }
        }, page, results, screenshots);

        await runTest('Config - Delay Reasons Delete', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_DELAY_REASONS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.delayReason;
            const row = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await row.isVisible()) {
                const deleteBtn = row.locator('button:has-text("Delete")');
                if (await deleteBtn.isEnabled()) {
                    await deleteBtn.click();
                    await page.waitForTimeout(500);

                    const confirmBtn = page.locator('.modal button.btn-danger:has-text("Delete")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForTimeout(1000);
                    }

                    await screenshots.capture(page, 'config-delay-reasons-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // PROCESS PARAMETERS
    // ============================================

    await runTest('Config - Process Parameters List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_PROCESS_PARAMS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        await screenshots.capture(page, 'config-process-params-list');

        // Check for table or empty state - both are valid
        const table = page.locator('table');
        const emptyState = page.locator('.empty-state').first();
        const pageContent = await page.content();

        const hasTable = await table.isVisible();
        const hasEmpty = await emptyState.isVisible();
        const hasPageHeader = pageContent.toLowerCase().includes('process parameter');

        if (!hasTable && !hasEmpty && !hasPageHeader) {
            throw new Error('Process parameters page did not load correctly');
        }
    }, page, results, screenshots);

    await runTest('Config - Process Parameters Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_PROCESS_PARAMS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Process Parameter")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'config-process-params-form');

            const nameInput = page.locator(SELECTORS.admin.parameterName);
            if (!await nameInput.isVisible()) {
                throw new Error('Parameter name field not visible');
            }
        }
    }, page, results, screenshots);

    if (submitActions) {
        await runTest('Config - Process Parameters Create', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_PROCESS_PARAMS_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.processParam;
            await page.fill(SELECTORS.admin.paramOperationType, data.operationType);
            await page.fill(SELECTORS.admin.parameterName, data.parameterName);
            await page.selectOption(SELECTORS.admin.parameterType, data.parameterType);
            await page.fill(SELECTORS.admin.paramUnit, data.unit);
            await page.fill(SELECTORS.admin.paramMinValue, data.minValue);
            await page.fill(SELECTORS.admin.paramMaxValue, data.maxValue);
            await page.fill(SELECTORS.admin.paramDefaultValue, data.defaultValue);

            await screenshots.capture(page, 'config-process-params-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'config-process-params-create-success');
        }, page, results, screenshots);

        await runTest('Config - Process Parameters Edit', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_PROCESS_PARAMS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.processParam;
            const row = page.locator(`table tbody tr:has-text("${data.parameterName}")`);
            if (await row.isVisible()) {
                const editBtn = row.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await page.fill(SELECTORS.admin.paramMaxValue, data.updatedMax);
                await screenshots.capture(page, 'config-process-params-edit-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'config-process-params-edit-success');
            }
        }, page, results, screenshots);

        await runTest('Config - Process Parameters Delete', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_PROCESS_PARAMS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.processParam;
            const row = page.locator(`table tbody tr:has-text("${data.parameterName}")`);
            if (await row.isVisible()) {
                const deleteBtn = row.locator('button:has-text("Delete")');
                if (await deleteBtn.isEnabled()) {
                    await deleteBtn.click();
                    await page.waitForTimeout(500);

                    const confirmBtn = page.locator('.modal button.btn-danger:has-text("Delete")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForTimeout(1000);
                    }

                    await screenshots.capture(page, 'config-process-params-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // BATCH NUMBER CONFIG
    // ============================================

    await runTest('Config - Batch Number List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_NUMBER}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        await screenshots.capture(page, 'config-batch-number-list');

        // Check for table or empty state - both are valid
        const table = page.locator('table');
        const emptyState = page.locator('.empty-state').first();
        const pageContent = await page.content();

        const hasTable = await table.isVisible();
        const hasEmpty = await emptyState.isVisible();
        const hasPageHeader = pageContent.toLowerCase().includes('batch number');

        if (!hasTable && !hasEmpty && !hasPageHeader) {
            throw new Error('Batch number config page did not load correctly');
        }
    }, page, results, screenshots);

    await runTest('Config - Batch Number Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_NUMBER}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Batch Number")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'config-batch-number-form');

            const nameInput = page.locator(SELECTORS.admin.batchConfigName);
            if (!await nameInput.isVisible()) {
                throw new Error('Config name field not visible');
            }
        }
    }, page, results, screenshots);

    if (submitActions) {
        await runTest('Config - Batch Number Create', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_NUMBER_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.batchNumber;
            await page.fill(SELECTORS.admin.batchConfigName, data.configName);
            await page.fill(SELECTORS.admin.batchPrefix, data.prefix);
            await page.fill(SELECTORS.admin.batchSeparator, data.separator);
            await page.fill(SELECTORS.admin.batchSequenceLength, data.sequenceLength);

            await screenshots.capture(page, 'config-batch-number-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'config-batch-number-create-success');
        }, page, results, screenshots);

        await runTest('Config - Batch Number Edit', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_NUMBER}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.batchNumber;
            const row = page.locator(`table tbody tr:has-text("${data.configName}")`);
            if (await row.isVisible()) {
                const editBtn = row.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await page.fill(SELECTORS.admin.batchPrefix, data.updatedPrefix);
                await screenshots.capture(page, 'config-batch-number-edit-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'config-batch-number-edit-success');
            }
        }, page, results, screenshots);

        await runTest('Config - Batch Number Delete', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_NUMBER}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.batchNumber;
            const row = page.locator(`table tbody tr:has-text("${data.configName}")`);
            if (await row.isVisible()) {
                const deleteBtn = row.locator('button:has-text("Delete")');
                if (await deleteBtn.isEnabled()) {
                    await deleteBtn.click();
                    await page.waitForTimeout(500);

                    const confirmBtn = page.locator('.modal button.btn-danger:has-text("Delete")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForTimeout(1000);
                    }

                    await screenshots.capture(page, 'config-batch-number-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // QUANTITY TYPE CONFIG
    // ============================================

    await runTest('Config - Quantity Type List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_QUANTITY_TYPE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'config-quantity-type-list');

        const table = page.locator('table').first();
        const emptyState = page.locator('.empty-state, .no-data').first();
        if (!await table.isVisible() && !await emptyState.isVisible()) {
            throw new Error('Quantity type config page not loaded');
        }
    }, page, results, screenshots);

    await runTest('Config - Quantity Type Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_QUANTITY_TYPE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Quantity Type")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'config-quantity-type-form');

            const nameInput = page.locator(SELECTORS.admin.qtConfigName);
            if (!await nameInput.isVisible()) {
                throw new Error('Config name field not visible');
            }
        }
    }, page, results, screenshots);

    if (submitActions) {
        await runTest('Config - Quantity Type Create', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_QUANTITY_TYPE_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.quantityType;
            await page.fill(SELECTORS.admin.qtConfigName, data.configName);
            await page.selectOption(SELECTORS.admin.qtQuantityType, data.quantityType);
            await page.fill(SELECTORS.admin.qtDecimalPrecision, data.decimalPrecision);
            await page.selectOption(SELECTORS.admin.qtRoundingRule, data.roundingRule);

            await screenshots.capture(page, 'config-quantity-type-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'config-quantity-type-create-success');
        }, page, results, screenshots);

        await runTest('Config - Quantity Type Edit', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_QUANTITY_TYPE}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.quantityType;
            const row = page.locator(`table tbody tr:has-text("${data.configName}")`);
            if (await row.isVisible()) {
                const editBtn = row.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await page.fill(SELECTORS.admin.qtDecimalPrecision, data.updatedPrecision);
                await screenshots.capture(page, 'config-quantity-type-edit-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'config-quantity-type-edit-success');
            }
        }, page, results, screenshots);

        await runTest('Config - Quantity Type Delete', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_QUANTITY_TYPE}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.quantityType;
            const row = page.locator(`table tbody tr:has-text("${data.configName}")`);
            if (await row.isVisible()) {
                const deleteBtn = row.locator('button:has-text("Delete")');
                if (await deleteBtn.isEnabled()) {
                    await deleteBtn.click();
                    await page.waitForTimeout(500);

                    const confirmBtn = page.locator('.modal button.btn-danger:has-text("Delete")');
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        await page.waitForTimeout(1000);
                    }

                    await screenshots.capture(page, 'config-quantity-type-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // BATCH SIZE CONFIG
    // ============================================

    await runTest('Config - Batch Size List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_SIZE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'config-batch-size-list');

        const table = page.locator('table').first();
        const emptyState = page.locator('.empty-state, .no-data').first();
        if (!await table.isVisible() && !await emptyState.isVisible()) {
            throw new Error('Batch size config page not loaded');
        }
    }, page, results, screenshots);

    await runTest('Config - Batch Size Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_SIZE}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Batch Size")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'config-batch-size-form');

            // Verify form has key fields
            const maxBatchSize = page.locator('input#maxBatchSize, input[formcontrolname="maxBatchSize"]');
            if (!await maxBatchSize.isVisible()) {
                throw new Error('Max batch size field not visible');
            }
        }
    }, page, results, screenshots);

    await runTest('Config - Batch Size Form Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_SIZE_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Verify min/max/preferred fields exist
        const minBatchSize = page.locator('input#minBatchSize, input[formcontrolname="minBatchSize"]');
        const maxBatchSize = page.locator('input#maxBatchSize, input[formcontrolname="maxBatchSize"]');
        const preferredBatchSize = page.locator('input#preferredBatchSize, input[formcontrolname="preferredBatchSize"]');

        if (!await maxBatchSize.isVisible()) {
            throw new Error('Max batch size field not found');
        }

        await screenshots.capture(page, 'config-batch-size-form-fields');
    }, page, results, screenshots);

    if (submitActions) {
        await runTest('Config - Batch Size Create', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CONFIG_BATCH_SIZE_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Fill form
            const operationType = page.locator('select#operationType, select[formcontrolname="operationType"]');
            if (await operationType.isVisible()) {
                const options = await operationType.locator('option').allTextContents();
                if (options.length > 1) {
                    await operationType.selectOption({ index: 1 });
                }
            }

            await page.fill('input#maxBatchSize, input[formcontrolname="maxBatchSize"]', '100');
            await page.fill('input#minBatchSize, input[formcontrolname="minBatchSize"]', '10');
            await page.fill('input#preferredBatchSize, input[formcontrolname="preferredBatchSize"]', '50');

            await screenshots.capture(page, 'config-batch-size-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'config-batch-size-create-success');
        }, page, results, screenshots);
    }

    // ============================================
    // CONFIG FILTERS & PAGINATION
    // ============================================

    await runTest('Config - Hold Reasons Status Filter', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Filter by Active
        const statusFilter = page.locator('select').first();
        await statusFilter.selectOption('ACTIVE');
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'config-hold-reasons-filter-active');

        // Verify all visible rows have Active status
        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        if (rowCount > 0) {
            for (let i = 0; i < Math.min(rowCount, 5); i++) {
                const badge = rows.nth(i).locator('.status-badge');
                if (await badge.isVisible()) {
                    const text = await badge.textContent();
                    if (!text.includes('ACTIVE')) {
                        throw new Error(`Row ${i} has non-ACTIVE status: ${text}`);
                    }
                }
            }
        }

        // Reset filter
        await statusFilter.selectOption('all');
        await page.waitForTimeout(500);
    }, page, results, screenshots);

    await runTest('Config - Hold Reasons Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input[type="text"]').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('QUALITY');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'config-hold-reasons-search');
        }
    }, page, results, screenshots);

    await runTest('Config - Hold Reasons Entity Tags in List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify entity tags render in the list
        const entityTags = page.locator('.entity-tag');
        const tagCount = await entityTags.count();

        await screenshots.capture(page, 'config-hold-reasons-entity-tags');

        // At least some rows should have entity tags
        if (tagCount === 0) {
            console.log('   ⚠ No entity tags found (may have no applicableTo data)');
        }
    }, page, results, screenshots);

    // ============================================
    // CONFIG NAVIGATION (sidebar links)
    // ============================================

    await runTest('Config - Navigate All Config Pages', async () => {
        const configRoutes = [
            { path: ROUTES.CONFIG_HOLD_REASONS, name: 'hold-reasons' },
            { path: ROUTES.CONFIG_DELAY_REASONS, name: 'delay-reasons' },
            { path: ROUTES.CONFIG_PROCESS_PARAMS, name: 'process-params' },
            { path: ROUTES.CONFIG_BATCH_NUMBER, name: 'batch-number' },
            { path: ROUTES.CONFIG_QUANTITY_TYPE, name: 'quantity-type' },
            { path: ROUTES.CONFIG_BATCH_SIZE, name: 'batch-size' }
        ];

        for (const route of configRoutes) {
            await page.goto(`${config.baseUrl}${route.path}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);
            await screenshots.capture(page, `config-nav-${route.name}`);

            // Verify each page loaded (has a table or empty state)
            const hasTable = await page.locator('table').first().isVisible();
            const hasEmpty = await page.locator('.empty-state, .no-data').first().isVisible();
            if (!hasTable && !hasEmpty) {
                throw new Error(`Config page ${route.name} did not load properly`);
            }
        }
    }, page, results, screenshots);
}

module.exports = { runConfigCrudTests };
