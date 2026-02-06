/**
 * Entity CRUD Tests for Equipment, Inventory, and Batch
 * Tests Create/Read/Update/Delete operations for non-admin entities
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runEntityCrudTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('ENTITY CRUD TESTS (Equipment, Inventory, Batch)');
    console.log('='.repeat(50));

    // ============================================
    // EQUIPMENT CRUD
    // ============================================

    // Test 1: Equipment list view
    await runTest('Equipment - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'equipment-crud-list');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Equipment table not visible');
        }
    }, page, results, screenshots);

    // Test 2: Equipment - Navigate to Create form
    await runTest('Equipment - Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Equipment")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'equipment-create-form');

            const codeInput = page.locator(SELECTORS.admin.equipmentCode);
            if (!await codeInput.isVisible()) {
                throw new Error('Equipment code field not visible');
            }
        }
    }, page, results, screenshots);

    // Test 3: Equipment - Create, Edit, Delete (with submit)
    if (submitActions) {
        await runTest('Equipment - Create Equipment', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.equipment;

            await page.fill(SELECTORS.admin.equipmentCode, data.code);
            await page.fill(SELECTORS.admin.equipmentName, data.name);
            await page.selectOption(SELECTORS.admin.equipmentType, data.type);
            await page.fill(SELECTORS.admin.capacity, data.capacity);
            await page.fill(SELECTORS.admin.capacityUnit, data.capacityUnit);

            // Fill location if field exists
            const locationField = page.locator('#location');
            if (await locationField.isVisible()) {
                await locationField.fill(data.location);
            }

            await screenshots.capture(page, 'equipment-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'equipment-create-success');
        }, page, results, screenshots);

        await runTest('Equipment - Edit Equipment', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.equipment;
            const row = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await row.isVisible()) {
                const editBtn = row.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await page.fill(SELECTORS.admin.equipmentName, data.updatedName);
                await screenshots.capture(page, 'equipment-edit-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'equipment-edit-success');
            }
        }, page, results, screenshots);

        await runTest('Equipment - Delete Equipment', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.equipment;
            const row = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await row.isVisible()) {
                // Handle confirm dialog
                page.on('dialog', async dialog => {
                    await dialog.accept();
                });

                const deleteBtn = row.locator('button:has-text("Delete")');
                await deleteBtn.click();
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'equipment-delete-success');
            }
        }, page, results, screenshots);
    }

    // ============================================
    // INVENTORY CRUD
    // ============================================

    // Test 4: Inventory list view
    await runTest('Inventory - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'inventory-crud-list');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Inventory table not visible');
        }
    }, page, results, screenshots);

    // Test 5: Inventory - Navigate to Create form
    await runTest('Inventory - Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Inventory")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'inventory-create-form');

            const materialIdInput = page.locator(SELECTORS.admin.inventoryMaterialId);
            if (!await materialIdInput.isVisible()) {
                throw new Error('Material ID field not visible');
            }
        }
    }, page, results, screenshots);

    // Test 6: Inventory - Create, Edit, Delete (with submit)
    if (submitActions) {
        await runTest('Inventory - Create Inventory', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.INVENTORY_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.inventory;

            await page.fill(SELECTORS.admin.inventoryMaterialId, data.materialId);
            await page.fill(SELECTORS.admin.inventoryMaterialName, data.materialName);
            await page.selectOption(SELECTORS.admin.inventoryType, data.type);
            await page.fill(SELECTORS.admin.inventoryQuantity, data.quantity);
            await page.fill(SELECTORS.admin.inventoryUnit, data.unit);
            await page.fill(SELECTORS.admin.inventoryLocation, data.location);

            await screenshots.capture(page, 'inventory-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'inventory-create-success');
        }, page, results, screenshots);

        await runTest('Inventory - Edit Inventory', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.inventory;
            const row = page.locator(`table tbody tr:has-text("${data.materialId}")`);
            if (await row.isVisible()) {
                const editBtn = row.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await page.fill(SELECTORS.admin.inventoryQuantity, data.updatedQuantity);
                await screenshots.capture(page, 'inventory-edit-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'inventory-edit-success');
            }
        }, page, results, screenshots);

        await runTest('Inventory - Delete Inventory', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.inventory;
            const row = page.locator(`table tbody tr:has-text("${data.materialId}")`);
            if (await row.isVisible()) {
                page.on('dialog', async dialog => {
                    await dialog.accept();
                });

                const deleteBtn = row.locator('button:has-text("Delete")');
                await deleteBtn.click();
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'inventory-delete-success');
            }
        }, page, results, screenshots);
    }

    // ============================================
    // BATCH CRUD
    // ============================================

    // Test 7: Batch list view
    await runTest('Batch - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'batch-crud-list');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Batch table not visible');
        }
    }, page, results, screenshots);

    // Test 8: Batch - Navigate to Create form
    await runTest('Batch - Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Batch")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'batch-create-form');

            const batchNumberInput = page.locator(SELECTORS.admin.batchNumber);
            if (!await batchNumberInput.isVisible()) {
                throw new Error('Batch number field not visible');
            }
        }
    }, page, results, screenshots);

    // Test 9: Batch - Create, Edit, Delete (with submit)
    if (submitActions) {
        await runTest('Batch - Create Batch', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BATCH_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.batch;

            await page.fill(SELECTORS.admin.batchNumber, data.batchNumber);
            await page.fill(SELECTORS.admin.batchMaterialId, data.materialId);
            await page.fill(SELECTORS.admin.batchMaterialName, data.materialName);
            await page.fill(SELECTORS.admin.batchQuantity, data.quantity);
            await page.fill(SELECTORS.admin.batchUnit, data.unit);

            await screenshots.capture(page, 'batch-create-filled');

            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'batch-create-success');
        }, page, results, screenshots);

        await runTest('Batch - Edit Batch', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.batch;
            const row = page.locator(`table tbody tr:has-text("${data.batchNumber}")`);
            if (await row.isVisible()) {
                const editBtn = row.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await page.fill(SELECTORS.admin.batchQuantity, data.updatedQuantity);
                await screenshots.capture(page, 'batch-edit-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'batch-edit-success');
            }
        }, page, results, screenshots);

        await runTest('Batch - Delete Batch', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.batch;
            const row = page.locator(`table tbody tr:has-text("${data.batchNumber}")`);
            if (await row.isVisible()) {
                page.on('dialog', async dialog => {
                    await dialog.accept();
                });

                const deleteBtn = row.locator('button:has-text("Delete")');
                await deleteBtn.click();
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'batch-delete-success');
            }
        }, page, results, screenshots);
    }
}

module.exports = { runEntityCrudTests };
