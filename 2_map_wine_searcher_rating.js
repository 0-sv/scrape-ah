const fs = require("fs").promises;
const path = require("path");
const { chromium } = require("playwright-extra");
require("dotenv").config();

const stealth = require("puppeteer-extra-plugin-stealth")();

(async () => {
  let lastProcessedIndex = -1;
  chromium.use(stealth);

  try {
    // Read the results.json file
    const filePath = path.resolve(__dirname, "results.json");
    const data = await fs.readFile(filePath, "utf8");
    const products = JSON.parse(data);

    // Define a realistic user-agent
    const userAgent = "Chrome/93.0.4577.63";

    // Launch Chromium in headless mode, but with realistic settings
    const browser = await chromium.launch({
      headless: false, // Run in a non-headless mode so you can see what's happening
    });

    // Create a new page directly from the browser
    let page = await browser.newPage();

    // Configure the page
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.setExtraHTTPHeaders({
      "User-Agent": userAgent,
    });

    let lastProcessedIndex = -1;

    // Loop through all products
    const startIndex = process.env.LAST_ITEM_SUCCESSFULLY_PROCESSED
      ? parseInt(process.env.LAST_ITEM_SUCCESSFULLY_PROCESSED)
      : 0;
    for (let i = startIndex; i < products.length; i++) {
      try {
        const product = products[i];
        console.log(
          `Processing product ${i + 1}/${products.length}: ${product.wineSearcherUrl}`,
        );

        // Visit wine-searcher.com using the pre-built URL
        await page.goto(product.wineSearcherUrl);

        // Check for captcha
        const hasCaptcha = await page.evaluate(() => {
          return document.body.textContent.includes("Press & Hold");
        });

        if (hasCaptcha) {
          let waitTimeMinutes = 1;
          let maxAttempts = 5; // Maximum number of attempts before giving up
          let attempt = 1;
          
          while (attempt <= maxAttempts) {
            console.log(
              `Captcha detected - waiting for ${waitTimeMinutes} minute(s) before retrying (attempt ${attempt}/${maxAttempts})...`
            );
            
            await new Promise(resolve => setTimeout(resolve, waitTimeMinutes * 60000));
            
            // Check if captcha is still present
            const captchaStillPresent = await page.evaluate(() => {
              return document.body.textContent.includes("Press & Hold");
            });
            
            if (!captchaStillPresent) {
              console.log("Captcha cleared successfully!");
              break;
            }
            
            if (attempt < maxAttempts) {
              waitTimeMinutes *= 2; // Double the wait time for next attempt
              attempt++;
              await page.reload(); // Reload the page for next attempt
            } else {
              console.log("Max attempts reached. Creating new page...");
              await page.close();
              page = await browser.newPage();
              await page.setViewportSize({ width: 1280, height: 720 });
              await page.goto(product.wineSearcherUrl);
            }
          }
        }

        // Check if page shows "Showing results for"
        const hasSearchResults = await page.evaluate(() => {
          return document.body.textContent.includes("Showing results for");
        });

        if (hasSearchResults) {
          console.log(
            "Search results page detected - skipping detailed scraping",
          );
          const scrapedData = {
            criticScore: null,
            userRating: null,
            amountOfUserRatings: null,
            style: null,
            grapeVariety: null,
            foodPairing: null,
          };
          Object.assign(product, scrapedData);
          await fs.writeFile(filePath, JSON.stringify(products, null, 2));
          lastProcessedIndex = i;
          continue;
        }

        // Wait for the profile section to load
        await page.waitForSelector(".prod-profile_rcs");

        // Extract Critic Score
        const criticScore = await page.evaluate(() => {
          const element = document.querySelector(
            ".prod-profile_rcs .badge-rating span:first-child",
          );
          return element ? parseInt(element.textContent.trim(), 10) : null;
        });

        // Extract User Rating
        const userRating = await page.evaluate(() => {
          const element = document.querySelector(".prod-profile_rcs .rating");
          if (!element || !element.getAttribute("aria-label")) return null;
          const match = element
            .getAttribute("aria-label")
            .match(/Rating ([\d.]+) of 5/);
          return match ? parseFloat(match[1]) : null;
        });

        // Extract Amount of User Ratings
        const amountOfUserRatings = await page.evaluate(() => {
          const element = document.querySelector(
            ".prod-profile_rcs .font-light-bold",
          );
          return element ? parseInt(element.textContent.trim(), 10) : null;
        });

        // Extract Wine Style
        const style = await page.evaluate(() => {
          const elements = document.querySelectorAll(".prod-profile_rcs li");
          for (const el of elements) {
            if (el.textContent.includes("Style")) {
              const boldEl = el.querySelector(".font-light-bold");
              return boldEl ? boldEl.textContent.trim() : null;
            }
          }
          return null;
        });

        // Extract Grape Variety
        const grapeVariety = await page.evaluate(() => {
          const elements = document.querySelectorAll(".prod-profile_rcs li");
          for (const el of elements) {
            if (el.textContent.includes("Grape Variety")) {
              const boldEl = el.querySelector(".font-light-bold");
              return boldEl ? boldEl.textContent.trim() : null;
            }
          }
          return null;
        });

        // Extract Food Pairing
        const foodPairing = await page.evaluate(() => {
          const elements = document.querySelectorAll(".prod-profile_rcs li");
          for (const el of elements) {
            if (el.textContent.includes("Food Pairing")) {
              const boldEl = el.querySelector(".font-light-bold");
              return boldEl ? boldEl.textContent.trim() : null;
            }
          }
          return null;
        });

        // Create a new object for the scraped data
        const scrapedData = {
          criticScore,
          userRating,
          amountOfUserRatings,
          style,
          grapeVariety,
          foodPairing,
        };

        console.log(JSON.stringify(scrapedData, null, 2));

        // Merge the scraped data with the current product
        Object.assign(product, scrapedData);

        // Write back after each successful scrape
        await fs.writeFile(filePath, JSON.stringify(products, null, 2));
        lastProcessedIndex = i;
      } catch (error) {
        console.error(`Error processing product ${i + 1}:`, error);
        throw error;
      }
    }

    console.log("All products processed successfully!");
  } catch (error) {
    console.error("Error:", error);
    if (lastProcessedIndex >= 0) {
      console.log(
        `Last successfully processed product index: ${lastProcessedIndex}`,
      );
      console.log(
        `Resume from index ${lastProcessedIndex + 1} after fixing the error`,
      );
    }
  }
})();
