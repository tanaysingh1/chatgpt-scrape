/**
 * Browserbase remote browser setup module
 */

const puppeteer = require("puppeteer-core");
const Browserbase = require("@browserbasehq/sdk");
const Logger = require("../utils/logger");
const delay = require("../utils/delay");

const logger = new Logger("BrowserbaseSetup");

// Get credentials from environment variables
const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

/**
 * Launches a Browserbase remote browser instance and connects via Puppeteer
 * @returns {Promise<{browser: Browser, page: Page, sessionId: string}>}
 */
async function setupBrowser() {
  try {
    logger.info("Initializing Browserbase remote browser setup...");

    // Validate environment variables
    if (!BROWSERBASE_API_KEY) {
      throw new Error("BROWSERBASE_API_KEY environment variable is not set");
    }
    if (!BROWSERBASE_PROJECT_ID) {
      throw new Error("BROWSERBASE_PROJECT_ID environment variable is not set");
    }

    // Initialize Browserbase client
    const bb = new Browserbase({
      apiKey: BROWSERBASE_API_KEY,
    });

    logger.info("Creating Browserbase session...");

    // Configure session with proxies to avoid datacenter detection
    // Using San Francisco (closest major city to Danville, CA)
    const sessionConfig = {
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: {
        viewport: {
          width: 1920,
          height: 1080,
        },
      },
      proxies: [
        {
          type: "browserbase",
          geolocation: {
            city: "SAN_FRANCISCO",
            state: "CA",
            country: "US",
          },
        },
      ],
    };

    logger.debug(
      "Session config: Using residential proxy in San Francisco, CA"
    );

    // Create a new remote browser session
    const session = await bb.sessions.create(sessionConfig);

    logger.success(`Browserbase session created: ${session.id}`);
    logger.info(
      `Session replay will be available at: https://browserbase.com/sessions/${session.id}`
    );

    // Connect to the remote browser
    logger.info("Connecting to remote browser...");
    const browser = await puppeteer.connect({
      browserWSEndpoint: session.connectUrl,
    });

    logger.success("Connected to remote browser successfully");

    // Get the existing page (Browserbase provides one by default)
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    // Block WebRTC to prevent IP leaking
    await page.evaluateOnNewDocument(() => {
      // Override WebRTC to prevent IP leaking
      const originalRTCPeerConnection = window.RTCPeerConnection;
      window.RTCPeerConnection = function (...args) {
        const pc = new originalRTCPeerConnection(...args);
        pc.createDataChannel = () => {
          throw new Error("Blocked");
        };
        return pc;
      };
    });

    logger.success("Remote browser configured with WebRTC blocking");

    return { browser, page, sessionId: session.id };
  } catch (error) {
    logger.error("Failed to setup Browserbase browser", error);
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
      waitUntil: "networkidle2",
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
 * Closes the browser instance and ends the Browserbase session
 * @param {Browser} browser - Puppeteer browser instance
 */
async function closeBrowser(browser) {
  try {
    logger.info("Closing remote browser...");
    await browser.close();
    logger.success("Remote browser session closed successfully");
    logger.info("View session replay at the URL logged during setup");
  } catch (error) {
    logger.error("Failed to close browser", error);
    throw error;
  }
}

module.exports = {
  setupBrowser,
  navigateToUrl,
  closeBrowser,
};
