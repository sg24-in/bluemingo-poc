/**
 * CRUD Tests for Admin Module
 * Tests Customer, Material, Product Create/Read/Update/Delete operations
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runCrudTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('📂 CRUD TESTS (Admin Module)');
    console.log('─'.repeat(50));

    // ============================================
    // CUSTOMERS CRUD
    // ============================================

    // Test 1: Customers list view
    await runTest('Customers - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'customers-list-view');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Customers table not visible');
        }
    }, page, results, screenshots);

    // Test 2: Customers - Filter by status
    await runTest('Customers - Filter by Status', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const statusFilter = page.locator(SELECTORS.admin.statusFilter);
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption('ACTIVE');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'customers-filter-active');
        }
    }, page, results, screenshots);

    // Test 3: Customers - Search functionality
    await runTest('Customers - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const searchInput = page.locator(SELECTORS.admin.searchInput);
        if (await searchInput.isVisible()) {
            await searchInput.fill('Tech');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'customers-search-results');
        }
    }, page, results, screenshots);

    // Test 4: Customers - Navigate to Create form
    await runTest('Customers - Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Customer")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'customers-create-form');

            // Verify form fields are present
            const codeInput = page.locator(SELECTORS.admin.customerCode);
            if (!await codeInput.isVisible()) {
                throw new Error('Customer code field not visible');
            }
        }
    }, page, results, screenshots);

    // Test 5: Customers - Create (with submit)
    if (submitActions) {
        await runTest('Customers - Create Customer', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.customer;

            // Fill form
            await page.fill(SELECTORS.admin.customerCode, data.code);
            await page.fill(SELECTORS.admin.customerName, data.name);
            await page.fill(SELECTORS.admin.contactPerson, data.contact);
            await page.fill(SELECTORS.admin.email, data.email);
            await page.fill(SELECTORS.admin.phone, data.phone);
            await page.fill(SELECTORS.admin.address, data.address);
            await page.fill(SELECTORS.admin.city, data.city);
            await page.fill(SELECTORS.admin.country, data.country);
            await page.fill(SELECTORS.admin.taxId, data.taxId);

            await screenshots.capture(page, 'customers-create-filled');

            // Submit
            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify redirect to list
            await screenshots.capture(page, 'customers-create-success');

            // Verify customer exists in list
            const newRow = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (!await newRow.isVisible()) {
                throw new Error('Created customer not found in list');
            }
        }, page, results, screenshots);

        // Test 6: Customers - Edit
        await runTest('Customers - Edit Customer', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.customer;

            // Find the row with our test customer
            const customerRow = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await customerRow.isVisible()) {
                const editBtn = customerRow.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'customers-edit-form');

                // Update name
                await page.fill(SELECTORS.admin.customerName, data.updatedName);

                await screenshots.capture(page, 'customers-edit-filled');

                // Submit
                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'customers-edit-success');
            } else {
                throw new Error('Test customer not found for editing');
            }
        }, page, results, screenshots);

        // Test 7: Customers - Delete
        await runTest('Customers - Delete Customer', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.customer;

            // Find the row with our test customer
            const customerRow = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await customerRow.isVisible()) {
                const deleteBtn = customerRow.locator('button.btn-danger:has-text("Delete")');
                await deleteBtn.click();
                await page.waitForTimeout(300);

                await screenshots.capture(page, 'customers-delete-modal');

                // Confirm delete
                const confirmBtn = page.locator('.modal button.btn-danger:has-text("Delete")');
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'customers-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // MATERIALS CRUD
    // ============================================

    // Test 8: Materials list view
    await runTest('Materials - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIALS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'materials-list-view');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Materials table not visible');
        }
    }, page, results, screenshots);

    // Test 9: Materials - Filter by type
    await runTest('Materials - Filter by Type', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIALS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const typeFilter = page.locator('select#type-filter');
        if (await typeFilter.isVisible()) {
            // Get available options and select the first non-empty one
            const options = await typeFilter.locator('option').allTextContents();
            if (options.length > 1) {
                await typeFilter.selectOption({ index: 1 });
                await page.waitForTimeout(500);
            }
            await screenshots.capture(page, 'materials-filter-type');
        } else {
            await screenshots.capture(page, 'materials-list-no-filter');
        }
    }, page, results, screenshots);

    // Test 10: Materials - Navigate to Create form
    await runTest('Materials - Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIALS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Material")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'materials-create-form');

            // Verify form fields are present
            const codeInput = page.locator(SELECTORS.admin.materialCode);
            if (!await codeInput.isVisible()) {
                throw new Error('Material code field not visible');
            }
        }
    }, page, results, screenshots);

    // Test 11: Materials - Create (with submit)
    if (submitActions) {
        await runTest('Materials - Create Material', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.MATERIAL_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.material;

            // Fill form
            await page.fill(SELECTORS.admin.materialCode, data.code);
            await page.fill(SELECTORS.admin.materialName, data.name);
            await page.selectOption(SELECTORS.admin.materialType, data.type);
            await page.selectOption(SELECTORS.admin.baseUnit, data.unit);
            await page.fill(SELECTORS.admin.description, data.description);

            await screenshots.capture(page, 'materials-create-filled');

            // Submit
            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'materials-create-success');

            // Verify material exists in list
            const newRow = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (!await newRow.isVisible()) {
                throw new Error('Created material not found in list');
            }
        }, page, results, screenshots);

        // Test 12: Materials - Edit
        await runTest('Materials - Edit Material', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.MATERIALS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.material;

            // Find the row with our test material
            const materialRow = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await materialRow.isVisible()) {
                const editBtn = materialRow.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'materials-edit-form');

                // Update name
                await page.fill(SELECTORS.admin.materialName, data.updatedName);

                await screenshots.capture(page, 'materials-edit-filled');

                // Submit
                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'materials-edit-success');
            } else {
                throw new Error('Test material not found for editing');
            }
        }, page, results, screenshots);

        // Test 13: Materials - Delete
        await runTest('Materials - Delete Material', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.MATERIALS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.material;

            // Find the row with our test material
            const materialRow = page.locator(`table tbody tr:has-text("${data.code}")`);
            if (await materialRow.isVisible()) {
                const deleteBtn = materialRow.locator('button.btn-danger:has-text("Delete")');
                await deleteBtn.click();
                await page.waitForTimeout(300);

                await screenshots.capture(page, 'materials-delete-modal');

                // Confirm delete
                const confirmBtn = page.locator('.modal button.btn-danger:has-text("Delete")');
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'materials-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // PRODUCTS CRUD
    // ============================================

    // Test 14: Products list view
    await runTest('Products - List View', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        await screenshots.capture(page, 'products-list-view');

        const table = page.locator('table');
        if (!await table.isVisible()) {
            throw new Error('Products table not visible');
        }
    }, page, results, screenshots);

    // Test 15: Products - Search functionality
    await runTest('Products - Search', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const searchInput = page.locator(SELECTORS.admin.searchInput);
        if (await searchInput.isVisible()) {
            await searchInput.fill('Steel');
            await page.waitForTimeout(500);
            await screenshots.capture(page, 'products-search-results');
        }
    }, page, results, screenshots);

    // Test 16: Products - Navigate to Create form
    await runTest('Products - Create Form Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCTS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const newButton = page.locator('button:has-text("New Product")');
        if (await newButton.isVisible()) {
            await newButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'products-create-form');

            // Verify form fields are present
            const skuInput = page.locator(SELECTORS.admin.productSku);
            if (!await skuInput.isVisible()) {
                throw new Error('Product SKU field not visible');
            }
        }
    }, page, results, screenshots);

    // Test 17: Products - Create (with submit)
    if (submitActions) {
        await runTest('Products - Create Product', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCT_NEW}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.product;

            // Fill form
            await page.fill(SELECTORS.admin.productSku, data.sku);
            await page.fill(SELECTORS.admin.productName, data.name);
            await page.selectOption(SELECTORS.admin.baseUnit, data.unit);
            await page.fill(SELECTORS.admin.description, data.description);

            await screenshots.capture(page, 'products-create-filled');

            // Submit
            const submitBtn = page.locator('button[type="submit"]');
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            await screenshots.capture(page, 'products-create-success');

            // Verify product exists in list
            const newRow = page.locator(`table tbody tr:has-text("${data.sku}")`);
            if (!await newRow.isVisible()) {
                throw new Error('Created product not found in list');
            }
        }, page, results, screenshots);

        // Test 18: Products - Edit
        await runTest('Products - Edit Product', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.product;

            // Find the row with our test product
            const productRow = page.locator(`table tbody tr:has-text("${data.sku}")`);
            if (await productRow.isVisible()) {
                const editBtn = productRow.locator('button:has-text("Edit")');
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(500);

                await screenshots.capture(page, 'products-edit-form');

                // Update name
                await page.fill(SELECTORS.admin.productName, data.updatedName);

                await screenshots.capture(page, 'products-edit-filled');

                // Submit
                const submitBtn = page.locator('button[type="submit"]');
                await submitBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                await screenshots.capture(page, 'products-edit-success');
            } else {
                throw new Error('Test product not found for editing');
            }
        }, page, results, screenshots);

        // Test 19: Products - Delete
        await runTest('Products - Delete Product', async () => {
            await page.goto(`${config.baseUrl}${ROUTES.PRODUCTS}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const data = TEST_DATA.crud.product;

            // Find the row with our test product
            const productRow = page.locator(`table tbody tr:has-text("${data.sku}")`);
            if (await productRow.isVisible()) {
                const deleteBtn = productRow.locator('button.btn-danger:has-text("Delete")');
                await deleteBtn.click();
                await page.waitForTimeout(300);

                await screenshots.capture(page, 'products-delete-modal');

                // Confirm delete
                const confirmBtn = page.locator('.modal button.btn-danger:has-text("Delete")');
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);

                    await screenshots.capture(page, 'products-delete-success');
                }
            }
        }, page, results, screenshots);
    }

    // ============================================
    // ADMIN NAVIGATION
    // ============================================

    // Test 20: Admin sidebar navigation
    await runTest('Admin - Sidebar Navigation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await screenshots.capture(page, 'admin-sidebar-customers');

        // Navigate to Products via sidebar
        const productsLink = page.locator('a[href*="/manage/products"], .sidebar a:has-text("Products")');
        if (await productsLink.isVisible()) {
            await productsLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'admin-sidebar-products');
        }

        // Navigate to Materials via sidebar
        const materialsLink = page.locator('a[href*="/manage/materials"], .sidebar a:has-text("Materials")');
        if (await materialsLink.isVisible()) {
            await materialsLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'admin-sidebar-materials');
        }

        // Navigate to BOM via sidebar
        const bomLink = page.locator('a[href*="/manage/bom"], .sidebar a:has-text("Bill of Materials")');
        if (await bomLink.isVisible()) {
            await bomLink.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(500);

            await screenshots.capture(page, 'admin-sidebar-bom');
        }
    }, page, results, screenshots);

    // Test 21: Form validation
    await runTest('Form Validation - Required Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Try to submit empty form
        const submitBtn = page.locator('button[type="submit"]');

        // Verify submit button is disabled when form is invalid
        const isDisabled = await submitBtn.isDisabled();
        if (!isDisabled) {
            throw new Error('Submit button should be disabled for invalid form');
        }

        await screenshots.capture(page, 'form-validation-empty');

        // Fill just code, leave name empty
        await page.fill(SELECTORS.admin.customerCode, 'TEST-CODE');
        await page.waitForTimeout(200);

        await screenshots.capture(page, 'form-validation-partial');
    }, page, results, screenshots);

    // Test 22: Pagination in admin lists
    await runTest('Admin - Pagination Controls', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Check for pagination controls (use first() to avoid strict mode)
        const paginationControls = page.locator('.pagination-controls').first();
        if (await paginationControls.isVisible()) {
            await screenshots.capture(page, 'admin-pagination-controls');
        } else {
            await screenshots.capture(page, 'admin-list-no-pagination');
        }
    }, page, results, screenshots);
}

module.exports = { runCrudTests };
