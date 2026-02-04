/**
 * Playwright Configuration for MES Production Confirmation E2E Tests
 */

module.exports = {
    // Base URLs
    baseUrl: 'http://localhost:4200',
    apiUrl: 'http://localhost:8080',

    // Test credentials
    credentials: {
        admin: {
            email: 'admin@mes.com',
            password: 'admin123'
        }
    },

    // Browser settings
    browser: {
        headless: true,
        args: ['--disable-web-security'],
        slowMo: 0  // Set to 100 for debugging
    },

    // Viewport settings
    viewport: {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1
    },

    // Timeouts (in milliseconds)
    timeouts: {
        navigation: 30000,
        action: 10000,
        assertion: 5000,
        uiSettle: 500
    },

    // Screenshot settings
    screenshots: {
        enabled: true,
        fullPage: false,
        outputDir: '../output/screenshots'
    },

    // Video settings
    video: {
        enabled: true,
        outputDir: '../output/videos',
        size: { width: 1440, height: 900 }
    },

    // Test retry settings
    retries: 0,

    // Reporter settings
    reporter: 'console'
};
