// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1

/** GLOBAL TODO
 *    1. Write out sortNewest function logic
 *    2. Write out showPastDate function logic
 *    3. Add input error handling to parseCommand
 *    5. Make file Doc header
 *    6. Add in ability to write/save separate .txt file containing relevant data
 * 
 */

//------------------------------------------ REQUIREMENTS ------------------------------------------ 

const { chromium, firefox, webkit } = require('playwright');

// Imports to be used in UI
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('node:process'); 

//------------------------------------------ USER-CALLED FUNCTIONS ------------------------------------------

// Helper functions for sortNewest

/**
 * Helper function that traverses Hacker News page, gets each entry and stores in a currEntry object.
 * 
 * @param {import('playwright').Page} page - Page object passed from UI.
 * @param {number} limit - Specified entry limit(default=100).
 */
async function extractEntriesFromPage(page, limit) {

  // Create array to store each entry object on page
  const entries = [];

  /**
   * IMPLEMENTATION PLAN:
   * - Select all story rows on page(contains rank, title)
   * - For each story row:
   *    - Get next sibling row containing link and time
   *    - Create entry object and push to array
   */
  

  // Entry object structure
  const currEntry = {
    rank: Number(entry.rank),
    title: entry.title,
    link: entry.link,
    time: new Date(entry.time)
  };

}

/**
 * Helper function used by sortNewest containing time-validation logic.
 * 
 * @function validateOrder
 * @param {Object} prev 
 * @param {Object} curr 
 * @returns 
 */
function validateOrder(prev, curr) {
  if (prev) {
      if (curr.rank !== (prev.rank + 1)) {
        console.warn(`Rank jump at ${curr.title}: got ${curr.rank}, expected ${prev.rank + 1}`);
      }

      // Each subsequent entry should be older than the previous
      if (curr.time > prev.time) {
        console.warn(`Chronological Error: ${curr.title} (${curr.time}) is newer than ${prev.title} (${prev.time}).`);
        return false;
      } else {
        console.log(`Entry Valid: ${curr.title} (${curr.time}) is older than ${prev.title} (${prev.time}).`);
        return true;
      }
    }
}

/**
 * 
 * Navigates to end of Hacker News 'newest' page and gets next page of entries.
 * 
 * @async
 * @function goToNextPage
 * @param {import('playwright').Page} page - Page object passed from UI.
 * @param {boolean} verbose - Boolean regarding the printout of specified entries.
 * @returns {boolean} Returns true if next page reached successfully.
 */
async function goToNextPage(page, verbose) {
  
}

/**
 * Goes to https://news.ycombinator.com/newest and validates that
 * the specified articles are sorted from newest to oldest. Default command
 * will output results requested by assignment.
 * 
 * @async
 * @function sortNewest
 * @param {import('playwright').Page} page - Page object passed from UI.
 * @param {number} limit - How many entries to grab(max 999).
 * @param {boolean} verbose - Boolean regarding the printout of specified entries.
 * @returns {Promise<void>} Returns when validation process is complete.
 */
async function sortNewest(page, { limit = 100, verbose = false }) { // no printout by default
  // Target URL
  await page.goto('https://news.ycombinator.com/newest', { waitUntil: 'domcontentloaded' });  // Added wait condition for quicker runtime
  console.log(`Validating newest ${limit} articles for chronology...`);

  // Initialize setup
  let prevEntry = null;
  let processed = 0;
  let invalidCount = 0;   // tracks number of incorrect chronological entries
  let finalValid = true;  // used for final output

  while (processed < limit) {
    // Specify number of entries needed on current page(max 30)
    const remaining = limit - processed;
    let entryCount = 30;
    if (remaining < 30) {
      entryCount = remaining;
    }
    
    const entries = await extractEntriesFromPage(page, entryCount);
    if (verbose) console.log(`Extracted Entries: ${entries}`);

    for (const entry of entries) {
      if (prevEntry !== null) {
        const isValid = validateOrder(prevEntry, entry);  // returns boolean
        if (verbose) console.log(`${entry.title} Validation result: ${isValid}`);

        if (!isValid) {
          finalValid = false;
          invalidCount++;
          // Potentially add additional verbose logging
        }
      }
      processed++;
      prevEntry = entry;

      if (processed >= limit) break;  // safety check each entry
    }

    if (processed >= limit) break;  // exit while loop if completed
    
    // If more to process, go to next page
    const success = await goToNextPage(page);
    if (!success) {
      console.warn("Next page not found before hitting limit; Exiting process early.");
      finalValid = false;
      break;
    }
  }

  // Final output
  console.log(`Process complete. Validated ${processed} of ${limit} entries with ${invalidCount} chronological errors.`);
  if (finalValid) {
    console.log(`All ${limit} entries are sorted newest to oldest!`);
  } else {
    console.log(`${invalidCount} entries are not correctly sorted.`);
  }
}

  /** TODO
   *  1. Helper func Loop thru first 30 entries collecting title, link and date
   *  COMPLETE 2. Check date against previous entry and ensure chronological ordering
   *  3. Continue looping every 30 entries until specified limit reached
   *  4. Print relevant data if applicable
   */



/**
 * Goes to https://news.ycombinator.com/front and grabs top 30 articles
 * 
 * @async
 * @param page Page passed from UI.
 * @param limit How many entries to grab(max 999).
 * @param date Date being accessed.
 */
async function showPastDate(page, { limit, date }) {
  // Target URL
  await page.goto(`https://news.ycombinator.com/front?date=${date}`, { waitUntil: 'domcontentloaded' });
  console.log(`Showing ${limit} past articles on ${date}...`);

  /** TODO
   * 1. Use same helper function as above to collect specified limit of info
   * 2. Print out relevant data
   */
}


//------------------------------------------ HELPER FUNCTIONS ------------------------------------------ 

/**
 * Helper function used by the UI to parse user's input for execution.
 * 
 * @param line User-inputted command line.
 * @returns { cmd, args }
 */
function parseCommand(line) {
  // Split user input into normalized token array
  const tokens = (line || '').trim().split(/\s+/).filter(Boolean);
  const [first, ...rest] = tokens;

  // Separates command from flags
  const cmd = (first || '').toLowerCase();

  // Loop to store normalized parsed flags
  const args = {};
  for (const token of rest) {
    if (token.startsWith('--') && token.includes('=')) {  // OR regex '/^--[^=]+=.*/.test(token)' for exact format
      const [k, v] = token.slice(2).split('=');
      args[k] = v;
    }
  }
  return { cmd, args };
}

/**
 * Helper function used by the UI to store browser setup logic.
 * 
 * @param line User-inputted command(y/n).
 * @returns { mode, speed }
 */
function setupBrowser(line) {
  // Default values
  let mode = false;
  let speed = 250;
  try {
    switch(line) {
      case 'y': {
        mode = false;
        speed = 250;
      }
      case 'n': {
        mode = true;
        speed = 0;
      }
      default: {
        console.log('Undefined input; Defaulting to visuals on...');
        mode = false;
        speed = 250;
      }
    }
  } catch(err) {
    console.error('Command failed: ', err || err?.message);
  }
  return { mode, speed };
}

//------------------------------------------ MAIN UI FUNCTION ------------------------------------------ 

  /**
   * Simple user-friendly UI wrapper function
   * 
   * @async
   * @author Ryan Novitski
   */
(async () => {
  // Create interface
  const rl = readline.createInterface({ input, output });

  // Setup browser preferences
  /* Choose browser(Chromium, Firefox, Webkit)? */
  const setup = await rl.question('Would you like to see script run in browser?[y/n]').toLowerCase();
  const { mode, speed } = setupBrowser(setup);
  const browser = await chromium.launch({
    headless: mode,
    slowMo: speed
  });
  const context = await browser.newContext();
  const prompt = async () => rl.question('Commands:\n  newest --limit=[1-999] --verbose=false\n  past --limit=[1-999] --date=YYYY-MM-DD\n  help\n  exit\n> ');

  // Begin UI
  try {
    while (true) {
      const input = await prompt();
      const { cmd, args } = parseCommand(input);

      /** COMMAND LOGIC */
      if (!cmd || cmd === 'help') {
        console.log('Available commands(case-sensitive): newest --limit=[1-999] --verbose=false \npast --limit=[1-999] --date=YYYY-MM-DD \nhelp \nexit');
        continue;
      }
      if (cmd === 'exit' || cmd === 'quit' || cmd === 'q') break;

      // Create new page
      const page = await context.newPage();
      try {
        switch (cmd) {
          case 'newest': {
            const newLimit = Math.max(1, Math.min(Number(args.limit) || 100, 999));
            const verbose = args.verbose === 'true'; // default is false
            await sortNewest(page, { newLimit, verbose });
            break;
          }
          case 'past': {
            const pastLimit = Math.max(1, Math.min(Number(args.limit) || 100, 999));
            const pastDate = args.date;
            if (!pastDate) {
              console.log('Usage: past --limit=[1-999] --date=YYYY-MM-DD'); 
              break;
            }
            await showPastDate(page, { pastLimit, pastDate });
            break;
          }
          default:
            console.log('Unknown command. Type "help" for options.');
        }        
      } catch(err) {
        console.error('Command failed: ', err || err?.message);
      } finally {
        await page.close();
      }
   }
  } finally {
    await context.close();
    await browser.close();
    rl.close();
    console.log('Browser closed!');
  }
})();
