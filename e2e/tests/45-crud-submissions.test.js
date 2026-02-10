/**
 * CRUD Form Submission Tests
 * Tests actual create/edit/delete operations for entities:
 * Customers, Materials, Products, Equipment, Operators, Users,
 * Config items, Processes, Operation Templates
 *
 * These tests only submit when --submit flag is passed.
 */

const { ROUTES, SELECTORS, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runCrudSubmissionTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '─'.repeat(50));
    console.log('CRUD FORM SUBMISSION TESTS');
    console.log('─'.repeat(50));
    console.log(`   Submit mode: ${submitActions ? 'ENABLED' : 'DISABLED (read-only)'}`);

    // ============================================
    // CUSTOMER CRUD
    // ============================================

    await runTest('Customer CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify form fields
        const codeField = page.locator(SELECTORS.admin.customerCode);
        const nameField = page.locator(SELECTORS.admin.customerName);
        const emailField = page.locator(SELECTORS.admin.email);

        const hasCode = await codeField.isVisible({ timeout: 2000 });
        const hasName = await nameField.isVisible({ timeout: 1000 });
        const hasEmail = await emailField.isVisible({ timeout: 1000 });

        console.log(`   Code: ${hasCode}, Name: ${hasName}, Email: ${hasEmail}`);

        if (submitActions && hasCode && hasName) {
            const data = TEST_DATA.crud.customer;
            await codeField.fill(data.code);
            await nameField.fill(data.name);

            if (await page.locator(SELECTORS.admin.contactPerson).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.contactPerson, data.contact);
            }
            if (await page.locator(SELECTORS.admin.email).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.email, data.email);
            }
            if (await page.locator(SELECTORS.admin.phone).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.phone, data.phone);
            }
            if (await page.locator(SELECTORS.admin.city).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.city, data.city);
            }

            await screenshots.capture(page, 'customer-create-filled');

            // Submit form
            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');

                const url = page.url();
                console.log(`   After submit URL: ${url}`);
                if (url.includes('/customers') && !url.includes('/new')) {
                    console.log('   Customer created successfully');
                }
            }
        } else {
            await screenshots.capture(page, 'customer-create-form');
        }
    }, page, results, screenshots);

    await runTest('Customer CRUD - Edit Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CUSTOMER_EDIT(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Verify form is pre-populated
        const nameField = page.locator(SELECTORS.admin.customerName);
        if (await nameField.isVisible({ timeout: 2000 })) {
            const value = await nameField.inputValue();
            console.log(`   Customer name pre-filled: ${value ? 'yes' : 'empty'}`);

            if (submitActions) {
                await nameField.fill(TEST_DATA.crud.customer.updatedName);
                await screenshots.capture(page, 'customer-edit-filled');

                const submitBtn = page.locator(SELECTORS.admin.saveButton);
                if (await submitBtn.isVisible({ timeout: 1000 })) {
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    console.log('   Customer update submitted');
                }
            }
        }
        await screenshots.capture(page, 'customer-edit-form');
    }, page, results, screenshots);

    // ============================================
    // MATERIAL CRUD
    // ============================================

    await runTest('Material CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIAL_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const codeField = page.locator(SELECTORS.admin.materialCode);
        const nameField = page.locator(SELECTORS.admin.materialName);
        const typeField = page.locator(SELECTORS.admin.materialType);

        const hasCode = await codeField.isVisible({ timeout: 2000 });
        const hasName = await nameField.isVisible({ timeout: 1000 });
        const hasType = await typeField.isVisible({ timeout: 1000 });

        console.log(`   Code: ${hasCode}, Name: ${hasName}, Type: ${hasType}`);

        if (submitActions && hasCode && hasName) {
            const data = TEST_DATA.crud.material;
            await codeField.fill(data.code);
            await nameField.fill(data.name);
            if (hasType) {
                await typeField.selectOption({ label: data.type }).catch(() =>
                    typeField.selectOption(data.type).catch(() => {})
                );
            }
            if (await page.locator(SELECTORS.admin.baseUnit).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.baseUnit, data.unit);
            }

            await screenshots.capture(page, 'material-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');
                console.log('   Material creation submitted');
            }
        } else {
            await screenshots.capture(page, 'material-create-form');
        }
    }, page, results, screenshots);

    await runTest('Material CRUD - Edit Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.MATERIAL_EDIT(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const nameField = page.locator(SELECTORS.admin.materialName);
        if (await nameField.isVisible({ timeout: 2000 })) {
            const value = await nameField.inputValue();
            console.log(`   Material name pre-filled: ${value ? 'yes' : 'empty'}`);

            if (submitActions) {
                await nameField.fill(TEST_DATA.crud.material.updatedName);
                const submitBtn = page.locator(SELECTORS.admin.saveButton);
                if (await submitBtn.isVisible({ timeout: 1000 })) {
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    console.log('   Material update submitted');
                }
            }
        }
        await screenshots.capture(page, 'material-edit-form');
    }, page, results, screenshots);

    // ============================================
    // PRODUCT CRUD
    // ============================================

    await runTest('Product CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCT_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const skuField = page.locator(SELECTORS.admin.productSku);
        const nameField = page.locator(SELECTORS.admin.productName);

        const hasSku = await skuField.isVisible({ timeout: 2000 });
        const hasName = await nameField.isVisible({ timeout: 1000 });
        console.log(`   SKU: ${hasSku}, Name: ${hasName}`);

        if (submitActions && hasSku && hasName) {
            const data = TEST_DATA.crud.product;
            await skuField.fill(data.sku);
            await nameField.fill(data.name);
            if (await page.locator(SELECTORS.admin.baseUnit).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.baseUnit, data.unit);
            }

            await screenshots.capture(page, 'product-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');
                console.log('   Product creation submitted');
            }
        } else {
            await screenshots.capture(page, 'product-create-form');
        }
    }, page, results, screenshots);

    await runTest('Product CRUD - Edit Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.PRODUCT_EDIT(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const nameField = page.locator(SELECTORS.admin.productName);
        if (await nameField.isVisible({ timeout: 2000 })) {
            const value = await nameField.inputValue();
            console.log(`   Product name pre-filled: ${value ? 'yes' : 'empty'}`);

            if (submitActions) {
                await nameField.fill(TEST_DATA.crud.product.updatedName);
                const submitBtn = page.locator(SELECTORS.admin.saveButton);
                if (await submitBtn.isVisible({ timeout: 1000 })) {
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    console.log('   Product update submitted');
                }
            }
        }
        await screenshots.capture(page, 'product-edit-form');
    }, page, results, screenshots);

    // ============================================
    // EQUIPMENT CRUD
    // ============================================

    await runTest('Equipment CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const codeField = page.locator(SELECTORS.admin.equipmentCode);
        const nameField = page.locator(SELECTORS.admin.equipmentName);
        const typeField = page.locator(SELECTORS.admin.equipmentType);

        const hasCode = await codeField.isVisible({ timeout: 2000 });
        const hasName = await nameField.isVisible({ timeout: 1000 });
        const hasType = await typeField.isVisible({ timeout: 1000 });

        console.log(`   Code: ${hasCode}, Name: ${hasName}, Type: ${hasType}`);

        if (submitActions && hasCode && hasName) {
            const data = TEST_DATA.crud.equipment;
            await codeField.fill(data.code);
            await nameField.fill(data.name);
            if (hasType) {
                await typeField.selectOption(data.type).catch(() => typeField.fill(data.type).catch(() => {}));
            }
            if (await page.locator(SELECTORS.admin.capacity).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.capacity, data.capacity);
            }
            if (await page.locator(SELECTORS.admin.capacityUnit).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.capacityUnit, data.capacityUnit);
            }

            await screenshots.capture(page, 'equipment-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');
                console.log('   Equipment creation submitted');
            }
        } else {
            await screenshots.capture(page, 'equipment-create-form');
        }
    }, page, results, screenshots);

    await runTest('Equipment CRUD - Edit Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.EQUIPMENT_EDIT(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const nameField = page.locator(SELECTORS.admin.equipmentName);
        if (await nameField.isVisible({ timeout: 2000 })) {
            const value = await nameField.inputValue();
            console.log(`   Equipment name pre-filled: ${value ? 'yes' : 'empty'}`);

            if (submitActions) {
                await nameField.fill(TEST_DATA.crud.equipment.updatedName);
                const submitBtn = page.locator(SELECTORS.admin.saveButton);
                if (await submitBtn.isVisible({ timeout: 1000 })) {
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    console.log('   Equipment update submitted');
                }
            }
        }
        await screenshots.capture(page, 'equipment-edit-form');
    }, page, results, screenshots);

    // ============================================
    // OPERATOR CRUD
    // ============================================

    await runTest('Operator CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATOR_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const codeField = page.locator(SELECTORS.admin.operatorCode);
        const nameField = page.locator(SELECTORS.admin.operatorName);

        const hasCode = await codeField.isVisible({ timeout: 2000 });
        const hasName = await nameField.isVisible({ timeout: 1000 });
        console.log(`   Code: ${hasCode}, Name: ${hasName}`);

        if (submitActions && hasCode && hasName) {
            const data = TEST_DATA.crud.operator;
            await codeField.fill(data.code);
            await nameField.fill(data.name);
            if (await page.locator(SELECTORS.admin.operatorDepartment).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.operatorDepartment, data.department);
            }
            if (await page.locator(SELECTORS.admin.operatorShift).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.operatorShift, data.shift);
            }

            await screenshots.capture(page, 'operator-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');
                console.log('   Operator creation submitted');
            }
        } else {
            await screenshots.capture(page, 'operator-create-form');
        }
    }, page, results, screenshots);

    await runTest('Operator CRUD - Edit Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATOR_EDIT(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const nameField = page.locator(SELECTORS.admin.operatorName);
        if (await nameField.isVisible({ timeout: 2000 })) {
            const value = await nameField.inputValue();
            console.log(`   Operator name pre-filled: ${value ? 'yes' : 'empty'}`);

            if (submitActions) {
                await nameField.fill(TEST_DATA.crud.operator.updatedName);
                const submitBtn = page.locator(SELECTORS.admin.saveButton);
                if (await submitBtn.isVisible({ timeout: 1000 })) {
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    console.log('   Operator update submitted');
                }
            }
        }
        await screenshots.capture(page, 'operator-edit-form');
    }, page, results, screenshots);

    // ============================================
    // USER CRUD
    // ============================================

    await runTest('User CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const nameField = page.locator(SELECTORS.admin.userName);
        const emailField = page.locator(SELECTORS.admin.userEmail);
        const passwordField = page.locator(SELECTORS.admin.userPassword);
        const roleField = page.locator(SELECTORS.admin.userRole);

        const hasName = await nameField.isVisible({ timeout: 2000 });
        const hasEmail = await emailField.isVisible({ timeout: 1000 });
        const hasPassword = await passwordField.isVisible({ timeout: 1000 });
        const hasRole = await roleField.isVisible({ timeout: 1000 });

        console.log(`   Name: ${hasName}, Email: ${hasEmail}, Password: ${hasPassword}, Role: ${hasRole}`);

        if (submitActions && hasName && hasEmail) {
            const data = TEST_DATA.crud.user;
            await nameField.fill(data.name);
            await emailField.fill(data.email);
            if (hasPassword) await passwordField.fill(data.password);
            if (hasRole) {
                await roleField.selectOption(data.role).catch(() => roleField.fill(data.role).catch(() => {}));
            }

            await screenshots.capture(page, 'user-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');
                console.log('   User creation submitted');
            }
        } else {
            await screenshots.capture(page, 'user-create-form');
        }
    }, page, results, screenshots);

    await runTest('User CRUD - Edit Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.USER_EDIT(1)}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const nameField = page.locator(SELECTORS.admin.userName);
        if (await nameField.isVisible({ timeout: 2000 })) {
            const value = await nameField.inputValue();
            console.log(`   User name pre-filled: ${value ? 'yes' : 'empty'}`);

            if (submitActions) {
                await nameField.fill(TEST_DATA.crud.user.updatedName);
                const submitBtn = page.locator(SELECTORS.admin.saveButton);
                if (await submitBtn.isVisible({ timeout: 1000 })) {
                    await submitBtn.click();
                    await page.waitForTimeout(2000);
                    console.log('   User update submitted');
                }
            }
        }
        await screenshots.capture(page, 'user-edit-form');
    }, page, results, screenshots);

    // ============================================
    // PROCESS CRUD
    // ============================================

    await runTest('Process CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ADMIN_PROCESS_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const nameField = page.locator('#processName, #name, input[formControlName="processName"]');
        const descField = page.locator('#description, textarea[formControlName="description"]');

        const hasName = await nameField.isVisible({ timeout: 2000 });
        const hasDesc = await descField.isVisible({ timeout: 1000 });
        console.log(`   Name: ${hasName}, Description: ${hasDesc}`);

        if (submitActions && hasName) {
            const data = TEST_DATA.crud.process;
            await nameField.fill(data.name);
            if (hasDesc) await descField.fill(data.description);

            await screenshots.capture(page, 'process-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');
                console.log('   Process creation submitted');
            }
        } else {
            await screenshots.capture(page, 'process-create-form');
        }
    }, page, results, screenshots);

    // ============================================
    // OPERATION TEMPLATE CRUD
    // ============================================

    await runTest('Operation Template CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.OPERATION_TEMPLATE_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const nameField = page.locator(SELECTORS.admin.templateName);
        const codeField = page.locator(SELECTORS.admin.templateCode);
        const typeField = page.locator(SELECTORS.admin.templateType);

        const hasName = await nameField.isVisible({ timeout: 2000 });
        const hasCode = await codeField.isVisible({ timeout: 1000 });
        const hasType = await typeField.isVisible({ timeout: 1000 });

        console.log(`   Name: ${hasName}, Code: ${hasCode}, Type: ${hasType}`);

        if (submitActions && hasName && hasCode) {
            const data = TEST_DATA.crud.operationTemplate;
            await nameField.fill(data.name);
            await codeField.fill(data.code);
            if (hasType) {
                await typeField.selectOption(data.type).catch(() => typeField.fill(data.type).catch(() => {}));
            }
            if (await page.locator(SELECTORS.admin.templateDuration).isVisible({ timeout: 500 })) {
                await page.fill(SELECTORS.admin.templateDuration, data.duration);
            }

            await screenshots.capture(page, 'op-template-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');
                console.log('   Operation template creation submitted');
            }
        } else {
            await screenshots.capture(page, 'op-template-create-form');
        }
    }, page, results, screenshots);

    // ============================================
    // CONFIG CRUD (Hold Reasons, Delay Reasons)
    // ============================================

    await runTest('Config CRUD - Hold Reason Create', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_HOLD_REASONS_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const codeField = page.locator(SELECTORS.admin.reasonCode);
        const descField = page.locator(SELECTORS.admin.reasonDescription);

        const hasCode = await codeField.isVisible({ timeout: 2000 });
        const hasDesc = await descField.isVisible({ timeout: 1000 });
        console.log(`   Code: ${hasCode}, Description: ${hasDesc}`);

        if (submitActions && hasCode && hasDesc) {
            const data = TEST_DATA.crud.holdReason;
            await codeField.fill(data.code);
            await descField.fill(data.description);

            await screenshots.capture(page, 'hold-reason-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                console.log('   Hold reason creation submitted');
            }
        } else {
            await screenshots.capture(page, 'hold-reason-create-form');
        }
    }, page, results, screenshots);

    await runTest('Config CRUD - Delay Reason Create', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.CONFIG_DELAY_REASONS_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const codeField = page.locator(SELECTORS.admin.reasonCode);
        const descField = page.locator(SELECTORS.admin.reasonDescription);

        const hasCode = await codeField.isVisible({ timeout: 2000 });
        const hasDesc = await descField.isVisible({ timeout: 1000 });
        console.log(`   Code: ${hasCode}, Description: ${hasDesc}`);

        if (submitActions && hasCode && hasDesc) {
            const data = TEST_DATA.crud.delayReason;
            await codeField.fill(data.code);
            await descField.fill(data.description);

            await screenshots.capture(page, 'delay-reason-create-filled');

            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                console.log('   Delay reason creation submitted');
            }
        } else {
            await screenshots.capture(page, 'delay-reason-create-form');
        }
    }, page, results, screenshots);

    // ============================================
    // FORM VALIDATION (common pattern)
    // ============================================

    await runTest('CRUD Forms - Required Field Validation', async () => {
        const forms = [
            { route: ROUTES.CUSTOMER_NEW, name: 'Customer' },
            { route: ROUTES.MATERIAL_NEW, name: 'Material' },
            { route: ROUTES.PRODUCT_NEW, name: 'Product' },
            { route: ROUTES.OPERATOR_NEW, name: 'Operator' },
        ];

        for (const form of forms) {
            await page.goto(`${config.baseUrl}${form.route}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            // Check that submit button is disabled when form is empty
            const submitBtn = page.locator(SELECTORS.admin.saveButton);
            if (await submitBtn.isVisible({ timeout: 2000 })) {
                const isDisabled = await submitBtn.isDisabled();
                console.log(`   ${form.name}: Submit disabled (empty form): ${isDisabled}`);
            } else {
                console.log(`   ${form.name}: Submit button not found`);
            }
        }

        await screenshots.capture(page, 'crud-forms-validation');
    }, page, results, screenshots);

    // ============================================
    // DELETE OPERATIONS
    // ============================================

    await runTest('CRUD - Delete Buttons Present', async () => {
        const listPages = [
            { route: ROUTES.CUSTOMERS, name: 'Customers' },
            { route: ROUTES.MATERIALS, name: 'Materials' },
            { route: ROUTES.PRODUCTS, name: 'Products' },
            { route: ROUTES.OPERATORS, name: 'Operators' },
            { route: ROUTES.OPERATION_TEMPLATES, name: 'Op Templates' },
        ];

        for (const listPage of listPages) {
            await page.goto(`${config.baseUrl}${listPage.route}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(500);

            const deleteBtn = page.locator('button.btn-danger, button:has-text("Delete"), button:has-text("Deactivate")').first();
            const hasDelete = await deleteBtn.isVisible({ timeout: 1000 });
            console.log(`   ${listPage.name}: Delete/Deactivate button: ${hasDelete}`);
        }

        await screenshots.capture(page, 'crud-delete-buttons');
    }, page, results, screenshots);

    // ============================================
    // RECEIVE MATERIAL (full form test)
    // ============================================

    await runTest('Receive Material - Form Fields', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.RECEIVE_MATERIAL}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const materialField = page.locator(SELECTORS.admin.receiveMaterialId);
        const qtyField = page.locator(SELECTORS.admin.receiveQuantity);
        const unitField = page.locator(SELECTORS.admin.receiveUnit);
        const supplierField = page.locator(SELECTORS.admin.receiveSupplier);
        const lotField = page.locator(SELECTORS.admin.receiveLotNumber);
        const locationField = page.locator(SELECTORS.admin.receiveLocation);

        console.log(`   Material: ${await materialField.isVisible({ timeout: 2000 })}`);
        console.log(`   Quantity: ${await qtyField.isVisible({ timeout: 1000 })}`);
        console.log(`   Unit: ${await unitField.isVisible({ timeout: 1000 })}`);
        console.log(`   Supplier: ${await supplierField.isVisible({ timeout: 1000 })}`);
        console.log(`   Lot: ${await lotField.isVisible({ timeout: 1000 })}`);
        console.log(`   Location: ${await locationField.isVisible({ timeout: 1000 })}`);

        if (submitActions) {
            const data = TEST_DATA.crud.receiveMaterial;
            // Material field may be a dropdown
            if (await materialField.isVisible({ timeout: 500 })) {
                await materialField.selectOption(data.materialId).catch(() =>
                    materialField.fill(data.materialId).catch(() => {})
                );
            }
            if (await qtyField.isVisible({ timeout: 500 })) await qtyField.fill(data.quantity);
            if (await unitField.isVisible({ timeout: 500 })) {
                await unitField.selectOption(data.unit).catch(() => unitField.fill(data.unit).catch(() => {}));
            }
            if (await supplierField.isVisible({ timeout: 500 })) await supplierField.fill(data.supplier);
            if (await lotField.isVisible({ timeout: 500 })) await lotField.fill(data.lotNumber);
            if (await locationField.isVisible({ timeout: 500 })) await locationField.fill(data.location);

            await screenshots.capture(page, 'receive-material-filled');

            const submitBtn = page.locator('button[type="submit"], button:has-text("Receive"), button:has-text("Submit")');
            if (await submitBtn.isVisible({ timeout: 1000 }) && !await submitBtn.isDisabled()) {
                await submitBtn.click();
                await page.waitForTimeout(2000);
                console.log('   Receive material submitted');
            }
        } else {
            await screenshots.capture(page, 'receive-material-form');
        }
    }, page, results, screenshots);

    // ============================================
    // BATCH FORM
    // ============================================

    await runTest('Batch CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.BATCH_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const batchNumField = page.locator(SELECTORS.admin.batchNumber);
        const materialField = page.locator(SELECTORS.admin.batchMaterialId);
        const qtyField = page.locator(SELECTORS.admin.batchQuantity);

        const hasBatchNum = await batchNumField.isVisible({ timeout: 2000 });
        const hasMaterial = await materialField.isVisible({ timeout: 1000 });
        const hasQty = await qtyField.isVisible({ timeout: 1000 });

        console.log(`   Batch Number: ${hasBatchNum}, Material: ${hasMaterial}, Quantity: ${hasQty}`);

        await screenshots.capture(page, 'batch-create-form');
    }, page, results, screenshots);

    // ============================================
    // INVENTORY FORM
    // ============================================

    await runTest('Inventory CRUD - Create Form', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.INVENTORY_NEW}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const materialField = page.locator(SELECTORS.admin.inventoryMaterialId);
        const typeField = page.locator(SELECTORS.admin.inventoryType);
        const qtyField = page.locator(SELECTORS.admin.inventoryQuantity);
        const locationField = page.locator(SELECTORS.admin.inventoryLocation);

        console.log(`   Material: ${await materialField.isVisible({ timeout: 2000 })}`);
        console.log(`   Type: ${await typeField.isVisible({ timeout: 1000 })}`);
        console.log(`   Quantity: ${await qtyField.isVisible({ timeout: 1000 })}`);
        console.log(`   Location: ${await locationField.isVisible({ timeout: 1000 })}`);

        await screenshots.capture(page, 'inventory-create-form');
    }, page, results, screenshots);
}

module.exports = { runCrudSubmissionTests };
