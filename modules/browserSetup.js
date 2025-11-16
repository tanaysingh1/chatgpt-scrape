/**
 * Browser setup module with anti-bot best practices
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Logger = require('../utils/logger');
const delay = require('../utils/delay');

// Use stealth plugin to evade bot detection
puppeteer.use(StealthPlugin());

const logger = new Logger('BrowserSetup');

/**
 * Launches a Puppeteer browser instance with anti-detection configurations
 * @returns {Promise<{browser: Browser, page: Page}>}
 */
async function setupBrowser() {
  try {
    logger.info('Initializing browser setup...');

    // Launch browser with stealth plugin (handles most anti-detection automatically)
    const browser = await puppeteer.launch({
      headless: false, // Non-headless as requested
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080',
        '--start-maximized',
      ],
    });

    logger.success('Browser launched successfully');

    const page = await browser.newPage();

    logger.success('Page configured with stealth plugin (automatic anti-detection)');

    return { browser, page };
  } catch (error) {
    logger.error('Failed to setup browser', error);
    throw error;
  }
}

/**
 * Navigates to a URL with human-like behavior
 * @param {Page} page - Puppeteer page instance
 * @param {string} url - URL to navigate to
 */
async function navigateToUrl(page, url) {
  try {
    logger.info(`Navigating to ${url}...`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Add a random delay to appear more human-like (1-3 seconds)
    const delayTime = Math.floor(Math.random() * 2000) + 1000;
    logger.debug(`Waiting ${delayTime}ms before proceeding...`);
    await delay(delayTime);

    logger.success(`Successfully navigated to ${url}`);
  } catch (error) {
    logger.error(`Failed to navigate to ${url}`, error);
    throw error;
  }
}

/**
 * Closes the browser instance
 * @param {Browser} browser - Puppeteer browser instance
 */
async function closeBrowser(browser) {
  try {
    logger.info('Closing browser...');
    await browser.close();
    logger.success('Browser closed successfully');
  } catch (error) {
    logger.error('Failed to close browser', error);
    throw error;
  }
}

module.exports = {
  setupBrowser,
  navigateToUrl,
  closeBrowser,
};
