/**
 * Delay utility function
 */

/**
 * Creates a delay using Promise
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = delay;
