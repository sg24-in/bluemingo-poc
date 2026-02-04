/**
 * Test Helper Utilities for MES E2E Tests
 */

const path = require('path');
const fs = require('fs');
const config = require('../config/playwright.config');
const { SELECTORS } = require('../config/constants');

/**
 * Screenshot capture utility with automatic numbering
 */
class ScreenshotManager {
    constructor(outputDir) {
        this.outputDir = outputDir;
        this.counter = 0;
        this.ensureDir(outputDir);
    }

    ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Capture a screenshot with automatic numbering
     */
    async capture(page, name, options = {}) {
        this.counter++;
        const paddedNum = String(this.counter).padStart(3, '0');
        const sanitizedName = name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
        const filename = `${paddedNum}-${sanitizedName}.png`;
        const filepath = path.join(this.outputDir, filename);

        await page.screenshot({
            path: filepath,
            fullPage: options.fullPage || false
        });

        console.log(`   📸 ${filename}`);
        return filepath;
    }

    /**
     * Capture before/after screenshots around an action
     */
    async captureBeforeAfter(page, name, action) {
        await this.capture(page, `${name}-before`);
        await action();
        await page.waitForTimeout(config.timeouts.uiSettle);
        await this.capture(page, `${name}-after`);
    }
}

/**
 * Authentication helper
 */
class AuthHelper {
    constructor(page) {
        this.page = page;
    }

    /**
     * Login with credentials
     */
    async login(email, password) {
        await this.page.goto(`${config.baseUrl}/login`, { waitUntil: 'networkidle' });
        await this.page.fill(SELECTORS.login.emailInput, email);
        await this.page.fill(SELECTORS.login.passwordInput, password);

        const [response] = await Promise.all([
            this.page.waitForResponse(resp => resp.url().includes('/api/auth/login'), {
                timeout: config.timeouts.action
            }),
            this.page.click(SELECTORS.login.submitButton)
        ]);

        if (response.status() === 200) {
            const data = await response.json();
            await this.page.evaluate((loginData) => {
                localStorage.setItem('mes_token', loginData.accessToken);
                localStorage.setItem('mes_user', JSON.stringify(loginData.user));
            }, data);
            return data;
        }

        throw new Error(`Login failed with status ${response.status()}`);
    }

    /**
     * Login with default admin credentials
     */
    async loginAsAdmin() {
        return this.login(config.credentials.admin.email, config.credentials.admin.password);
    }

    /**
     * Logout
     */
    async logout() {
        const logoutBtn = this.page.locator(SELECTORS.header.logoutButton);
        if (await logoutBtn.isVisible()) {
            await logoutBtn.click();
            await this.page.waitForURL('**/login');
        }
    }
}

/**
 * Navigation helper
 */
class NavigationHelper {
    constructor(page) {
        this.page = page;
    }

    /**
     * Navigate to a route and wait for network idle
     */
    async goto(route) {
        await this.page.goto(`${config.baseUrl}${route}`, {
            waitUntil: 'networkidle',
            timeout: config.timeouts.navigation
        });
        await this.page.waitForTimeout(config.timeouts.uiSettle);
    }

    /**
     * Wait for page to be ready
     */
    async waitForReady() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(config.timeouts.uiSettle);
    }
}

/**
 * Table interaction helper
 */
class TableHelper {
    constructor(page) {
        this.page = page;
    }

    /**
     * Get row count
     */
    async getRowCount() {
        return await this.page.locator(SELECTORS.table.rows).count();
    }

    /**
     * Click on a row by index
     */
    async clickRow(index = 0) {
        const rows = this.page.locator(SELECTORS.table.rows);
        const count = await rows.count();
        if (count > index) {
            await rows.nth(index).click();
            await this.page.waitForLoadState('networkidle');
            return true;
        }
        return false;
    }

    /**
     * Find row containing text
     */
    async findRowWithText(text) {
        return this.page.locator(`${SELECTORS.table.rows}:has-text("${text}")`);
    }
}

/**
 * Modal interaction helper
 */
class ModalHelper {
    constructor(page) {
        this.page = page;
    }

    /**
     * Wait for modal to appear
     */
    async waitForOpen() {
        await this.page.waitForSelector(SELECTORS.modal.container, {
            state: 'visible',
            timeout: config.timeouts.action
        });
        await this.page.waitForTimeout(300); // Animation settle
    }

    /**
     * Close modal
     */
    async close() {
        const closeBtn = this.page.locator(SELECTORS.modal.closeButton);
        if (await closeBtn.isVisible()) {
            await closeBtn.click();
        }
    }

    /**
     * Confirm modal action
     */
    async confirm() {
        const confirmBtn = this.page.locator(SELECTORS.modal.confirmButton);
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }
    }

    /**
     * Cancel modal action
     */
    async cancel() {
        const cancelBtn = this.page.locator(SELECTORS.modal.cancelButton);
        if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
        }
    }
}

/**
 * Test results tracker
 */
class TestResults {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
        this.screenshots = 0;
    }

    addPassed(name) {
        this.tests.push({ name, status: 'PASSED' });
        this.passed++;
        console.log(`   ✅ PASSED`);
    }

    addFailed(name, error) {
        this.tests.push({ name, status: 'FAILED', error: error.message });
        this.failed++;
        console.log(`   ❌ FAILED: ${error.message}`);
    }

    addSkipped(name, reason) {
        this.tests.push({ name, status: 'SKIPPED', reason });
        this.skipped++;
        console.log(`   ⏭️  SKIPPED: ${reason}`);
    }

    incrementScreenshots() {
        this.screenshots++;
    }

    printSummary() {
        console.log('\n' + '═'.repeat(70));
        console.log('TEST SUMMARY');
        console.log('═'.repeat(70));
        console.log(`📊 Total: ${this.tests.length}`);
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`⏭️  Skipped: ${this.skipped}`);
        console.log(`📸 Screenshots: ${this.screenshots}`);
        console.log('═'.repeat(70));

        if (this.failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.tests
                .filter(t => t.status === 'FAILED')
                .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
        }
    }
}

/**
 * Run a test with error handling
 */
async function runTest(name, testFn, page, results, screenshotManager) {
    console.log(`\n🧪 ${name}`);
    try {
        await testFn();
        results.addPassed(name);
    } catch (error) {
        results.addFailed(name, error);
        if (screenshotManager) {
            await screenshotManager.capture(page, `error-${name}`, { fullPage: true });
        }
    }
}

module.exports = {
    ScreenshotManager,
    AuthHelper,
    NavigationHelper,
    TableHelper,
    ModalHelper,
    TestResults,
    runTest
};
