// Practice file for testing
// Scrape wikipedia for 'Today's featured article'

/*
Playwright Lifecycle:
	1.	Launch Browser
	2.	Create Context
	3.	Open Page
	4.	Navigate
	5.	Locate Elements
	6.	Interact
	7.	Extract
	8.	Validate
	9.	Close
*/

const { chromium } = require("playwright");

async function scrapeWikipediaFeaturedArticle() {
    // 1. Launch browser
    const browser = await chromium.launch({
        headless: false,    // Opens browser to watch what happens
        slowMo: 250 // Slows each step for viewing purposes
    });

    // 2. Create context
    const context = await browser.newContext();

    // 3. Open page
    const page = await context.newPage();

    // 4. Navigate to website
    await page.goto("https://www.wikipedia.org", { waitUntil: 'domcontentloaded' });

    // 5. Locate 'English' button
    // Test to make sure it has it
    const englishPage = page.getByRole('link', { name: /english/i});
    await englishPage.click();

    // Makes sure on right page
    await page.waitForURL('https://en.wikipedia.org/wiki/Main_Page', { waitUntil: 'domcontentloaded' });
    const tfaHeading = page.getByRole('heading', { name: /featured article/i });

    const headingText = await tfaHeading.innerText();
    console.log(headingText);

    const paragraph = await tfaHeading.evaluate((tfa) => {
        let nxt = tfa.nextElementSibling;
        const isHeading = (e) => e && /^H[1-6]$/i.test(e.tagName);

        while (nxt && !isHeading(nxt)) {
            if (nxt.tagName?.toLowerCase() === 'p' && nxt.innerText) {
                return nxt.innerText.trim();
            }
            const p = nxt.querySelector && nxt.querySelector('p');
            if (p?.innerText) return p.innerText.trim();
            nxt = nxt.nextElementSibling;
        }
        return null;
    });

    console.log(paragraph);

    await browser.close();


}

scrapeWikipediaFeaturedArticle();