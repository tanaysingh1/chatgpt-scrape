/**
 * Query submission module - handles clicking search and sending queries
 */

const Logger = require("../utils/logger");

const logger = new Logger("QuerySubmission");

/**
 * Adds a random human-like delay
 * @param {number} min - Minimum delay in ms
 * @param {number} max - Maximum delay in ms
 */
async function randomDelay(min = 500, max = 1500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  logger.debug(`Adding human-like delay: ${delay}ms`);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Clicks the search/composer button
 * @param {Page} page - Puppeteer page instance
 */
async function clickSearchButton(page) {
  try {
    logger.step(1, "Looking for composer search button...");

    // Wait for the button to be available
    await page.waitForSelector('[data-testid="composer-button-search"]', {
      visible: true,
      timeout: 30000,
    });

    logger.success("Found composer search button");

    // Add a small delay before clicking
    await randomDelay(500, 1000);

    // Click the button
    await page.click('[data-testid="composer-button-search"]');

    logger.success("Clicked composer search button");

    // Wait for the textarea to appear
    await randomDelay(800, 1500);
  } catch (error) {
    logger.error("Failed to click search button", error);
    throw error;
  }
}

/**
 * Types the query into the prompt textarea with human-like typing
 * @param {Page} page - Puppeteer page instance
 * @param {string} query - The query to type
 */
async function typeQuery(page, query) {
  try {
    logger.step(2, `Typing query: "${query}"`);

    // Wait for the textarea to be available
    await page.waitForSelector("#prompt-textarea", {
      visible: true,
      timeout: 30000,
    });

    logger.success("Found prompt textarea");

    // Click on the textarea to focus it
    await page.click("#prompt-textarea");
    await randomDelay(300, 600);

    // Type the query with human-like delays between keystrokes
    await page.type("#prompt-textarea", query, {
      delay: Math.floor(Math.random() * 50) + 30, // Random delay between 30-80ms per character
    });

    logger.success("Query typed successfully");

    // Small delay before submitting
    await randomDelay(500, 1000);
  } catch (error) {
    logger.error("Failed to type query", error);
    throw error;
  }
}

/**
 * Clicks the submit button to send the query
 * @param {Page} page - Puppeteer page instance
 */
async function submitQuery(page) {
  try {
    logger.step(3, "Looking for submit button...");

    // Wait for the submit button to be available
    await page.waitForSelector('[id="composer-submit-button"]', {
      visible: true,
      timeout: 10000,
    });

    logger.success("Found submit button");

    // Add a small delay before clicking
    await randomDelay(300, 700);

    // Click the submit button
    await page.click('[id="composer-submit-button"]');

    logger.success("Clicked submit button - query sent!");

    // Wait for response to start generating
    await randomDelay(1000, 2000);
  } catch (error) {
    logger.error("Failed to submit query", error);
    throw error;
  }
}

/**
 * Complete workflow: click search, type query, and submit
 * @param {Page} page - Puppeteer page instance
 * @param {string} query - The query to submit
 */
async function submitQueryWorkflow(page, query) {
  try {
    logger.info("Starting query submission workflow...");

    await clickSearchButton(page);
    await typeQuery(page, query);
    await submitQuery(page);

    logger.success("Query submission workflow completed successfully");
  } catch (error) {
    logger.error("Query submission workflow failed", error);
    throw error;
  }
}

module.exports = {
  submitQueryWorkflow,
  clickSearchButton,
  typeQuery,
  submitQuery,
};
