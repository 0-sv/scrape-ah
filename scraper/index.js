const {chromium} = require('playwright');
const fs = require('fs'); // Use for saving results to a file

(async () => {
    // Define a realistic user-agent
    const userAgent = 'Chrome/93.0.4577.63';

    // Launch Chromium in headless mode, but with realistic settings
    const browser = await chromium.launch({
        headless: false // Run in a non-headless mode so you can see what's happening
    });

    // Create an incognito context (like a new browser session) for better isolation
    const context = await browser.newContext({
        userAgent,  // Set the user-agent here
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
        'Accept-Language': 'en-US,en;q=0.9'
    });

    // Random mouse movement can help make it look like real user interaction
    await page.mouse.move(100, 100); // Simulate a simple mouse move at the start

    // Navigate to the site
    const url = 'https://www.ah.nl/zoeken?query=wijn&page=52';
    await page.goto(url, {waitUntil: 'load'});

    // Extract product and image pairs
    const productImageMap = await page.$$eval('a', links => {
        const productImgPairs = [];
        links.forEach(link => {
            if (link.href.includes('/product/')) {
                const img = link.querySelector('img[src^="https://static.ah.nl/"]');
                if (img) {
                    const productUrl = link.href;
                    const imgSrc = img.src;
                    productImgPairs.push({productUrl, imgSrc});
                }
            }
        });
        return productImgPairs;
    });

    // Save the data to results.json
    fs.writeFileSync('../results.json', JSON.stringify(productImageMap, null, 2));
    console.log('The product-image pairs have been saved to "results.json".');
})();