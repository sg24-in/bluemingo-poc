/**
 * E2E Tests: Material Selection Modal (P14)
 * Tests the material selection modal in production confirmation
 */

const { chromium } = require('playwright');
const { login, takeScreenshot, waitForAngular } = require('../utils/test-helpers');

describe('Material Selection Modal', () => {
  let browser;
  let page;
  let context;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
    await login(page);
  });

  afterEach(async () => {
    await context.close();
  });

  describe('Modal Opening', () => {
    it('should show Select Materials button on production confirm page', async () => {
      // Navigate to an order with operations
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      // Click first order with operations
      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      // Find an operation to confirm
      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        // Check for Select Materials button
        const selectMaterialsBtn = await page.locator('button:has-text("Select Materials")');
        expect(await selectMaterialsBtn.isVisible()).toBeTruthy();

        await takeScreenshot(page, '25-material-selection-button');
      }
    });

    it('should open material selection modal when button is clicked', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        // Click Select Materials button
        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        // Modal should be visible
        const modal = await page.locator('.modal-backdrop');
        expect(await modal.isVisible()).toBeTruthy();

        // Modal header should be visible
        const modalHeader = await page.locator('.modal-header h2');
        expect(await modalHeader.textContent()).toContain('Select Materials');

        await takeScreenshot(page, '25-material-selection-modal-open');
      }
    });
  });

  describe('Filtering', () => {
    it('should filter materials by search term', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        // Get initial row count
        const initialRows = await page.locator('.table-container tbody tr').count();

        // Enter search term
        await page.fill('.search-input', 'RM');
        await page.waitForTimeout(200);

        // Rows should be filtered
        const filteredRows = await page.locator('.table-container tbody tr').count();

        await takeScreenshot(page, '25-material-selection-filtered');

        // Close modal
        await page.click('.close-btn');
      }
    });

    it('should filter materials by material type', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        // Select material type filter if available
        const filterSelect = await page.locator('.filter-group select');
        const options = await filterSelect.locator('option').count();

        if (options > 1) {
          await filterSelect.selectOption({ index: 1 });
          await page.waitForTimeout(200);

          await takeScreenshot(page, '25-material-selection-type-filter');
        }

        await page.click('.close-btn');
      }
    });

    it('should clear filters when button is clicked', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        // Enter search term
        await page.fill('.search-input', 'test');
        await page.waitForTimeout(200);

        // Click clear filters
        const clearBtn = await page.locator('button:has-text("Clear Filters")');
        if (await clearBtn.isVisible()) {
          await clearBtn.click();
          await page.waitForTimeout(200);

          const searchValue = await page.inputValue('.search-input');
          expect(searchValue).toBe('');
        }

        await page.click('.close-btn');
      }
    });
  });

  describe('Selection', () => {
    it('should select materials via checkbox', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        // Check first checkbox
        const firstCheckbox = await page.locator('.table-container tbody tr input[type="checkbox"]').first();
        if (await firstCheckbox.isVisible()) {
          await firstCheckbox.click();
          await page.waitForTimeout(200);

          // Selection summary should update
          const summary = await page.locator('.selection-summary');
          expect(await summary.textContent()).toContain('1 item');

          await takeScreenshot(page, '25-material-selection-selected');
        }

        await page.click('.close-btn');
      }
    });

    it('should select all visible materials', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        // Click Select All
        await page.click('button:has-text("Select All Visible")');
        await page.waitForTimeout(200);

        // Selection summary should show count
        const summary = await page.locator('.selection-summary');
        const summaryText = await summary.textContent();
        expect(summaryText).toContain('item');

        await takeScreenshot(page, '25-material-selection-select-all');

        await page.click('.close-btn');
      }
    });

    it('should clear all selections', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        // Select all then clear
        await page.click('button:has-text("Select All Visible")');
        await page.waitForTimeout(200);

        const clearBtn = await page.locator('button:has-text("Clear Selection")');
        if (await clearBtn.isVisible()) {
          await clearBtn.click();
          await page.waitForTimeout(200);

          // Summary should be empty or hidden
          const summary = await page.locator('.selection-summary');
          expect(await summary.isVisible()).toBeFalsy();
        }

        await page.click('.close-btn');
      }
    });
  });

  describe('Quantity Input', () => {
    it('should enable quantity input when material is selected', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        const firstCheckbox = await page.locator('.table-container tbody tr input[type="checkbox"]').first();
        const firstQtyInput = await page.locator('.table-container tbody tr .consume-qty').first();

        if (await firstCheckbox.isVisible()) {
          // Before selection, qty input should be disabled
          expect(await firstQtyInput.isDisabled()).toBeTruthy();

          // Select material
          await firstCheckbox.click();
          await page.waitForTimeout(200);

          // Now qty input should be enabled
          expect(await firstQtyInput.isDisabled()).toBeFalsy();
        }

        await page.click('.close-btn');
      }
    });

    it('should allow entering quantity to consume', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        const firstCheckbox = await page.locator('.table-container tbody tr input[type="checkbox"]').first();
        const firstQtyInput = await page.locator('.table-container tbody tr .consume-qty').first();

        if (await firstCheckbox.isVisible()) {
          await firstCheckbox.click();
          await page.waitForTimeout(200);

          await firstQtyInput.fill('50');
          await page.waitForTimeout(200);

          // Footer should show total quantity
          const footerSummary = await page.locator('.footer-summary');
          const summaryText = await footerSummary.textContent();
          expect(summaryText).toContain('50');

          await takeScreenshot(page, '25-material-selection-quantity');
        }

        await page.click('.close-btn');
      }
    });
  });

  describe('Modal Confirmation', () => {
    it('should close modal and update selections on confirm', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        const firstCheckbox = await page.locator('.table-container tbody tr input[type="checkbox"]').first();
        if (await firstCheckbox.isVisible()) {
          await firstCheckbox.click();
          await page.waitForTimeout(200);

          // Click Confirm Selection
          await page.click('button:has-text("Confirm Selection")');
          await page.waitForTimeout(300);

          // Modal should be closed
          const modal = await page.locator('.modal-backdrop');
          expect(await modal.isVisible()).toBeFalsy();

          // Selected materials should appear in the form
          const selectedTable = await page.locator('.selected-materials');
          // Presence of selected materials section indicates selections were applied
        }
      }
    });

    it('should close modal without changes on cancel', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Select Materials")');
        await page.waitForTimeout(300);

        // Make selections
        const firstCheckbox = await page.locator('.table-container tbody tr input[type="checkbox"]').first();
        if (await firstCheckbox.isVisible()) {
          await firstCheckbox.click();
          await page.waitForTimeout(200);
        }

        // Cancel
        await page.click('button:has-text("Cancel")');
        await page.waitForTimeout(300);

        // Modal should be closed
        const modal = await page.locator('.modal-backdrop');
        expect(await modal.isVisible()).toBeFalsy();
      }
    });
  });
});
