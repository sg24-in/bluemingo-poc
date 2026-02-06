/**
 * BOM CRUD Tests
 * Tests Bill of Materials list, tree view, and node create/edit/delete flows
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runBomCrudTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('BOM CRUD TESTS');
    console.log('='.repeat(50));

    // ============================================
    // BOM LIST VIEW
    // ============================================

    // Test 1: BOM products list view
    await runTest('BOM - Products List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'bom-products-list');

        // Check for product cards or empty state
        const productCards = page.locator('.product-card');
        const emptyState = page.locator('.empty-state');
        const cardsVisible = await productCards.first().isVisible().catch(() => false);
        const emptyVisible = await emptyState.isVisible().catch(() => false);

        if (!cardsVisible && !emptyVisible) {
            throw new Error('Neither product cards nor empty state visible');
        }
    }, page, results, screenshots);

    // Test 2: BOM - New BOM button visible
    await runTest('BOM - New BOM Button', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New BOM")');
        if (!await newButton.isVisible()) {
            throw new Error('New BOM button not visible');
        }

        await screenshots.capture(page, 'bom-new-button');
    }, page, results, screenshots);

    // Test 3: BOM - View Tree Navigation
    await runTest('BOM - View Tree Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const viewTreeBtn = page.locator('button:has-text("View Tree")').first();
        if (await viewTreeBtn.isVisible()) {
            // Get product SKU from the card
            const card = viewTreeBtn.locator('xpath=ancestor::div[contains(@class,"product-card")]');
            const skuText = await card.locator('h3').textContent().catch(() => null);

            await viewTreeBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'bom-tree-view');

            // Verify tree page loaded
            const treeHeader = page.locator('h1:has-text("BOM Tree")');
            if (!await treeHeader.isVisible()) {
                throw new Error('BOM Tree page did not load');
            }
        } else {
            console.log('   No products with BOMs to view tree');
        }
    }, page, results, screenshots);

    // Test 4: BOM Tree - Expand/Collapse
    await runTest('BOM - Tree Expand/Collapse', async () => {
        // Navigate to first product's tree
        await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const viewTreeBtn = page.locator('button:has-text("View Tree")').first();
        if (await viewTreeBtn.isVisible()) {
            await viewTreeBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Try expand all
            const expandBtn = page.locator('button:has-text("Expand All")');
            if (await expandBtn.isVisible()) {
                await expandBtn.click();
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'bom-tree-expanded');
            }

            // Try collapse all
            const collapseBtn = page.locator('button:has-text("Collapse All")');
            if (await collapseBtn.isVisible()) {
                await collapseBtn.click();
                await page.waitForTimeout(500);
                await screenshots.capture(page, 'bom-tree-collapsed');
            }
        } else {
            console.log('   No products with BOMs to test expand/collapse');
        }
    }, page, results, screenshots);

    // Test 5: BOM - Flow Chart Visible
    await runTest('BOM - Flow Chart Visualization', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const viewTreeBtn = page.locator('button:has-text("View Tree")').first();
        if (await viewTreeBtn.isVisible()) {
            await viewTreeBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1500);

            // Check for BOM Flow section
            const flowSection = page.locator('.bom-flow-section');
            const flowVisible = await flowSection.isVisible().catch(() => false);

            await screenshots.capture(page, 'bom-flow-chart');

            if (flowVisible) {
                console.log('   BOM Flow chart section visible');
            }
        }
    }, page, results, screenshots);

    // Test 6: BOM - Navigate to Add Node form
    await runTest('BOM - Add Node Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const viewTreeBtn = page.locator('button:has-text("View Tree")').first();
        if (await viewTreeBtn.isVisible()) {
            await viewTreeBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const addNodeBtn = page.locator('button:has-text("Add Node")');
            if (await addNodeBtn.isVisible()) {
                await addNodeBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'bom-add-node-form');

                // Check for form fields
                const materialIdField = page.locator(SELECTORS.admin.bomMaterialId);
                if (!await materialIdField.isVisible()) {
                    throw new Error('Material ID field not visible in BOM node form');
                }
            }
        }
    }, page, results, screenshots);

    // Test 7: BOM - New BOM form (product selection)
    await runTest('BOM - New BOM Form with Product Selection', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newBomBtn = page.locator('button:has-text("New BOM")');
        if (await newBomBtn.isVisible()) {
            await newBomBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'bom-new-form');

            // Should show product selection dropdown
            const productSelect = page.locator(SELECTORS.admin.bomProductSelect);
            if (!await productSelect.isVisible()) {
                throw new Error('Product selection dropdown not visible for new BOM');
            }
        }
    }, page, results, screenshots);

    // ============================================
    // BOM CRUD OPERATIONS (with submit)
    // ============================================

    if (submitActions) {
        // Test 8: BOM - Create Node
        await runTest('BOM - Create Node', async () => {
            // Navigate to first product's tree and add a node
            await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const viewTreeBtn = page.locator('button:has-text("View Tree")').first();
            if (await viewTreeBtn.isVisible()) {
                await viewTreeBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                const addNodeBtn = page.locator('button:has-text("Add Node")');
                await addNodeBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const data = TEST_DATA.bom;
                await page.fill(SELECTORS.admin.bomMaterialId, data.materialId);
                await page.fill(SELECTORS.admin.bomMaterialName, data.materialName);
                await page.fill(SELECTORS.admin.bomQuantityRequired, data.quantity);
                await page.fill(SELECTORS.admin.bomSequenceLevel, data.sequenceLevel);

                await screenshots.capture(page, 'bom-create-node-filled');

                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'bom-create-node-success');
            }
        }, page, results, screenshots);

        // Test 9: BOM - Edit Node
        await runTest('BOM - Edit Node', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const viewTreeBtn = page.locator('button:has-text("View Tree")').first();
            if (await viewTreeBtn.isVisible()) {
                await viewTreeBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Click edit button on first node
                const editBtn = page.locator('button[title="Edit"]').first();
                if (await editBtn.isVisible()) {
                    await editBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(500);

                    // Update quantity
                    const data = TEST_DATA.bom;
                    await page.fill(SELECTORS.admin.bomQuantityRequired, data.updatedQuantity);

                    await screenshots.capture(page, 'bom-edit-node-filled');

                    const submitBtn = page.locator('button[type="submit"]');
                    await submitBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'bom-edit-node-success');
                }
            }
        }, page, results, screenshots);

        // Test 10: BOM - Delete Node
        await runTest('BOM - Delete Node', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const viewTreeBtn = page.locator('button:has-text("View Tree")').first();
            if (await viewTreeBtn.isVisible()) {
                await viewTreeBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Click delete button on last node (to avoid removing nodes with children)
                const deleteButtons = page.locator('button[title="Delete"]');
                const count = await deleteButtons.count();
                if (count > 0) {
                    const lastDeleteBtn = deleteButtons.nth(count - 1);
                    await lastDeleteBtn.click();
                    await page.waitForTimeout(500);

                    // Click "Delete Node Only" in modal
                    const deleteConfirmBtn = page.locator('button:has-text("Delete Node Only")');
                    if (await deleteConfirmBtn.isVisible()) {
                        await deleteConfirmBtn.click();
                        await page.waitForTimeout(1000);

                        await screenshots.capture(page, 'bom-delete-node-success');
                    }
                }
            }
        }, page, results, screenshots);

        // Test 11: BOM - Edit Settings
        await runTest('BOM - Edit Settings Modal', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.BOM}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            const viewTreeBtn = page.locator('button:has-text("View Tree")').first();
            if (await viewTreeBtn.isVisible()) {
                await viewTreeBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                const editSettingsBtn = page.locator('button:has-text("Edit BOM Settings")');
                if (await editSettingsBtn.isVisible()) {
                    await editSettingsBtn.click();
                    await page.waitForTimeout(500);

                    await screenshots.capture(page, 'bom-edit-settings-modal');

                    // Close modal
                    const cancelBtn = page.locator('.settings-modal button:has-text("Cancel")');
                    if (await cancelBtn.isVisible()) {
                        await cancelBtn.click();
                        await page.waitForTimeout(300);
                    }
                }
            }
        }, page, results, screenshots);
    }
}

module.exports = { runBomCrudTests };
