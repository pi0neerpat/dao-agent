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
                if (url.includes('/profile/')) {
                    return mockResponses.delegate;
                } else if (url.includes('/proposals')) {
                    return mockResponses.dao;
                } else if (url.includes('/proposal/')) {
                    return mockResponses.proposal;
                }
                throw new Error('No mock data available for this URL');
            }

            const response = await this.app.scrapeUrl(url, {
                formats: ['markdown'],
                // waitFor: 5000,
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
            `https://www.tally.xyz/profile/${walletAddress}`

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

    async scrapeDAOProposals(daoSlug) {
        return this.scrapeUrl(
            `https://www.tally.xyz/gov/${daoSlug}/proposals`
        );
    }

    async scrapeAllDAOProposals(daoList) {
        const results = await Promise.allSettled(
            daoList.map(dao => this.scrapeDAOProposals(dao.slug))
        );

        return results.map((result, index) => ({
            dao: daoList[index],
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
        }));
    }
}

export default FirecrawlService;
