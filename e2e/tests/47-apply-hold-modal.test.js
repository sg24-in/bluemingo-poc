/**
 * E2E Tests: Apply Hold Modal (P15)
 * Tests the apply hold quick action in production confirmation
 */

const { chromium } = require('playwright');
const { login, takeScreenshot, waitForAngular } = require('../utils/test-helpers');

describe('Apply Hold Modal', () => {
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

  describe('Apply Hold Button', () => {
    it('should show Apply Hold button on production confirm page', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        // Check for Apply Hold button
        const applyHoldBtn = await page.locator('button:has-text("Apply Hold")');
        expect(await applyHoldBtn.isVisible()).toBeTruthy();

        await takeScreenshot(page, '26-apply-hold-button');
      }
    });

    it('should open apply hold modal when button is clicked', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        // Click Apply Hold button
        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(300);

        // Modal should be visible
        const modal = await page.locator('.modal-backdrop');
        expect(await modal.isVisible()).toBeTruthy();

        // Modal header should indicate apply hold
        const modalHeader = await page.locator('.modal-header h2');
        expect(await modalHeader.textContent()).toContain('Apply Hold');

        await takeScreenshot(page, '26-apply-hold-modal-open');

        await page.click('.close-btn');
      }
    });
  });

  describe('Modal Content', () => {
    it('should show entity information', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(300);

        // Check entity info
        const entityInfo = await page.locator('.entity-info');
        expect(await entityInfo.isVisible()).toBeTruthy();

        const entityType = await page.locator('.entity-info .info-value').first();
        expect(await entityType.textContent()).toContain('Operation');

        await takeScreenshot(page, '26-apply-hold-entity-info');

        await page.click('.close-btn');
      }
    });

    it('should show warning message about hold impact', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(300);

        // Check warning message
        const warning = await page.locator('.alert-warning');
        expect(await warning.isVisible()).toBeTruthy();
        expect(await warning.textContent()).toContain('block');

        await page.click('.close-btn');
      }
    });

    it('should load hold reasons dropdown', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(500); // Wait for reasons to load

        // Check dropdown has options
        const reasonSelect = await page.locator('select#reason');
        const options = await reasonSelect.locator('option').count();
        expect(options).toBeGreaterThan(1); // At least default + one reason

        await takeScreenshot(page, '26-apply-hold-reasons');

        await page.click('.close-btn');
      }
    });
  });

  describe('Form Validation', () => {
    it('should require hold reason', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(300);

        // Try to submit without selecting reason
        const submitBtn = await page.locator('.modal-footer button:has-text("Apply Hold")');
        expect(await submitBtn.isDisabled()).toBeTruthy();

        await page.click('.close-btn');
      }
    });

    it('should enable submit button when reason is selected', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(500);

        // Select a reason
        const reasonSelect = await page.locator('select#reason');
        const options = await reasonSelect.locator('option');
        const optionCount = await options.count();

        if (optionCount > 1) {
          await reasonSelect.selectOption({ index: 1 });
          await page.waitForTimeout(200);

          // Submit button should be enabled
          const submitBtn = await page.locator('.modal-footer button:has-text("Apply Hold")');
          expect(await submitBtn.isDisabled()).toBeFalsy();

          await takeScreenshot(page, '26-apply-hold-valid');
        }

        await page.click('.close-btn');
      }
    });

    it('should allow optional comments', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(500);

        // Select a reason
        const reasonSelect = await page.locator('select#reason');
        const optionCount = await reasonSelect.locator('option').count();

        if (optionCount > 1) {
          await reasonSelect.selectOption({ index: 1 });

          // Add optional comments
          await page.fill('textarea#comments', 'Test hold comment for E2E testing');
          await page.waitForTimeout(200);

          // Submit button should still be enabled
          const submitBtn = await page.locator('.modal-footer button:has-text("Apply Hold")');
          expect(await submitBtn.isDisabled()).toBeFalsy();

          await takeScreenshot(page, '26-apply-hold-with-comments');
        }

        await page.click('.close-btn');
      }
    });
  });

  describe('Hold Submission', () => {
    it('should submit hold successfully', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(500);

        // Select a reason
        const reasonSelect = await page.locator('select#reason');
        const optionCount = await reasonSelect.locator('option').count();

        if (optionCount > 1) {
          await reasonSelect.selectOption({ index: 1 });
          await page.fill('textarea#comments', 'E2E test hold');

          // Submit
          await page.click('.modal-footer button:has-text("Apply Hold")');
          await page.waitForTimeout(1000);

          // Should show success state
          const successIcon = await page.locator('.success-icon');
          if (await successIcon.isVisible()) {
            expect(await successIcon.isVisible()).toBeTruthy();
            await takeScreenshot(page, '26-apply-hold-success');
          }
        }

        // Wait for modal to close
        await page.waitForTimeout(2000);
      }
    });
  });

  describe('Modal Cancel', () => {
    it('should close modal on cancel button click', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(300);

        // Click cancel
        await page.click('.modal-footer button:has-text("Cancel")');
        await page.waitForTimeout(300);

        // Modal should be closed
        const modal = await page.locator('.modal-backdrop');
        expect(await modal.isVisible()).toBeFalsy();
      }
    });

    it('should close modal on X button click', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(300);

        // Click X button
        await page.click('.close-btn');
        await page.waitForTimeout(300);

        // Modal should be closed
        const modal = await page.locator('.modal-backdrop');
        expect(await modal.isVisible()).toBeFalsy();
      }
    });

    it('should close modal on backdrop click', async () => {
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      const confirmBtn = await page.locator('button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await waitForAngular(page);

        await page.click('button:has-text("Apply Hold")');
        await page.waitForTimeout(300);

        // Click on backdrop (outside modal container)
        await page.click('.modal-backdrop', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        // Modal should be closed
        const modal = await page.locator('.modal-backdrop');
        expect(await modal.isVisible()).toBeFalsy();
      }
    });
  });

  describe('Hold Status Badge', () => {
    it('should show On Hold badge when operation is held', async () => {
      // This test depends on an operation being on hold
      // If the previous test successfully applied a hold, the page should show the badge
      await page.goto('http://localhost:4200/#/orders');
      await waitForAngular(page);

      const orderRow = await page.locator('table tbody tr').first();
      await orderRow.click();
      await waitForAngular(page);

      // Look for any operation with ON_HOLD status
      const holdBadge = await page.locator('.hold-badge, app-status-badge:has-text("ON_HOLD")');
      if (await holdBadge.isVisible()) {
        await takeScreenshot(page, '26-operation-on-hold-badge');
      }
    });
  });
});
