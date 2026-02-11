/**
 * Entity Detail Pages Tests
 * Tests navigation to and content of all entity detail pages:
 * Customer, Material, Product, Equipment, Operator, User, Hold,
 * Batch (with genealogy), Inventory, Order, Process
 */

const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runEntityDetailPageTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('ENTITY DETAIL PAGES TESTS');
    console.log('─'.repeat(50));

    // ============================================
    // CUSTOMER DETAIL
    // ============================================

    await runTest('Customer Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            // Look for a view/detail button or clickable row
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);
            if (url.includes('/customers/')) {
                console.log('   Customer detail page loaded');
            }

            // Verify detail content
            const detailCard = page.locator('.detail-card, .card, .detail-grid').first();
            if (await detailCard.isVisible({ timeout: 2000 })) {
                console.log('   Detail card visible');
            }

            // Check for status badge
            const statusBadge = page.locator('.status-badge, .badge, [class*="status-"]').first();
            if (await statusBadge.isVisible({ timeout: 1000 })) {
                const status = await statusBadge.textContent();
                console.log(`   Status: ${status.trim()}`);
            }

            await screenshots.capture(page, 'customer-detail-page');
        } else {
            console.log('   No customer rows found');
        }
    }, page, results, screenshots);

    await runTest('Customer Detail - Direct URL', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for customer info sections
        const heading = page.locator('h1, h2, .page-title, .customer-name').first();
        if (await heading.isVisible({ timeout: 3000 })) {
            const text = await heading.textContent();
            console.log(`   Heading: ${text.trim().substring(0, 50)}`);
        }

        // Check for edit button
        const editBtn = page.locator('button:has-text("Edit")').first();
        const hasEdit = await editBtn.isVisible({ timeout: 1000 });
        console.log(`   Edit button: ${hasEdit ? 'present' : 'not found'}`);

        // Check for activate/deactivate
        const toggleBtn = page.locator('button:has-text("Activate"), button:has-text("Deactivate")').first();
        const hasToggle = await toggleBtn.isVisible({ timeout: 1000 });
        console.log(`   Status toggle button: ${hasToggle ? 'present' : 'not found'}`);

        await screenshots.capture(page, 'customer-detail-direct');
    }, page, results, screenshots);

    // ============================================
    // MATERIAL DETAIL
    // ============================================

    await runTest('Material Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIALS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            // Check for material type badge
            const typeBadge = page.locator('[class*="type-"], .material-type-badge').first();
            if (await typeBadge.isVisible({ timeout: 2000 })) {
                const type = await typeBadge.textContent();
                console.log(`   Material type: ${type.trim()}`);
            }

            await screenshots.capture(page, 'material-detail-page');
        } else {
            console.log('   No material rows found');
        }
    }, page, results, screenshots);

    await runTest('Material Detail - Direct URL', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIAL_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for material code display
        const codeField = page.locator(':has-text("Material Code")').first();
        if (await codeField.isVisible({ timeout: 2000 })) {
            console.log('   Material code field visible');
        }

        // Check for base unit
        const unitField = page.locator(':has-text("Base Unit")').first();
        if (await unitField.isVisible({ timeout: 2000 })) {
            console.log('   Base unit field visible');
        }

        await screenshots.capture(page, 'material-detail-direct');
    }, page, results, screenshots);

    // ============================================
    // PRODUCT DETAIL
    // ============================================

    await runTest('Product Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            // Check for SKU display
            const skuField = page.locator(':has-text("SKU"), .sku-display').first();
            if (await skuField.isVisible({ timeout: 2000 })) {
                console.log('   SKU field visible');
            }

            await screenshots.capture(page, 'product-detail-page');
        } else {
            console.log('   No product rows found');
        }
    }, page, results, screenshots);

    await runTest('Product Detail - View BOM Link', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCT_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for View BOM button
        const bomBtn = page.locator('button:has-text("BOM"), button:has-text("Bill of Materials"), a:has-text("BOM")').first();
        if (await bomBtn.isVisible({ timeout: 2000 })) {
            console.log('   View BOM button present');
            await screenshots.capture(page, 'product-detail-bom-link');
        } else {
            console.log('   No BOM link found');
        }
    }, page, results, screenshots);

    // ============================================
    // EQUIPMENT DETAIL
    // ============================================

    await runTest('Equipment Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            // Check for equipment status
            const statusBadge = page.locator('.status-badge, .badge, [class*="status-"]').first();
            if (await statusBadge.isVisible({ timeout: 2000 })) {
                const status = await statusBadge.textContent();
                console.log(`   Equipment status: ${status.trim()}`);
            }

            // Check for capacity info
            const capacityField = page.locator(':has-text("Capacity")').first();
            if (await capacityField.isVisible({ timeout: 1000 })) {
                console.log('   Capacity section visible');
            }

            await screenshots.capture(page, 'equipment-detail-page');
        } else {
            console.log('   No equipment rows found');
        }
    }, page, results, screenshots);

    await runTest('Equipment Detail - Action Buttons', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for status-dependent action buttons
        const maintenanceBtn = page.locator('button:has-text("Maintenance"), button:has-text("Start Maintenance")').first();
        const holdBtn = page.locator('button:has-text("Hold"), button:has-text("Put on Hold")').first();
        const releaseBtn = page.locator('button:has-text("Release"), button:has-text("End Maintenance")').first();
        const editBtn = page.locator('button:has-text("Edit")').first();

        const hasMaintenance = await maintenanceBtn.isVisible({ timeout: 1000 });
        const hasHold = await holdBtn.isVisible({ timeout: 1000 });
        const hasRelease = await releaseBtn.isVisible({ timeout: 1000 });
        const hasEdit = await editBtn.isVisible({ timeout: 1000 });

        console.log(`   Edit: ${hasEdit}, Maintenance: ${hasMaintenance}, Hold: ${hasHold}, Release: ${hasRelease}`);

        await screenshots.capture(page, 'equipment-detail-actions');
    }, page, results, screenshots);

    // ============================================
    // OPERATOR DETAIL
    // ============================================

    await runTest('Operator Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATORS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            // Check for operator details
            const codeField = page.locator(':has-text("Operator Code")').first();
            if (await codeField.isVisible({ timeout: 2000 })) {
                console.log('   Operator code field visible');
            }

            await screenshots.capture(page, 'operator-detail-page');
        } else {
            console.log('   No operator rows found');
        }
    }, page, results, screenshots);

    await runTest('Operator Detail - Direct URL and Actions', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATOR_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for detail sections
        const departmentField = page.locator(':has-text("Department")').first();
        const shiftField = page.locator(':has-text("Shift")').first();

        const hasDept = await departmentField.isVisible({ timeout: 1000 });
        const hasShift = await shiftField.isVisible({ timeout: 1000 });
        console.log(`   Department: ${hasDept}, Shift: ${hasShift}`);

        // Check for action buttons
        const editBtn = page.locator('button:has-text("Edit")').first();
        const toggleBtn = page.locator('button:has-text("Activate"), button:has-text("Deactivate")').first();

        console.log(`   Edit: ${await editBtn.isVisible({ timeout: 1000 })}`);
        console.log(`   Status toggle: ${await toggleBtn.isVisible({ timeout: 1000 })}`);

        await screenshots.capture(page, 'operator-detail-direct');
    }, page, results, screenshots);

    // ============================================
    // USER DETAIL
    // ============================================

    await runTest('User Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            // Check for user info
            const emailField = page.locator(':has-text("Email")').first();
            if (await emailField.isVisible({ timeout: 2000 })) {
                console.log('   Email field visible');
            }

            await screenshots.capture(page, 'user-detail-page');
        } else {
            console.log('   No user rows found');
        }
    }, page, results, screenshots);

    await runTest('User Detail - Direct URL', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for user details
        const heading = page.locator('h1, h2, .page-title').first();
        if (await heading.isVisible({ timeout: 3000 })) {
            const text = await heading.textContent();
            console.log(`   Heading: ${text.trim().substring(0, 50)}`);
        }

        // Check for last login info
        const lastLogin = page.locator(':has-text("Last Login"), :has-text("Never")').first();
        if (await lastLogin.isVisible({ timeout: 1000 })) {
            console.log('   Last login info visible');
        }

        await screenshots.capture(page, 'user-detail-direct');
    }, page, results, screenshots);

    // ============================================
    // HOLD DETAIL
    // ============================================

    await runTest('Hold Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.HOLDS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View"), button:has-text("Details")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            // Check for hold info
            const entityTypeBadge = page.locator('[class*="entity-"], .entity-type-badge').first();
            if (await entityTypeBadge.isVisible({ timeout: 2000 })) {
                const type = await entityTypeBadge.textContent();
                console.log(`   Entity type: ${type.trim()}`);
            }

            // Check for release button (if ACTIVE hold)
            const releaseBtn = page.locator('button:has-text("Release")').first();
            if (await releaseBtn.isVisible({ timeout: 1000 })) {
                console.log('   Release button present (active hold)');
            }

            await screenshots.capture(page, 'hold-detail-page');
        } else {
            console.log('   No hold rows found');
        }
    }, page, results, screenshots);

    await runTest('Hold Detail - Direct URL', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.HOLD_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for hold details
        const heading = page.locator('h1, h2, .page-title').first();
        if (await heading.isVisible({ timeout: 3000 })) {
            const text = await heading.textContent();
            console.log(`   Heading: ${text.trim().substring(0, 50)}`);
        }

        // Check for reason section
        const reasonField = page.locator(':has-text("Reason"), .hold-reason').first();
        if (await reasonField.isVisible({ timeout: 2000 })) {
            console.log('   Reason section visible');
        }

        // Check for applied/released info
        const appliedBy = page.locator(':has-text("Applied By"), :has-text("Applied On")').first();
        if (await appliedBy.isVisible({ timeout: 1000 })) {
            console.log('   Applied info visible');
        }

        await screenshots.capture(page, 'hold-detail-direct');
    }, page, results, screenshots);

    // ============================================
    // BATCH DETAIL + GENEALOGY
    // ============================================

    await runTest('Batch Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCHES}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            // Check for batch number display
            const batchNum = page.locator('.batch-number, :has-text("Batch Number")').first();
            if (await batchNum.isVisible({ timeout: 2000 })) {
                console.log('   Batch number visible');
            }

            await screenshots.capture(page, 'batch-detail-from-list');
        } else {
            console.log('   No batch rows found');
        }
    }, page, results, screenshots);

    await runTest('Batch Detail - Full Content Check', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCH_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for batch info sections
        const sections = {
            'Batch Number': page.locator(':has-text("Batch Number")').first(),
            'Material': page.locator(':has-text("Material")').first(),
            'Quantity': page.locator(':has-text("Quantity")').first(),
            'Status': page.locator('.status-badge, .badge, [class*="status-"]').first()
        };

        for (const [name, locator] of Object.entries(sections)) {
            const visible = await locator.isVisible({ timeout: 1000 });
            console.log(`   ${name}: ${visible ? 'visible' : 'not found'}`);
        }

        // Check for split/merge buttons
        const splitBtn = page.locator('button:has-text("Split")').first();
        const mergeBtn = page.locator('button:has-text("Merge")').first();
        console.log(`   Split button: ${await splitBtn.isVisible({ timeout: 1000 })}`);
        console.log(`   Merge button: ${await mergeBtn.isVisible({ timeout: 1000 })}`);

        await screenshots.capture(page, 'batch-detail-content');
    }, page, results, screenshots);

    await runTest('Batch Detail - Genealogy Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCH_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for genealogy/traceability section
        const genealogySection = page.locator(':has-text("Genealogy"), :has-text("Traceability"), :has-text("Source Materials")').first();
        if (await genealogySection.isVisible({ timeout: 3000 })) {
            console.log('   Genealogy section visible');
        }

        // Check for parent/child batch links
        const parentBatches = page.locator('.parent-batch, .source-material, :has-text("Source")').first();
        const childBatches = page.locator('.child-batch, .derived-product, :has-text("Derived")').first();

        console.log(`   Parent batches section: ${await parentBatches.isVisible({ timeout: 1000 })}`);
        console.log(`   Child batches section: ${await childBatches.isVisible({ timeout: 1000 })}`);

        // Check for genealogy chart
        const chart = page.locator('canvas, .echarts, [class*="chart"], [class*="genealogy-chart"]').first();
        if (await chart.isVisible({ timeout: 2000 })) {
            console.log('   Genealogy chart rendered');
        }

        await screenshots.capture(page, 'batch-detail-genealogy');
    }, page, results, screenshots);

    await runTest('Batch Detail - Quality Approval Status', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCH_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for quality approval section
        const qualitySection = page.locator(':has-text("Quality"), :has-text("Approval"), :has-text("Approved")').first();
        if (await qualitySection.isVisible({ timeout: 2000 })) {
            console.log('   Quality approval section visible');
        }

        // Check for approve/reject buttons (if QUALITY_PENDING)
        const approveBtn = page.locator('button:has-text("Approve")').first();
        const rejectBtn = page.locator('button:has-text("Reject")').first();
        console.log(`   Approve button: ${await approveBtn.isVisible({ timeout: 1000 })}`);
        console.log(`   Reject button: ${await rejectBtn.isVisible({ timeout: 1000 })}`);

        await screenshots.capture(page, 'batch-detail-quality');
    }, page, results, screenshots);

    await runTest('Batch Detail - Allocations Section', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCH_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for allocations section
        const allocSection = page.locator(':has-text("Allocation"), :has-text("Order Allocation")').first();
        if (await allocSection.isVisible({ timeout: 2000 })) {
            console.log('   Allocations section visible');

            // Check for availability summary
            const availSummary = page.locator(':has-text("Available"), :has-text("Allocated"), :has-text("Total")').first();
            if (await availSummary.isVisible({ timeout: 1000 })) {
                console.log('   Availability summary visible');
            }
        } else {
            console.log('   No allocations section (may not be applicable)');
        }

        await screenshots.capture(page, 'batch-detail-allocations');
    }, page, results, screenshots);

    // ============================================
    // INVENTORY DETAIL
    // ============================================

    await runTest('Inventory Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            // Check for inventory type badge
            const typeBadge = page.locator('[class*="type-"], .inventory-type-badge').first();
            if (await typeBadge.isVisible({ timeout: 2000 })) {
                const type = await typeBadge.textContent();
                console.log(`   Inventory type: ${type.trim()}`);
            }

            await screenshots.capture(page, 'inventory-detail-from-list');
        } else {
            console.log('   No inventory rows found');
        }
    }, page, results, screenshots);

    await runTest('Inventory Detail - Content and Actions', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for inventory info sections
        const materialName = page.locator(':has-text("Material"), .material-name').first();
        const quantity = page.locator(':has-text("Quantity"), .quantity-display').first();
        const location = page.locator(':has-text("Location"), .location').first();

        console.log(`   Material: ${await materialName.isVisible({ timeout: 1000 })}`);
        console.log(`   Quantity: ${await quantity.isVisible({ timeout: 1000 })}`);
        console.log(`   Location: ${await location.isVisible({ timeout: 1000 })}`);

        // Check for state-dependent action buttons
        const blockBtn = page.locator('button:has-text("Block")').first();
        const unblockBtn = page.locator('button:has-text("Unblock")').first();
        const scrapBtn = page.locator('button:has-text("Scrap")').first();

        console.log(`   Block: ${await blockBtn.isVisible({ timeout: 1000 })}`);
        console.log(`   Unblock: ${await unblockBtn.isVisible({ timeout: 1000 })}`);
        console.log(`   Scrap: ${await scrapBtn.isVisible({ timeout: 1000 })}`);

        await screenshots.capture(page, 'inventory-detail-content');
    }, page, results, screenshots);

    await runTest('Inventory Detail - Batch Link', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for batch information section
        const batchSection = page.locator(':has-text("Batch"), .batch-info').first();
        if (await batchSection.isVisible({ timeout: 2000 })) {
            console.log('   Batch information section visible');

            // Check for clickable batch link
            const batchLink = page.locator('a[href*="batches"], .batch-link, a:has-text("Batch")').first();
            if (await batchLink.isVisible({ timeout: 1000 })) {
                console.log('   Batch link is clickable');
            }
        }

        await screenshots.capture(page, 'inventory-detail-batch-link');
    }, page, results, screenshots);

    // ============================================
    // ORDER DETAIL
    // ============================================

    await runTest('Order Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            await screenshots.capture(page, 'order-detail-from-list');
        } else {
            console.log('   No order rows found');
        }
    }, page, results, screenshots);

    await runTest('Order Detail - Content Sections', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for order info
        const orderNumber = page.locator(':has-text("Order Number"), :has-text("Order #"), .order-number').first();
        const customer = page.locator(':has-text("Customer")').first();
        const status = page.locator('.status-badge, .badge, [class*="status-"]').first();

        console.log(`   Order number: ${await orderNumber.isVisible({ timeout: 1000 })}`);
        console.log(`   Customer: ${await customer.isVisible({ timeout: 1000 })}`);
        if (await status.isVisible({ timeout: 1000 })) {
            const statusText = await status.textContent();
            console.log(`   Status: ${statusText.trim()}`);
        }

        await screenshots.capture(page, 'order-detail-content');
    }, page, results, screenshots);

    await runTest('Order Detail - Line Items', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for line items section
        const lineItemsSection = page.locator(':has-text("Line Item"), :has-text("Products"), h3:has-text("Line")').first();
        if (await lineItemsSection.isVisible({ timeout: 2000 })) {
            console.log('   Line items section visible');
        }

        // Count line items
        const lineItemRows = page.locator('.line-item, table tbody tr, .line-item-card');
        const count = await lineItemRows.count();
        console.log(`   Line items: ${count}`);

        await screenshots.capture(page, 'order-detail-line-items');
    }, page, results, screenshots);

    await runTest('Order Detail - Operations Timeline', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDER_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check for operations/process flow chart
        const opsSection = page.locator(':has-text("Operations"), :has-text("Process Flow"), .process-flow, .operations-timeline').first();
        if (await opsSection.isVisible({ timeout: 2000 })) {
            console.log('   Operations section visible');
        }

        // Check for operation status badges
        const opBadges = page.locator('.operation-status, .op-badge, [class*="op-status"]');
        const badgeCount = await opBadges.count();
        console.log(`   Operation badges: ${badgeCount}`);

        await screenshots.capture(page, 'order-detail-operations');
    }, page, results, screenshots);

    // ============================================
    // PROCESS DETAIL
    // ============================================

    await runTest('Process Detail - Navigate from List', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESSES_LIST}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const row = page.locator('table tbody tr').first();
        if (await row.isVisible({ timeout: 3000 })) {
            const viewBtn = row.locator('button:has-text("View"), a:has-text("View")');
            if (await viewBtn.first().isVisible({ timeout: 1000 })) {
                await viewBtn.first().click();
            } else {
                await row.click();
            }
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const url = page.url();
            console.log(`   Navigated to: ${url}`);

            await screenshots.capture(page, 'process-detail-from-list');
        } else {
            console.log('   No process rows found');
        }
    }, page, results, screenshots);

    await runTest('Process Detail - Direct URL', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PROCESS_DETAIL(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check for process info
        const heading = page.locator('h1, h2, .page-title').first();
        if (await heading.isVisible({ timeout: 3000 })) {
            const text = await heading.textContent();
            console.log(`   Heading: ${text.trim().substring(0, 50)}`);
        }

        // Check for status badge
        const statusBadge = page.locator('.status-badge, .badge, [class*="status-"]').first();
        if (await statusBadge.isVisible({ timeout: 1000 })) {
            const status = await statusBadge.textContent();
            console.log(`   Process status: ${status.trim()}`);
        }

        await screenshots.capture(page, 'process-detail-direct');
    }, page, results, screenshots);

    // ============================================
    // BACK NAVIGATION (multiple entities)
    // ============================================

    await runTest('Detail Pages - Back Navigation', async () => {
        const detailPages = [
            { route: ROUTES.CUSTOMER_DETAIL(1), listUrl: '/customers', name: 'Customer' },
            { route: ROUTES.MATERIAL_DETAIL(1), listUrl: '/materials', name: 'Material' },
            { route: ROUTES.PRODUCT_DETAIL(1), listUrl: '/products', name: 'Product' },
            { route: ROUTES.EQUIPMENT_DETAIL(1), listUrl: '/equipment', name: 'Equipment' },
        ];

        for (const detail of detailPages) {
            await page.goto(`${config.baseUrl}${detail.route}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), .back-link, .btn-back').first();
            if (await backBtn.isVisible({ timeout: 2000 })) {
                await backBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                const url = page.url();
                if (url.includes(detail.listUrl)) {
                    console.log(`   ${detail.name}: Back navigation works`);
                } else {
                    console.log(`   ${detail.name}: Back navigated to ${url}`);
                }
            } else {
                console.log(`   ${detail.name}: No back button found`);
            }
        }

        await screenshots.capture(page, 'detail-pages-back-nav');
    }, page, results, screenshots);
}

module.exports = { runEntityDetailPageTests };
