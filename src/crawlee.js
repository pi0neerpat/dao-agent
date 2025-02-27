import { PlaywrightCrawler } from 'crawlee';
import fs from 'fs/promises';

const BASE_URL = 'https://docs.cdp.coinbase.com';

const crawler = new PlaywrightCrawler({
    // Limit to first 10 websites
    maxRequestsPerCrawl: 10,

    async requestHandler({ request, page, enqueueLinks, pushData, log }) {  // Added pushData parameter
        try {
            log.info(`Processing page ${crawler.processedRequestCount}/10: ${request.loadedUrl}`);
            const title = await page.title();
            log.info(`Processing ${request.loadedUrl}`);

            // Extract the main content from the documentation
            const content = await page.evaluate(() => {
                const mainContent = document.querySelector('main');
                return mainContent ? mainContent.innerText : '';
            });

            // Save both the URL and content
            await pushData({
                title,
                url: request.loadedUrl,
                content
            });

            // Only enqueue links that belong to the documentation
            await enqueueLinks({
                baseUrl: BASE_URL,
                strategy: 'same-domain',
            });
        } catch (error) {
            log.error(`Failed to process ${request.url}: ${error.message}`);
        }
    },

    // Remove the request limit to crawl everything
    // maxRequestsPerCrawl: 20,
});

// Start the crawl
await crawler.run([BASE_URL]);

// Get all the crawled data
const data = await crawler.getData();

// Combine all documentation into a single markdown file
const docContent = data.items.map(item => `
# ${item.title}
URL: ${item.url}

${item.content}
---
`).join('\n\n');

// Save to a file
await fs.writeFile('coinbase-docs.md', docContent, 'utf8');
console.log('Documentation has been saved to coinbase-docs.md');