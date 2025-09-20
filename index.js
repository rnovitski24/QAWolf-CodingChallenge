// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1

//------------------------------------------ REQUIREMENTS --------------------------------------------------------- 

const { chromium } = require('playwright');

// Imports to be used in UI
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const fs = require('node:fs/promises'); // for I/O 

//------------------------------------------ OBJECT DEFINITIONS ---------------------------------------------------

/**
 * A single Hacker News entry extracted from the page.
 * @typedef {Object} HNEntry
 * @property {number} rank      - Rank as shown on the page.
 * @property {string} title     - Visible title text.
 * @property {string|null} link - HREF of the title (null if missing).
 * @property {Date|null} time   - Parsed timestamp from metadata (null if missing).
 */

//------------------------------------------ USER-BASED HELPER FUNCTIONS ------------------------------------------ 

/**
 * Helper function that traverses Hacker News page, gets each entry and stores in a currEntry object.
 * 
 * Although user-facing locators are recommended, there are not many options to use them on Hacker News.
 * So, CSS locators will be used for everything except the 'More' link, which stays consistent across every
 * page.
 * 
 * @async
 * @param {import('playwright').Page} page         - Page object passed from UI.
 * @param {number} pageLimit                       - Limit of stories to grab on specified page(30 or less).
 * @param {boolean} [verbose=false]                - Boolean regarding the printout of specified entries.
 * @returns {Promise<HNEntry[]>}                   - Array of extracted entries
 */
async function extractEntriesFromPage(page, pageLimit, verbose) {
  // Create array to store each entry object on page
  const entryObjs = [];

  // Use locator to find each row containing rank/title
  const entries = page.locator('tr.athing');
  const count = await entries.count();
  if (count !== 30 && verbose) console.warn(`30 title rows expected on page, but got ${count}.`);

  // Specify limit if not traversing entire page
  for (let i = 0; i < Math.min(pageLimit, count); i++) {
    // Extract relevant rows for each post
    const entry = entries.nth(i);

    // Metadata row is immediate next <tr>
    const metadata = entry.locator(':scope + tr');

    // Get rank and normalize as number
    const rankString = await entry.locator('.rank').innerText();
    const rank = parseInt(rankString, 10);

    // Get row containing title and link
    const tl = entry.locator('.titleline > a');
    const title = await tl.innerText();
    const link = await tl.getAttribute('href');

    // get ISO and convert to JS Date object
    const dirtyIso = await metadata.locator('td.subtext .age').getAttribute('title'); // contains ISO and Unix timestamps
    const cleanIso = dirtyIso.split(' ')[0];  // remove Unix stamp
    const time = cleanIso ? new Date(cleanIso) : null;

    // Create object to push to array
    const currEntry = {
      rank: rank,
      title: title,
      link: link,
      time: time
    };

    entryObjs.push(currEntry);
  }

  // Check if all specified entries were added
  if (entryObjs.length !== pageLimit && verbose) console.warn(`Expected ${pageLimit} entries but got ${entryObjs.length}`);
  return entryObjs;
}

/**
 * Helper function used by sortNewest containing time-validation logic.
 * 
 * @param {HNEntry|null} prev         - Previously validated entry (null for first entry).
 * @param {Object} curr               - Current entry to validate.
 * @param {boolean} [verbose=false]   - Boolean regarding the printout of specified entries.
 * @returns {boolean}                 - True if 'curr' is in correct chronological order.
 */
function validateOrder(prev, curr, verbose) {
  if (prev) {
      if (curr.rank !== (prev.rank + 1)) {
        console.warn(`Rank jump at ${curr.title}: got ${curr.rank}, expected ${prev.rank + 1}`);
      }

      // Each subsequent entry should be older than the previous
      if (curr.time > prev.time) {
        console.warn(`Chronological Error: ${curr.title} (${curr.time}) is newer than ${prev.title} (${prev.time}).`);
        return false;
      } else {
        return true;
      }
    }
}

/**
 * 
 * Navigates to end of Hacker News 'newest' page and gets next page of entries by clicking
 * 'More' link.
 * 
 * @async
 * @param {import('playwright').Page} page       - Page object passed from UI.
 * @param {boolean} [verbose=false]              - Boolean regarding the printout of specified entries.
 * @returns {Promise<boolean>}                   - Returns true if next page reached successfully.
 */
async function goToNextPage(page, verbose) {
  // Click on 'More' link at bottom of page
  try {
    // waits for DOM content to load before clicking link
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      page.getByRole('link', { name : 'More', exact: true }).click()
    ]);
    if (verbose) console.log(`Next page successfully loaded.`);
    return true;

  } catch (err) {
      console.warn(`Could not click on 'More' link: ${err.message}`);
      return false;
  }
}

/**
 * Save an array of lines to a text file.
 *
 * @param {string} filePath               - Destination path
 * @param {string[]} lines                - One line per entry (no trailing newlines required).
 * @param {{ append?: boolean }} [opt]    - If { append: true }, will append instead of overwrite.
 * @returns {Promise<void>}
 */
async function writeLines(filePath, lines, opt = {}) {
  // join the array into a single string with newlines
  const text = lines.join('\n') + '\n';   // '\n' ensures the file ends with newline

  if (opt.append) {
    await fs.appendFile(filePath, text, 'utf8'); // append text to existing file (creates if missing)
  } else {
    await fs.writeFile(filePath, text, 'utf8');  // overwrite or create the file
  }
}

//------------------------------------------ USER-CALLED FUNCTIONS ------------------------------------------

/**
 * Goes to https://news.ycombinator.com/newest and validates that
 * the specified number of articles are sorted from newest to oldest. Default command
 * will output results requested by assignment.
 * 
 * @async
 * @param {import('playwright').Page} page  - Page object passed from UI.
 * @param {number} [limit=100]              - Specified entry limit(max 999; default=100).
 * @param {boolean} [verbose=false]         - Boolean regarding the printout of specified entries.
 * @returns {Promise<boolean>}              - Returns when validation process is complete.
 */
async function sortNewest(page, limit = 100, verbose = false) { // no printout by default
  // Target URL
  await page.goto('https://news.ycombinator.com/newest', { waitUntil: 'domcontentloaded' });  // Added wait condition for quicker runtime
  console.log(`Validating newest ${limit} articles for chronology...`);

  // Initialize setup
  let prevEntry = null;
  let processed = 0;
  let finalValid = true;  // used for final output
  const invalidEntries = [];  // tracks number of incorrect chronological entries by rank

  while (processed < limit) {
    // Specify number of entries needed on current page(max 30)
    const remaining = limit - processed;
    let entryCount = 30;
    if (remaining < 30) {
      entryCount = remaining;
    }
    
    if (verbose) console.log(`Ready to extract ${entryCount} entries. Processed: ${processed} of ${limit} (${remaining} remaining.)`);
    const entries = await extractEntriesFromPage(page, entryCount, verbose);
    if (verbose) console.log(`Extracted ${entries.length} entries.`);

    for (const entry of entries) {
      if (prevEntry !== null) {
        const isValid = validateOrder(prevEntry, entry, verbose);  // returns boolean
        if (verbose) console.log(`Entry ${entry.rank} result: ${isValid}`);

        if (!isValid) {
          finalValid = false;
          invalidEntries.push(entry.rank);
        }
      } else {
        if (verbose) console.log(`Entry ${entry.rank} result: true`); // for clarity
      }
      processed++;
      prevEntry = entry;

      if (processed >= limit) break;  // safety check each entry
    }

    if (processed >= limit) break;  // exit while loop if completed
    
    // If more to process, go to next page
    if (verbose) {
      console.log(`${processed} of ${limit} entries processed with ${invalidEntries.length} chronological errors.`);
      console.log(`Traversing to next page...`);
    }
    const success = await goToNextPage(page);
    if (!success) {
      console.warn("Next page not found before hitting limit; Exiting process early.");
      finalValid = false;
      break;
    }
  }

  // Final output
  console.log(`Process complete. Validated ${processed} of ${limit} entries with ${invalidEntries.length} chronological errors.`);
  if (finalValid) {
    console.log(`All ${limit} entries are sorted newest to oldest!`);
    return true;
  } else {
    console.log(`${invalidEntries.length} entries are not correctly sorted.`);
    console.log(`Invalid article ranks: ${invalidEntries}`);
    return false;
  }
}



/**
 * Goes to https://news.ycombinator.com/front and prints top 30 articles
 * with links.
 * 
 * @async
 * @param {import('playwright').Page} page} - Page passed from UI.
 * @param {number} [limit=50]               - How many entries to grab(max 100).
 * @param {string} date                     - Date being accessed.
 * @param {boolean} verbose                 - Boolean regarding printout of log.
 */
async function showPastDate(page, limit=50, date, verbose) {
  // Target URL
  await page.goto(`https://news.ycombinator.com/front?day=${date}`, { waitUntil: 'domcontentloaded' });
  console.log(`Showing ${limit} past articles on ${date}...`);

  const rl = readline.createInterface({ input, output });
  let processed = 0;
  const report = [];  // will store lines to write to file

  while (processed < limit) {
    // Specify number of entries needed on current page(max 30)
    const remaining = limit - processed;
    let entryCount = 30;
    if (remaining < 30) {
      entryCount = remaining;
    }
    
    if (verbose) console.log(`Ready to extract ${entryCount} entries. Processed: ${processed} of ${limit} (${remaining} remaining.)`);
    const entries = await extractEntriesFromPage(page, entryCount, verbose);
    if (verbose) console.log(`Extracted ${entries.length} entries.`);

    for (const entry of entries) {
      report.push(`${entry.rank}. ${entry.title} - ${entry.link ?? '(no link)'}`);
      if (verbose) console.log(`Article rank ${entry.rank} pushed to list.`);
      processed++;
      if (processed >= limit) break;  // exit while loop if completed
    }
    if (processed >= limit) break;

    // Usually means ran out of articles for the day
    if (entries.length < entryCount) {
      if (verbose) console.log(`Maximum articles reached for the requested day (${processed})`);
    }  
    // If more to process, go to next page
    if (verbose) {
      console.log(`${processed} of ${limit} entries processed.`);
      console.log(`Traversing to next page...`);
    }
    const success = await goToNextPage(page);
    if (!success) {
      console.warn("Next page not found before hitting limit; Exiting process early.");
      break;
    }
  }

  // Final output
  console.log(`Process complete. Validated ${processed} of ${limit} requested entries.`);
  const response = await rl.question(`Please confirm if you would like to write out data[y/n]: `);
  try {
    switch(response.toLowerCase()) {
      case 'yes':
      case 'y': {
        const stamp = new Date().toISOString().replace(/[:]/g, '-'); // safe for filenames
        const file = `hn-output-${date}-accessed-${stamp}.txt`;
        await writeLines(file, report);
        console.log(`Report saved to ${file}`);
        break;
      }
      case 'no':
      case 'n': {
        console.log(`Report not saved.`);
        break;
      }
      default: {
        console.log('Undefined input; Defaulting print to console...');
        console.log(`${report}`);        
      }
    }
  } catch(err) {
    console.error('Command failed: ', err || err?.message);
  }
}


//------------------------------------------ UI HELPER FUNCTIONS ------------------------------------------ 

/**
 * Helper function used by the UI to parse user's input for execution.
 * 
 * @param {string} line         - User-inputted command line.
 * @returns { cmd, args }       - Command token and mapping of args.
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
 * @param {string} line         - User-inputted command(y/n).
 * @returns { mode, speed }     - Values for headless and slowMo.
 */
function setupBrowser(line) {
  // Default values
  let mode = false;
  let speed = 250;
  console.log(`Setting up browser...`);
  try {
    switch(line) {
      case 'yes':
      case 'y': {
        console.log(`Setting headless mode to false and slowMo to 250ms...`);
        mode = false;
        speed = 250;
        break;
      }
      case 'no':
      case 'n': {
        console.log(`Setting headless mode to true and slowMo to 0ms...`);
        mode = true;
        speed = 0;
        break;
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

/**
 * Ensures chosen date is within scope. (2/19/2007->12/31/2024)
 * IMPORTANT: SOME EDGE CASE DATES MAY STILL NOT BE COVERED WITH CURRENT IMPLEMENTATION
 *    - i.e. Specifying 31st day of month with 30 days may cause error
 * 
 * @param {string} date   - Date to validate
 * @returns {boolean}
 */
function valiDate(date) {
    // Parse inputted date and validate its scope
    if (!date) return false;
    const dateList = date.split('-');
    const year = Number(dateList[0]);
    if (!year || year < 2007 || year > 2024) {
      console.log(`Year ${year} invalid.`);
      return false; 
    }
    const month = Number(dateList[1]);
    if (!month || month < 1 || month > 12) {
      console.log(`Month ${month} invalid.`);
      return false;
    }
    const day = Number(dateList[2]);
    if (!day || day < 1 || day > 31) {
      console.log(`Day ${day} invalid.`);
      return false;
    }
    return true;

}

//------------------------------------------ MAIN UI FUNCTION ------------------------------------------ 

  /**
   * Simple user-friendly UI wrapper function
   * 
   * @async
   * @author Ryan Novitski
   * @returns {Promise<void>}
   */
(async () => {
  // Create interface
  const rl = readline.createInterface({ input, output });

  // Setup browser preferences
  /* Choose browser(Chromium, Firefox, Webkit)? */
  const setup = await rl.question('Would you like to see script run in browser?[y/n]: ');
  const { mode, speed } = setupBrowser(setup.toLowerCase());
  const browser = await chromium.launch({
    headless: mode,
    slowMo: speed
  });

  const context = await browser.newContext();
  const prompt = async () => rl.question('Commands:\n  newest --limit=[1-999] --verbose=false\n  past --limit=[1-200] --date=YYYY-MM-DD --verbose=false\n  help\n  clear\n  exit\n> ');

  // Begin UI
  try {
    while (true) {
      const input = await prompt();
      const { cmd, args } = parseCommand(input);

      /** COMMAND LOGIC */
      if (!cmd || cmd === 'help') {
        console.log('          newest: Validates that specified articles are in chronological order.\n          past: Writes out specified data.');
        continue;
      }
      if (cmd === 'clear') {
        console.clear();
        continue;
      }
      if (cmd === 'exit' || cmd === 'quit' || cmd === 'q') break;

      // Create new page
      const page = await context.newPage();
      try {
        switch (cmd) {
          case 'newest': {
            let newLimit = 100;
            if (args.limit && args.limit >= 1 && args.limit <= 999) {
              newLimit = args.limit;
              console.log(`Limit set to ${args.limit}`);
            } else {
              console.log(`Limit undefined or out of scope. Defaulting to 100...`);
            }
            const verbose = args.verbose === 'true'; // default is false
            console.log(`Verbose mode set to ${verbose}`);
            await sortNewest(page, newLimit, verbose);
            break;
          }
          case 'past': {
            let pastLimit = 50;
            let pastDate = '2020-01-01';  // arbitrary default date; earliest date 2/19/2007
            if (args.limit && args.limit >= 1 && args.limit <= 200) {
              pastLimit = args.limit;
              console.log(`Limit set to ${args.limit}`);
            } else {
              console.log(`Limit undefined or out of scope. Defaulting to 50...`);
            }
            const verbose = args.verbose === 'true'; // default is false
            console.log(`Verbose mode set to ${verbose}`);
            const valid = valiDate(args.date); // checks to make sure date is accessible
            if (valid) {
              pastDate = args.date;
            } else {
              console.log(`Date undefined or out of scope. Defaulting to 2020-01-01...`);
            }
            console.log(`Initial date set to ${pastDate}.`);
            await showPastDate(page, pastLimit, pastDate, verbose);
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
