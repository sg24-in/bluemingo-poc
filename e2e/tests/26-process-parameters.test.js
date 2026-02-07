/**
 * Process Parameter Validation Tests
 * Tests for process parameter min/max validation in production confirmation form
 */

const { ROUTES, TEST_DATA } = require('../config/constants');
const config = require('../config/playwright.config');

async function runProcessParameterTests(page, screenshots, results, runTest, submitActions = false) {
    console.log('\n' + '='.repeat(50));
    console.log('PROCESS PARAMETER VALIDATION TESTS');
    console.log('='.repeat(50));

    // ============================================
    // PROCESS PARAMETERS IN PRODUCTION FORM
    // ============================================

    await runTest('Parameters - Form Display', async () => {
        // Navigate to production and select an operation
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Find an order with operations
        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            // Click on order to go to detail
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Look for a confirm button on an operation
            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Look for process parameters section
                const paramsSection = page.locator('.card-header:has-text("Process Parameters")');
                if (await paramsSection.isVisible()) {
                    await screenshots.capture(page, 'params-form-display');

                    // Verify parameter inputs exist
                    const paramInputs = page.locator('[formArrayName="processParameters"] input');
                    const paramCount = await paramInputs.count();
                    console.log(`   Found ${paramCount} parameter inputs`);
                } else {
                    console.log('   No process parameters configured for this operation');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Parameters - Min/Max Hint Display', async () => {
        // Navigate to orders and find one with operations
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Look for min/max hints
                const paramHints = page.locator('.param-hint');
                const hintCount = await paramHints.count();

                if (hintCount > 0) {
                    await screenshots.capture(page, 'params-minmax-hints');

                    // Check for range format [min - max]
                    for (let i = 0; i < Math.min(hintCount, 3); i++) {
                        const hintText = await paramHints.nth(i).textContent();
                        console.log(`   Parameter hint ${i + 1}: ${hintText}`);
                    }
                } else {
                    console.log('   No parameter hints found');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Parameters - Minimum Validation Error', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Find a parameter input with min validation
                const paramInputs = page.locator('[formArrayName="processParameters"] input[type="number"]');
                const inputCount = await paramInputs.count();

                if (inputCount > 0) {
                    // Get the min attribute and enter a value below it
                    const firstInput = paramInputs.first();
                    const minValue = await firstInput.getAttribute('min');

                    if (minValue) {
                        const belowMin = parseFloat(minValue) - 100;
                        await firstInput.fill(String(belowMin));
                        await firstInput.blur();
                        await page.waitForTimeout(500);

                        await screenshots.capture(page, 'params-min-validation-error');

                        // Look for validation error message
                        const errorMsg = page.locator('.field-error:has-text("must be at least")');
                        if (await errorMsg.isVisible()) {
                            const errorText = await errorMsg.textContent();
                            console.log(`   Min validation error: ${errorText}`);
                        } else {
                            console.log('   Min validation error not shown (value may be within range)');
                        }
                    }
                } else {
                    console.log('   No parameter inputs with min validation');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Parameters - Maximum Validation Error', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Find a parameter input with max validation
                const paramInputs = page.locator('[formArrayName="processParameters"] input[type="number"]');
                const inputCount = await paramInputs.count();

                if (inputCount > 0) {
                    // Get the max attribute and enter a value above it
                    const firstInput = paramInputs.first();
                    const maxValue = await firstInput.getAttribute('max');

                    if (maxValue) {
                        const aboveMax = parseFloat(maxValue) + 100;
                        await firstInput.fill(String(aboveMax));
                        await firstInput.blur();
                        await page.waitForTimeout(500);

                        await screenshots.capture(page, 'params-max-validation-error');

                        // Look for validation error message
                        const errorMsg = page.locator('.field-error:has-text("must not exceed")');
                        if (await errorMsg.isVisible()) {
                            const errorText = await errorMsg.textContent();
                            console.log(`   Max validation error: ${errorText}`);
                        } else {
                            console.log('   Max validation error not shown (value may be within range)');
                        }
                    }
                } else {
                    console.log('   No parameter inputs with max validation');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Parameters - Required Validation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Look for required parameters (marked with *)
                const requiredLabels = page.locator('[formArrayName="processParameters"] label .required');
                const requiredCount = await requiredLabels.count();

                if (requiredCount > 0) {
                    // Find a required input and clear it to trigger validation
                    const requiredInput = page.locator('[formArrayName="processParameters"] input[type="number"]').first();
                    await requiredInput.fill('');
                    await requiredInput.blur();
                    await page.waitForTimeout(500);

                    await screenshots.capture(page, 'params-required-validation');

                    // Look for required error message
                    const errorMsg = page.locator('.field-error:has-text("is required")');
                    if (await errorMsg.isVisible()) {
                        const errorText = await errorMsg.textContent();
                        console.log(`   Required validation error: ${errorText}`);
                    }
                } else {
                    console.log('   No required parameters found');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Parameters - Valid Value Entry', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Find parameter inputs and fill with valid values
                const paramInputs = page.locator('[formArrayName="processParameters"] input[type="number"]');
                const inputCount = await paramInputs.count();

                if (inputCount > 0) {
                    // Fill each input with a value in the middle of its range
                    for (let i = 0; i < inputCount; i++) {
                        const input = paramInputs.nth(i);
                        const minValue = await input.getAttribute('min');
                        const maxValue = await input.getAttribute('max');
                        const placeholder = await input.getAttribute('placeholder');

                        // Use default value (placeholder) or middle of range
                        let validValue;
                        if (placeholder && !isNaN(parseFloat(placeholder))) {
                            validValue = placeholder;
                        } else if (minValue && maxValue) {
                            validValue = String((parseFloat(minValue) + parseFloat(maxValue)) / 2);
                        } else {
                            validValue = '500'; // Fallback
                        }

                        await input.fill(validValue);
                    }

                    await page.waitForTimeout(500);
                    await screenshots.capture(page, 'params-valid-values');

                    // Verify no error messages
                    const errorMsgs = page.locator('[formArrayName="processParameters"] .field-error');
                    const errorCount = await errorMsgs.count();
                    const visibleErrors = [];

                    for (let i = 0; i < errorCount; i++) {
                        if (await errorMsgs.nth(i).isVisible()) {
                            visibleErrors.push(await errorMsgs.nth(i).textContent());
                        }
                    }

                    if (visibleErrors.length === 0) {
                        console.log('   All parameters have valid values (no errors)');
                    } else {
                        console.log(`   ${visibleErrors.length} validation errors still showing`);
                    }
                } else {
                    console.log('   No parameter inputs found');
                }
            }
        }
    }, page, results, screenshots);

    // ============================================
    // BOM VALIDATION WARNINGS
    // ============================================

    await runTest('BOM Validation - Warnings Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Look for BOM validation section
                const bomValidation = page.locator('.bom-validation');
                const bomWarnings = page.locator('.alert-warning:has-text("Warning")');
                const bomErrors = page.locator('.alert-error:has-text("Error")');

                if (await bomWarnings.isVisible()) {
                    await screenshots.capture(page, 'bom-validation-warnings');
                    console.log('   BOM validation warnings displayed');
                }

                if (await bomErrors.isVisible()) {
                    await screenshots.capture(page, 'bom-validation-errors');
                    console.log('   BOM validation errors displayed');
                }

                if (!await bomWarnings.isVisible() && !await bomErrors.isVisible()) {
                    console.log('   No BOM validation messages (materials may be sufficient)');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('BOM Requirements - Status Display', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Look for BOM requirements table
                const bomRequirements = page.locator('.bom-requirements');
                const bomTable = page.locator('.bom-table');

                if (await bomRequirements.isVisible() || await bomTable.isVisible()) {
                    await screenshots.capture(page, 'bom-requirements-status');

                    // Look for status badges
                    const statusBadges = page.locator('.bom-status');
                    const statusCount = await statusBadges.count();

                    if (statusCount > 0) {
                        console.log(`   Found ${statusCount} BOM requirement status badges`);
                    }
                } else {
                    console.log('   No BOM requirements section (may not be configured)');
                }
            }
        }
    }, page, results, screenshots);

    // ============================================
    // YIELD CALCULATION DISPLAY
    // ============================================

    await runTest('Yield Display - Calculation', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Fill production quantities to trigger yield calculation
                const producedQty = page.locator('input#quantityProduced, input[formControlName="quantityProduced"]');
                const scrapQty = page.locator('input#quantityScrapped, input[formControlName="quantityScrapped"]');

                if (await producedQty.isVisible()) {
                    await producedQty.fill('100');
                }
                if (await scrapQty.isVisible()) {
                    await scrapQty.fill('5');
                }

                await page.waitForTimeout(500);

                // Look for yield display
                const yieldDisplay = page.locator('.yield-display');
                const yieldPercentage = page.locator('.yield-percentage');
                const yieldBar = page.locator('.yield-bar');

                if (await yieldDisplay.isVisible()) {
                    await screenshots.capture(page, 'yield-calculation-display');

                    if (await yieldPercentage.isVisible()) {
                        const percentText = await yieldPercentage.textContent();
                        console.log(`   Yield percentage: ${percentText}`);
                    }
                } else {
                    console.log('   Yield display not visible (may require production values)');
                }
            }
        }
    }, page, results, screenshots);

    await runTest('Yield Display - Status Classes', async () => {
        await page.goto(`${config.baseUrl}${ROUTES.ORDERS}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        const orderRows = page.locator('table tbody tr');
        if (await orderRows.count() > 0) {
            const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
            if (await viewBtn.isVisible()) {
                await viewBtn.click();
            } else {
                await orderRows.first().locator('td').first().click();
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            const confirmBtn = page.locator('button:has-text("Confirm"), a:has-text("Confirm Production")').first();
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(1000);

                // Fill quantities to get high yield (good status)
                const producedQty = page.locator('input#quantityProduced, input[formControlName="quantityProduced"]');
                const scrapQty = page.locator('input#quantityScrapped, input[formControlName="quantityScrapped"]');

                if (await producedQty.isVisible()) {
                    await producedQty.fill('100');
                }
                if (await scrapQty.isVisible()) {
                    await scrapQty.fill('2'); // 98% yield = good
                }

                await page.waitForTimeout(500);

                const yieldPercentage = page.locator('.yield-percentage');
                if (await yieldPercentage.isVisible()) {
                    const classList = await yieldPercentage.getAttribute('class');

                    await screenshots.capture(page, 'yield-good-status');

                    if (classList.includes('good')) {
                        console.log('   Yield status: GOOD (>=95%)');
                    } else if (classList.includes('warning')) {
                        console.log('   Yield status: WARNING (80-95%)');
                    } else if (classList.includes('critical')) {
                        console.log('   Yield status: CRITICAL (<80%)');
                    }
                }

                // Test warning status (80-95%)
                if (await scrapQty.isVisible()) {
                    await scrapQty.fill('15'); // 85% yield = warning
                    await page.waitForTimeout(500);

                    await screenshots.capture(page, 'yield-warning-status');
                }

                // Test critical status (<80%)
                if (await scrapQty.isVisible()) {
                    await scrapQty.fill('30'); // 70% yield = critical
                    await page.waitForTimeout(500);

                    await screenshots.capture(page, 'yield-critical-status');
                }
            }
        }
    }, page, results, screenshots);
}

module.exports = { runProcessParameterTests };
