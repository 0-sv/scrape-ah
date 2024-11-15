const { chromium } = require('playwright'); // You can also use firefox or webkit

(async () => {
    // Launch Chromium browser
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = 'https://www.ah.nl/zoeken?query=wijn&page=1';

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'load' });

    // Wait for the product listings to load on the page
    await page.waitForSelector('.search-shelf-product');

    // Extract wine data
    const wines = await page.evaluate(() => {
        // Select all product elements
        const items = document.querySelectorAll('.search-shelf-product');

        let wineData = [];

        // Extract data from each product item
        items.forEach(item => {
            const name = item.querySelector('.title')?.innerText || 'No name';
            const priceElement = item.querySelector('.price-amount');
            const price = priceElement?.innerText ? `${priceElement.innerText} ${priceElement.nextSibling.textContent.trim()}` : "No price";
            const link = item.querySelector('a')?.href || 'No link';

            wineData.push({
                name,
                price,
                link
            });
        });

        return wineData;
    });

    // Log the wine data as result
    console.log(wines);

    // Close the browser after completion
    await browser.close();
})();