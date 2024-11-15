const fs = require("fs").promises;
const path = require("path");
const { chromium } = require("playwright");

(async () => {
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

    // Create an incognito context (like a new browser session)
    const context = await browser.newContext({
      userAgent, // Set the user agent here
      viewport: {
        width: 1280, // Set a desktop resolution
        height: 720,
      },
      locale: "nl-NL", // Set a realistic locale
      timezoneId: "Europe/Amsterdam", // Set a correct timezone based on location
      deviceScaleFactor: 1, // Standard scale
    });

    const page = await context.newPage();

    // Get first product only
    const firstProduct = products[0];

    // Visit wine-searcher.com using the pre-built URL
    await page.goto(firstProduct.wineSearcherUrl);

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

    console.log({
      criticScore,
      userRating,
      amountOfUserRatings,
      style,
      grapeVariety,
      foodPairing,
    });
  } catch (error) {
    console.error("Error:", error);
  }
})();
