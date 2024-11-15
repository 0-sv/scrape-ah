const {chromium} = require('playwright');
const fs = require('fs').promises; // For saving results to a file
const path = require('path');

(async () => {
    // Define a realistic user-agent
    const userAgent = 'Chrome/93.0.4577.63';

    // Launch Chromium in headless mode, but with realistic settings
    const browser = await chromium.launch({
        headless: false // Run in a non-headless mode so you can see what's happening
    });

    // Create an incognito context (like a new browser session)
    const context = await browser.newContext({
        userAgent, // Set the user agent here
        viewport: {
            width: 1280, // Set a desktop resolution
            height: 720
        },
        locale: 'nl-NL', // Set a realistic locale
        timezoneId: 'Europe/Amsterdam', // Set a correct timezone based on location
        deviceScaleFactor: 1, // Standard scale
    });

    const page = await context.newPage();

    // Set some common HTTP headers often seen in regular browsing
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
    });

    // Random mouse movement can help make it look like real user interaction
    await page.mouse.move(100, 100); // Simulate a simple mouse move at the start

    // Navigate to the site
    const url = 'https://www.ah.nl/zoeken?query=wijn&page=52';
    await page.goto(url, {waitUntil: 'load'});

    // Extract product URL, image pairs, and prices
    const productImagePriceMap = await page.$$eval('a', links => {
        const productItems = [];
        links.forEach(link => {
            if (link.href.includes('/product/')) {
                const img = link.querySelector('img[src^="https://static.ah.nl/"]');
                const priceElement = link.closest('article')?.querySelector('[data-testhook="price-amount"] .sr-only[aria-label^="Prijs:"]');
                const unitSizeElement = link.closest('article')?.querySelector('[data-testhook="product-unit-size"]');

                if (img && priceElement && unitSizeElement) {
                    const productUrl = link.href;
                    const imgSrc = img.src;

                    // Extract price from the aria-label
                    const priceText = priceElement.getAttribute('aria-label');
                    const price = parseFloat(priceText.replace(/[^\d,.-]+/g, '').replace(',', '.')); // Remove '€' and convert comma to dot

                    // Extract the unit size text as is
                    const unitSize = unitSizeElement.textContent.trim();

                    // Create wine searcher URL from last segment of product URL
                    const urlPath = new URL(productUrl).pathname;
                    const lastSegment = urlPath.split('/').pop();
                    const wineSearcherUrl = `https://www.wine-searcher.com/find/${lastSegment}`;

                    // Push the data into the array
                    productItems.push({productUrl, imgSrc, price, unitSize, wineSearcherUrl});
                }
            }
        });
        return productItems;
    });

    // Save the data to results.json
    try {
        const filePath = path.resolve(__dirname, '../results.json'); // Construct the correct file path
        const data = JSON.stringify(productImagePriceMap, null, 2);  // Your data to write

        // Use await to write the file
        await fs.writeFile(filePath, data);

        console.log('File successfully written!');
    } catch (error) {
        console.error('Error writing file:', error);
    }

    await browser.close()
})();
