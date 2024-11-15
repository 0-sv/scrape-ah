const fs = require("fs").promises;
const path = require("path");
const { chromium } = require("playwright");

(async () => {
  try {
    // Read the results.json file
    const filePath = path.resolve(__dirname, "results.json");
    const data = await fs.readFile(filePath, "utf8");
    const products = JSON.parse(data);

    // Launch browser
    const browser = await chromium.launch({
      headless: false,
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Get first product only
    const firstProduct = products[0];

    // Visit wine-searcher.com using the pre-built URL
    await page.goto(firstProduct.wineSearcherUrl);
    
    // Wait for the profile section to load
    await page.waitForSelector('.prod-profile_rcs');

    // Extract Critic Score
    const criticScore = await page.evaluate(() => {
      const element = document.querySelector('.prod-profile_rcs .badge-rating span:first-child');
      return element ? parseInt(element.textContent.trim(), 10) : null;
    });

    // Extract User Rating
    const userRating = await page.evaluate(() => {
      const element = document.querySelector('.prod-profile_rcs .rating');
      if (!element || !element.getAttribute('aria-label')) return null;
      const match = element.getAttribute('aria-label').match(/Rating ([\d.]+) of 5/);
      return match ? parseFloat(match[1]) : null;
    });

    // Extract Amount of User Ratings
    const amountOfUserRatings = await page.evaluate(() => {
      const element = document.querySelector('.prod-profile_rcs .font-light-bold');
      return element ? parseInt(element.textContent.trim(), 10) : null;
    });

    // Extract Wine Style
    const style = await page.evaluate(() => {
      const element = document.querySelector('.prod-profile_rcs li:has-text("Style") .font-light-bold');
      return element ? element.textContent.trim() : null;
    });

    // Extract Grape Variety
    const grapeVariety = await page.evaluate(() => {
      const element = document.querySelector('.prod-profile_rcs li:has-text("Grape Variety") .font-light-bold');
      return element ? element.textContent.trim() : null;
    });

    // Extract Food Pairing
    const foodPairing = await page.evaluate(() => {
      const element = document.querySelector('.prod-profile_rcs li:has-text("Food Pairing") .font-light-bold');
      return element ? element.textContent.trim() : null;
    });

    console.log({
      criticScore,
      userRating,
      amountOfUserRatings,
      style,
      grapeVariety,
      foodPairing
    });
  } catch (error) {
    console.error("Error:", error);
  }
})();
