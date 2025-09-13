// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1

/**
 * BRAINSTORMING IDEAS
 * 
 * NOTES ON HACKERNEWS POSTS:
 * - Page shows 30 results at a time
 * - Each entry is formatted as follows:
 *  - Top line: [Entry #] [Entry Title] ([Website URL])
 *  - Bottom line: [#] point(s) by [Poster Username] [# hours/minutes] ago
 * - Looks like each post has exact time posted in metadata under 'span.age'
 * - Easiest way to handle is probably to iterate through top 100 articles and
 *    comparing each entry's metadata post time with the previous.  Should only 
 *    need to remember last entry's time since they should all be chronological
 * - Can only do 30 entries at a time so that must be included in implementation of loop
 * - Traverse to next 30 entries via getByRole 'More' link
 *    
 * WAYS TO IMPROVE:
 * - Main question output options:
 *    - 1. No site output(simple T/F)
 *    - 2. Console read-only output(console.log())
 *    - 3. Write/save a file containing specified links
 * - Create a dynamic UI:
 *    - 1. Allows any specified number of articles to be used(with a set maximum of 999)
 *      - Trivial implementation once base UI complete
 *    - 2. Can choose a specific date to go back to  *** FIRST DAY OF POSTED ARTICLES === 2/19/2007!!! ***
 *      - NOTE: No longer perfectly chronological; ranking algorithm 'divides points by a power of the time since story was submitted'
 *      - I can do this 1 of 2 ways:
 *        - 1. Manually click through https://news.ycombinator.com/front links until correct date specified( awful, inconsistent worst case time complexity )
 *        - 2. Change URL to specified date(format is "...com/front?day=YYYY-MM-DD")
 *    - 3. Adjusts UTC time to whatever zone local machine is set to
 *        - Most likely trivial, need to look into JS handling of this
 *          - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
 *            - I believe correct object should be Date.getTimezoneOffset() (returns difference bet. current timezone and UTC in mins)
 *    - 4. MAYBE can sort by either newest->oldest OR number of points
 *      - This one is a maybe, have to see how badly it would affect time complexity
 *      - If full sort is unreasonable, can always passively keep track of entry with highest points
 */


//------------------------------------------ REQUIREMENTS ------------------------------------------ 

const { chromium } = require("playwright");
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('node:process');

//------------------------------------------ HELPER FUNCTIONS ------------------------------------------ 

/**
 * Goes to https://news.ycombinator.com/newest and validates that exactly
 * the first 100 articles are sorted from newest to oldest.
 * 
 * @async
 * @param page Page passed from UI.
 * @param limit How many entries to grab(max 999).
 * @param verbose Boolean regarding the printout of specified entries.
 */
async function sortNewest(page, { limit = 100, verbose = false }) { // no printout by default
  // Target URL
  await page.goto('https://news.ycombinator.com/newest', { waitUntil: 'domcontentloaded' });  // Added wait condition for quicker runtime
  /** TODO
   *  1. Helper func Loop thru first 30 entries collecting title, link and date
   *  2. Check date against previous entry and ensure chronological ordering
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
  const url = 'https://news.ycombinator.com/front?date=' + date;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

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
  const prompt = async () => rl.question(
`Commands:
  newest --limit=[1-999] --verbose=false
  past --limit=[1-999] --date=YYYY-MM-DD 
  help
  exit

> `
  );

  // Begin UI
  try {
    while (true) {
      const input = await prompt();
      const { cmd, args } = parseCommand(input);

      /** COMMAND LOGIC */
      if (!cmd || cmd === 'help') {
        console.log("Available commands(case-sensitive): \nnewest --limit=[1-999] --verbose=false \npast --limit=[1-999] --date=YYYY-MM-DD \nhelp \nexit");
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
        console.error('Command failed: ', err);
      } finally {
        await page.close();
      }
   }
  } finally {
    await context.close();
    await browser.close();
    console.log("Browser closed!");
  }
})();
