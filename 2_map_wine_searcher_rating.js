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

    const criticScore = parseInt(
      $("#criticsInfo .badge-rating span:first-child").text().trim(),
      10,
    );

    // Extract User Rating
    const userRating = parseFloat(
      $("#ratingInfo .rating")
        .attr("aria-label")
        .match(/Rating ([\d.]+) of 5/)[1],
    );

    // Extract Amount of User Ratings
    const amountOfUserRatings = parseInt(
      $("#ratingInfo .font-light-bold").text().trim(),
      10,
    );

    // Extract Wine Style
    const style = $("li:contains('Style') .font-light-bold").text().trim();

    // Extract Grape Variety
    const grapeVariety = $("li:contains('Grape Variety') .font-light-bold")
      .text()
      .trim();

    // Extract Food Pairing
    const foodPairing = $("li:contains('Food Pairing') .font-light-bold")
      .text()
      .trim();
  } catch (error) {
    console.error("Error:", error);
  }
})();
