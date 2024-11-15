const { chromium } = require('playwright'); // You can also use firefox or webkit

(async () => {
    // Launch Chromium browser
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const url = 'https://www.ah.nl/zoeken?query=wijn&page=1';
    await page.goto(url, { waitUntil: 'load' });
    try {
        // Adjust this selector if needed (this assumes an element with id="accept-cookies")
        await page.waitForSelector('#accept-cookies', { timeout: 5000 });
        await page.click('#accept-cookies');
        console.log("Clicked the 'Accept Cookies' button");
    } catch (err) {
        console.log("'Accept Cookies' button not found, proceeding...");
    }

    // Wait for the page to load completely if needed (adjust selector if necessary)
    await page.waitForSelector('a', { timeout: 5000 }); // Wait for any 'a' elements on the page
    // code

    // Extract product and image pairs
    const productImageMap = await page.$$eval('a', links => {
        // Create an array to store the product and image map
        const productImgPairs = [];

        // Loop through each anchor (`<a>`) element
        links.forEach(link => {
            // Check if the <a> contains '/product/' in its href
            if (link.href.includes('/product/')) {
                // Check for an <img> that contains 'https://static.ah.nl/' in its src
                const img = link.querySelector('img[src^="https://static.ah.nl/"]');

                // If a matching <img> is found, push the href and corresponding image src to the array
                if (img) {
                    const productUrl = link.href;
                    const imgSrc = img.src;
                    productImgPairs.push({ productUrl, imgSrc });
                }
            }
        });

        return productImgPairs;
    });

    // Print the product and image mapping
    console.log('Product and Image Mapping:');
    productImageMap.forEach(({ productUrl, imgSrc }) => {
        console.log(`Product: ${productUrl}, Image: ${imgSrc}`);
    });


})();