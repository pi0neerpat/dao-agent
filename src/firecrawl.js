import FirecrawlApp from '@mendable/firecrawl-js';

class FirecrawlService {
    constructor(apiKey) {
        this.app = new FirecrawlApp({ apiKey });
    }

    async scrapeDelegate(walletAddress) {
        try {
            const response = await this.app.scrapeUrl(
                `https://www.tally.xyz/gov/nounsdao/delegate/${walletAddress}`,
                {
                    formats: ['markdown'],
                }
            );

            if (!response.success) {
                throw new Error(`Failed to scrape delegate: ${response.error}`);
            }

            return response.data;
        } catch (error) {
            console.error('Error scraping delegate:', error);
            throw error;
        }
    }

    async scrapeDAO(daoName) {
        try {
            const response = await this.app.scrapeUrl(
                `https://www.tally.xyz/gov/${daoName}/proposals`,
                {
                    formats: ['markdown'],
                }
            );

            if (!response.success) {
                throw new Error(`Failed to scrape DAO: ${response.error}`);
            }

            return response.data;
        } catch (error) {
            console.error('Error scraping DAO:', error);
            throw error;
        }
    }

    async scrapeProposal(daoName, proposalId) {
        try {
            const response = await this.app.scrapeUrl(
                `https://www.tally.xyz/gov/${daoName}/proposal/${proposalId}`,
                {
                    formats: ['markdown'],
                }
            );

            if (!response.success) {
                throw new Error(`Failed to scrape proposal: ${response.error}`);
            }

            return response.data;
        } catch (error) {
            console.error('Error scraping proposal:', error);
            throw error;
        }
    }
}

export default FirecrawlService;
