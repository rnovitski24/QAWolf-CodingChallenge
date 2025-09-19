// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1

/** GLOBAL TODO
 *    1. Write out sortNewest function logic
 *    2. Write out showPastDate function logic
 *    3. Add error handling to parseCommand
 *    4. Add more robust, customized error handling to main function
 *      - Ensure all variables are correctly typed before passing to other functions
 *    5. Make file Doc header
 *    6. Add in ability to write/save separate .txt file containing relevant data
 * 
 */

//------------------------------------------ REQUIREMENTS ------------------------------------------ 

const { chromium } = require('playwright');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('node:process');

//------------------------------------------ HELPER FUNCTIONS ------------------------------------------ 

/**
 * Goes to https://news.ycombinator.com/newest and validates that
 * the specified articles are sorted from newest to oldest. Default command
 * will output results requested by assignment.
 * 
 * @async
 * @param page Page passed from UI.
 * @param limit How many entries to grab(max 999).
 * @param verbose Boolean regarding the printout of specified entries.
 */
async function sortNewest(page, { limit = 100, verbose = false }) { // no printout by default
  // Target URL
  await page.goto('https://news.ycombinator.com/newest', { waitUntil: 'domcontentloaded' });  // Added wait condition for quicker runtime
  console.log(`Validating newest ${limit} articles for chronology...`);

  let prevEntry = null;

  for (const entry of entries) {
    const currEntry = {
      rank: Number(entry.rank),
      title: entry.title,
      link: entry.link,
      time: new Date(entry.time)
    };

    if (prevEntry) {
      if (currEntry.rank !== (prevEntry.rank + 1)) {
        console.warn(`Rank jump at ${currEntry.title}: got ${currEntry.rank}, expected ${prevEntry.rank + 1}`);
      }

      // Each subsequent entry should be older than the previous
      if (currEntry.time > prevEntry.time) {
        console.warn(`Chronological Error: ${currEntry.title} (${currEntry.time}) is newer than ${prevEntry.title}`);
      }
    }
    prevEntry = currEntry;
  }
  /** TODO
   *  1. Helper func Loop thru first 30 entries collecting title, link and date
   *  COMPLETE 2. Check date against previous entry and ensure chronological ordering
   *  3. Continue looping every 30 entries until specified limit reached
   *  4. Print relevant data if applicable
   */





}

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



/**
 * COMMAND PARSING 
 * 
 * @param line User-inputted command line.
 * @returns { cmd, args }
 */
function parseCommand(line) {
  const tokens = (line || '').trim().split(/\s+/).filter(Boolean);
  const [cmdRaw, ...rest] = tokens;
  const cmd = (cmdRaw || '').toLowerCase();
  const args = {};

  for (const token of rest) {
    if (/^--[^=]+=.*/.test(token)) {
      const [k, v] = token.slice(2).split('=');
      args[k] = v;
    }
  }
  return { cmd, args };
}

//------------------------------------------ MAIN UI FUNCTION ------------------------------------------ 

  /**
   * Simple user-friendly UI wrapper function
   * 
   * @async
   * @author Ryan Novitski
   */
(async () => {
  // Setup
  const rl = readline.createInterface({ input, output });
  const browser = await chromium.launch({
      headless: false,
      slowMo: 250
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
