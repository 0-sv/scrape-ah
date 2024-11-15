const fs = require('fs').promises;
const path = require('path');

(async () => {
    try {
        // Read the results.json file
        const filePath = path.resolve(__dirname, 'results.json');
        const data = await fs.readFile(filePath, 'utf8');
        const products = JSON.parse(data);

        // Extract and log the last path segment from each productUrl
        products.forEach(product => {
            const urlPath = new URL(product.productUrl).pathname;
            const lastSegment = urlPath.split('/').pop();
            console.log(lastSegment);
        });

    } catch (error) {
        console.error('Error:', error);
    }
})();
