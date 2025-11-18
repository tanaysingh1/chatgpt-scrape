/**
 * ChatGPT Web Scraper - Main Orchestrator
 *
 * Usage: node index.js "Your query here"
 */

// Load environment variables from .env file
require("dotenv").config();

const {
  setupBrowser,
  navigateToUrl,
  closeBrowser,
} = require("./modules/browserbaseSetup");
const { submitQueryWorkflow } = require("./modules/querySubmission");
const { extractAndSaveResponse } = require("./modules/responseExtraction");
const Logger = require("./utils/logger");
const delay = require("./utils/delay");

const logger = new Logger("Main");

const CHATGPT_URL = "https://chatgpt.com/";
const CHECK_INTERVAL = 1000; // Check for stop button every 1 second

// Global browser reference for cleanup on interrupt
let globalBrowser = null;

/**
 * Main scraper function
 * @returns {Promise<number>} Exit code (0 for success, 1 for failure)
 */
async function runScraper() {
  let browser = null;
  let exitCode = 0;

  try {
    // Get query from command line arguments
    const query = process.argv[2];

    if (!query) {
      logger.error("No query provided!");
      console.log('\nUsage: node index.js "Your query here"');
      console.log('Example: node index.js "How are you doing today?"\n');
      return 1;
    }

    logger.info("=".repeat(80));
    logger.info("ChatGPT Web Scraper Started");
    logger.info("=".repeat(80));
    logger.info(`Query: "${query}"`);
    logger.info("=".repeat(80));

    // Step 1: Setup browser and navigate
    const { browser: browserInstance, page, sessionId } = await setupBrowser();
    browser = browserInstance;
    globalBrowser = browserInstance; // Store for signal handler cleanup

    if (sessionId) {
      logger.info(`Browserbase Session ID: ${sessionId}`);
    }

    await navigateToUrl(page, CHATGPT_URL);

    // Step 2: Submit the query
    await submitQueryWorkflow(page, query);

    // Step 3: Wait for response and extract text
    const { text, links, filepath } = await extractAndSaveResponse(
      page,
      query,
      CHECK_INTERVAL
    );

    // Success summary
    logger.info("=".repeat(80));
    logger.success("SCRAPING COMPLETED SUCCESSFULLY!");
    logger.info("=".repeat(80));
    logger.info(`Response length: ${text.length} characters`);
    logger.info(`Citation links found: ${links.length}`);
    if (links.length > 0) {
      links.forEach((link, index) => {
        logger.info(`  [${index + 1}] ${link}`);
      });
    }
    logger.info(`Saved to: ${filepath}`);
    if (sessionId) {
      logger.info(
        `View session replay: https://browserbase.com/sessions/${sessionId}`
      );
    }
    logger.info("=".repeat(80));

    // Keep browser open for a moment so user can see the result
    logger.info("Keeping browser open for 5 seconds...");
    await delay(5000);
  } catch (error) {
    logger.error("Scraper failed with error", error);
    exitCode = 1;
  } finally {
    // Cleanup - always runs even on error
    if (browser) {
      try {
        await closeBrowser(browser);
        globalBrowser = null; // Clear global reference
      } catch (closeError) {
        logger.error("Error closing browser during cleanup", closeError);
        exitCode = 1;
      }
    }
  }

  return exitCode;
}

/**
 * Cleanup handler for process interruption (Ctrl+C, etc.)
 */
async function handleInterrupt(signal) {
  logger.warn(`\n${signal} received - cleaning up browser session...`);

  if (globalBrowser) {
    try {
      await closeBrowser(globalBrowser);
      globalBrowser = null;
      logger.success("Browser cleanup completed");
    } catch (error) {
      logger.error("Error during interrupt cleanup", error);
    }
  }

  process.exit(130); // Standard exit code for SIGINT
}

// Register signal handlers for graceful shutdown
process.on("SIGINT", () => handleInterrupt("SIGINT"));
process.on("SIGTERM", () => handleInterrupt("SIGTERM"));

// Run the scraper and handle exit
runScraper()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    logger.error("Unhandled error in scraper", error);
    process.exit(1);
  });
