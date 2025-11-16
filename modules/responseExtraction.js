/**
 * Response monitoring and text extraction module
 */

const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/logger');
const delay = require('../utils/delay');

const logger = new Logger('ResponseExtraction');

/**
 * Monitors for the stop button and waits until it disappears
 * @param {Page} page - Puppeteer page instance
 * @param {number} checkInterval - How often to check for the button (ms)
 */
async function waitForResponseComplete(page, checkInterval = 1000) {
  try {
    logger.step(4, 'Monitoring response generation...');
    logger.info(`Checking for stop button every ${checkInterval}ms`);

    let stopButtonExists = true;
    let checkCount = 0;

    while (stopButtonExists) {
      checkCount++;

      // Check if the stop button exists
      const stopButton = await page.$('[data-testid="stop-button"]');

      if (stopButton) {
        logger.debug(`Check #${checkCount}: Stop button found - response still generating...`);
        stopButtonExists = true;
      } else {
        // Double-check to make sure it's really gone
        await delay(500);
        const confirmGone = await page.$('[data-testid="stop-button"]');

        if (!confirmGone) {
          logger.success('Stop button no longer found - response generation complete!');
          stopButtonExists = false;
        } else {
          logger.debug(`Check #${checkCount}: False negative, button still exists`);
          stopButtonExists = true;
        }
      }

      // Wait before next check
      if (stopButtonExists) {
        await delay(checkInterval);
      }
    }

    // Additional delay to ensure all content is rendered
    logger.debug('Waiting additional 2 seconds for content to fully render...');
    await delay(2000);

    logger.success('Response monitoring completed');
  } catch (error) {
    logger.error('Error during response monitoring', error);
    throw error;
  }
}

/**
 * Extracts text content and citation links from the assistant's response
 * @param {Page} page - Puppeteer page instance
 * @returns {Promise<{text: string, links: string[]}>} The extracted text and citation links
 */
async function extractResponseText(page) {
  try {
    logger.step(5, 'Extracting response text and citation links...');

    // Wait for the assistant's article to be present
    await page.waitForSelector('article[data-testid^="conversation-turn-"]', {
      timeout: 10000,
    });

    logger.info('Looking for assistant response article...');

    // Extract text and links from the assistant's response
    const responseData = await page.evaluate(() => {
      // Find all articles with conversation-turn data-testid
      const articles = Array.from(document.querySelectorAll('article[data-testid^="conversation-turn-"]'));

      // Get the last article (most recent response)
      const assistantArticle = articles[articles.length - 1];

      if (!assistantArticle) {
        return { text: 'Error: Could not find assistant response article', links: [] };
      }

      // Extract citation links
      const citationPills = assistantArticle.querySelectorAll('span[data-testid="webpage-citation-pill"]');
      const links = [];

      citationPills.forEach((pill) => {
        const aTag = pill.querySelector('a');
        if (aTag && aTag.href) {
          links.push(aTag.href);
        }
      });

      // Function to extract text from an element and its children
      function extractText(element) {
        let text = '';

        // Get all text-containing elements
        const textElements = element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, code, pre');

        if (textElements.length === 0) {
          // If no specific elements found, get all text content
          return element.textContent.trim();
        }

        // Process each element
        textElements.forEach((el) => {
          const tagName = el.tagName.toLowerCase();
          const content = el.textContent.trim();

          if (content) {
            // Add formatting based on element type
            if (tagName.startsWith('h')) {
              text += '\n\n' + content + '\n' + '='.repeat(content.length) + '\n';
            } else if (tagName === 'li') {
              text += '\n• ' + content;
            } else if (tagName === 'pre' || tagName === 'code') {
              text += '\n```\n' + content + '\n```\n';
            } else {
              // Only add if it's not already included in a parent element
              const parentIsTextElement = el.parentElement &&
                ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(el.parentElement.tagName.toLowerCase());

              if (!parentIsTextElement) {
                text += '\n' + content;
              }
            }
          }
        });

        return text.trim();
      }

      return {
        text: extractText(assistantArticle),
        links: links
      };
    });

    if (!responseData.text || responseData.text.trim() === '') {
      logger.warn('No text content extracted from response');
      return { text: 'Error: Empty response extracted', links: [] };
    }

    logger.success(`Successfully extracted ${responseData.text.length} characters of text`);
    logger.success(`Found ${responseData.links.length} citation link(s)`);

    if (responseData.links.length > 0) {
      logger.debug(`Citation links: ${responseData.links.join(', ')}`);
    }

    logger.debug(`Text preview: ${responseData.text.substring(0, 100)}...`);

    return responseData;
  } catch (error) {
    logger.error('Failed to extract response text', error);
    throw error;
  }
}

/**
 * Saves the extracted text and links to a JSON file
 * @param {string} text - The text content to save
 * @param {string[]} links - The citation links to save
 * @param {string} query - The original query (used for filename)
 * @param {string} outputDir - Directory to save the file (default: 'output')
 * @returns {Promise<string>} Path to the saved file
 */
async function saveToFile(text, links, query, outputDir = 'output') {
  try {
    logger.step(6, 'Saving response to JSON file...');

    // Create output directory if it doesn't exist
    const fullOutputPath = path.join(process.cwd(), outputDir);
    await fs.mkdir(fullOutputPath, { recursive: true });

    // Generate filename from query and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedQuery = query
      .substring(0, 50)
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const filename = `chatgpt_response_${sanitizedQuery}_${timestamp}.json`;
    const filepath = path.join(fullOutputPath, filename);

    // Prepare JSON content
    const jsonContent = {
      query: query,
      timestamp: new Date().toISOString(),
      text: text,
      links: links
    };

    // Write to file with pretty formatting
    await fs.writeFile(filepath, JSON.stringify(jsonContent, null, 2), 'utf-8');

    logger.success(`Response saved to: ${filepath}`);
    logger.info(`Saved ${links.length} citation link(s) and ${text.length} characters of text`);

    return filepath;
  } catch (error) {
    logger.error('Failed to save response to file', error);
    throw error;
  }
}

/**
 * Complete workflow: monitor response, extract text and links, and save to file
 * @param {Page} page - Puppeteer page instance
 * @param {string} query - The original query
 * @param {number} checkInterval - How often to check for the stop button (ms)
 * @returns {Promise<{text: string, links: string[], filepath: string}>}
 */
async function extractAndSaveResponse(page, query, checkInterval = 1000) {
  try {
    logger.info('Starting response extraction workflow...');

    await waitForResponseComplete(page, checkInterval);
    const { text, links } = await extractResponseText(page);
    const filepath = await saveToFile(text, links, query);

    logger.success('Response extraction workflow completed successfully');

    return { text, links, filepath };
  } catch (error) {
    logger.error('Response extraction workflow failed', error);
    throw error;
  }
}

module.exports = {
  waitForResponseComplete,
  extractResponseText,
  saveToFile,
  extractAndSaveResponse,
};
