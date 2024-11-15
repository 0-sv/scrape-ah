const fs = require('fs').promises;
const path = require('path');
const {chromium} = require('playwright');

(async () => {
    try {
        // Read the results.json file
        const filePath = path.resolve(__dirname, 'results.json');
        const data = await fs.readFile(filePath, 'utf8');
        const products = JSON.parse(data);

        // Launch browser
        const browser = await chromium.launch({
            headless: false
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Get first product only
        const firstProduct = products[0];
        const urlPath = new URL(firstProduct.productUrl).pathname;
        const lastSegment = urlPath.split('/').pop();

        // Visit wine-searcher.com with the product name
        const wineSearcherUrl = `https://www.wine-searcher.com/find/${lastSegment}`;
        await page.goto(wineSearcherUrl);

        // Wait a bit to see the result
        await page.waitForTimeout(5000);
    } catch (error) {
        console.error('Error:', error);
    }
})();
