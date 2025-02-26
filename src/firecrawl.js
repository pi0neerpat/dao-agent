import FirecrawlApp from '@mendable/firecrawl-js';
import mockResponses from './mocks/responses.js';

class FirecrawlService {
    constructor(apiKey, options = {}) {
        this.useMocks = options.useMocks || process.env.MOCK_FIRECRAWL_DATA === 'true';
        if (!this.useMocks) {
            this.app = new FirecrawlApp({ apiKey });
        }
        console.log(`FirecrawlService initialized with ${this.useMocks ? 'mock' : 'live'} data`);
    }

    async scrapeUrl(url, options = {}) {
        try {
            if (this.useMocks) {
                // Return mock data based on URL pattern
                if (url.includes('/delegate/')) {
                    return mockResponses.delegate.data;
                } else if (url.includes('/proposals')) {
                    return mockResponses.dao.data;
                } else if (url.includes('/proposal/')) {
                    return mockResponses.proposal.data;
                }
                throw new Error('No mock data available for this URL');
            }

            const response = await this.app.scrapeUrl(url, {
                formats: ['markdown'],
                ...options
            });

            if (!response.success) {
                throw new Error(`Failed to scrape URL: ${response.error}`);
            }
            console.log(JSON.stringify(response))
            return response;
        } catch (error) {
            console.error('Scraping error:', error);
            throw error;
        }
    }

    async scrapeDelegate(walletAddress, daoName) {
        return this.scrapeUrl(
            `https://www.tally.xyz/gov/${daoName}/delegate/${walletAddress}`
        );
    }

    async scrapeDAO(daoName) {
        return this.scrapeUrl(
            `https://www.tally.xyz/gov/${daoName}/proposals`
        );
    }

    async scrapeProposal(daoName, proposalId) {
        return this.scrapeUrl(
            `https://www.tally.xyz/gov/${daoName}/proposal/${proposalId}`
        );
    }
}

export default FirecrawlService;
