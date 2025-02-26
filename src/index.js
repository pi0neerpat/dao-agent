import { config } from 'dotenv';
import FirecrawlService from './firecrawl.js';

config();

async function main() {
    const firecrawl = new FirecrawlService(process.env.FIRECRAWL_API_KEY);
    
    try {
        console.log('DAO Agent starting...');
        // Add your main application logic here
    } catch (error) {
        console.error('Application error:', error);
        process.exit(1);
    }
}

main();
