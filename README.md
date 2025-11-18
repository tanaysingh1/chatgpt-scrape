# ChatGPT Web Scraper

A modular web scraper for ChatGPT built with Puppeteer, featuring robust logging and anti-bot best practices.

## Features

- **Modular Architecture**: Clean separation of concerns across multiple modules
- **Robust Logging**: Comprehensive logging at every step with color-coded output
- **Anti-Bot Measures**: Human-like behavior with random delays, realistic user agent, and browser fingerprint masking
- **Automated Workflow**: Complete automation from query submission to response extraction

## Project Structure

```
thomas-gpt-scrape/
├── index_local.js                          # Main orchestrator( local)
├── index_remote.js                         # Main orchestrator( remote)
├── modules/
│   ├── browserbaseSetup.js           # Browser initialization( remote on browserbase) and navigation
│   ├── browserSetup.js               # Browser initialization( ) and navigation
│   ├── querySubmission.js            # Search button clicking and query typing
│   └── responseExtraction.js         # Response monitoring and text extraction
├── utils/
│   └── logger.js                     # Logging utility
├── output/                           # Generated response files (auto-created)
└── package.json
```

## Installation

```bash
npm install
```

## Usage

You can choose to run either the local or BrowserBase version, but unfrotunately ChatGPT search is blocked for BrowserBase servers and they give very little control on stealth options, so it won't search the web.

UPDATE: ChatGPT has blocked all BrowserBase traffic completely, so it can load the site but ChatGPT won't respond.

Run the scraper with a query:

```bash
node index_local.js "Your question here"
```

## How It Works

1. **Browser Setup** (`modules/browserSetup.js`)

   - Launches Puppeteer browser in non-headless mode
   - Configures anti-detection measures (user agent, headers, navigator properties)
   - Navigates to ChatGPT with human-like delays

2. **Query Submission** (`modules/querySubmission.js`)

   - Clicks the search/composer button (`data-testid="composer-button-search"`)
   - Types the query into the prompt textarea (`id="prompt-textarea"`)
   - Clicks the submit button (`data-testid="composer-submit-button"`)
   - All actions include random human-like delays

3. **Response Extraction** (`modules/responseExtraction.js`)
   - Monitors for the stop button (`data-testid="stop-button"`) at 1-second intervals
   - Waits until the stop button disappears (response complete)
   - Extracts all text from the assistant's response article
   - Saves the response to a text file in the `output/` directory

## Anti-Bot Best Practices

- Random delays between actions (500ms - 2000ms)
- Human-like typing speed (30-80ms per character)
- Realistic user agent and HTTP headers
- Disabled automation flags (`navigator.webdriver = false`)
- Non-headless browser mode for realistic behavior
- Network idle waiting for page loads

## Logging

The scraper provides detailed logging with different levels:

- **INFO** (Blue): General information
- **SUCCESS** (Green): Successful operations
- **WARN** (Yellow): Warnings
- **ERROR** (Red): Errors with stack traces
- **DEBUG** (Cyan): Detailed debugging information
- **STEP** (Bright): Major workflow steps

## Output

Responses are saved to the `output/` directory with filenames in the format:

```
chatgpt_response_{sanitized_query}_{timestamp}.txt
```

Each file includes:

- Original query
- Timestamp
- Full response text
- Formatted content (headers, lists, code blocks)

## Configuration

You can modify the following in the code:

- `CHECK_INTERVAL` in `index.js`: How often to check for the stop button (default: 1000ms)
- Random delay ranges in `querySubmission.js`: Adjust human-like timing
- User agent in `browserSetup.js`: Change browser fingerprint
- Output directory in `responseExtraction.js`: Change where files are saved

## Error Handling

The scraper includes comprehensive error handling:

- Each module logs errors with stack traces
- Failed operations throw errors up to the main orchestrator
- Browser is properly closed even if errors occur
- Exit codes indicate success (0) or failure (1)

## Notes

- The browser will remain open for 5 seconds after completion so you can see the result
- Requires an active internet connection
- May need to solve CAPTCHA manually if triggered
- Ensure you have sufficient permissions to run Chromium
