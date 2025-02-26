import { config } from 'dotenv';
import FirecrawlService from './firecrawl.js';
import { parseDelegateMemberships, parseActiveProposals } from './parser.js';

config();

const DELEGATE_ADDRESS = '0x9492510bbcb93b6992d8b7bb67888558e12dcac4';
const DAO_NAME = 'nounsdao';
const PROPOSAL_ID = '756';

async function test() {
    const firecrawl = new FirecrawlService(process.env.FIRECRAWL_API_KEY);
    try {
        // Test delegate scraping
        console.log('\n🔍 Testing delegate scraping...');
        const delegateData = await firecrawl.scrapeDelegate(DELEGATE_ADDRESS, DAO_NAME);
        const daoMemberships = parseDelegateMemberships(delegateData);
        // console.log('DAO Memberships:', daoMemberships);

        // Fetch active proposals for each DAO
        console.log('\n📊 Fetching active proposals for all DAOs...');
        const proposalResults = await firecrawl.scrapeAllDAOProposals(daoMemberships);

        // Process and display results
        const result = proposalResults[0];
        // for (const result of proposalResults) {
        if (result.error) {
            console.error(`Failed to fetch proposals for ${result.dao.name}:`, result.error);
            // continue;
        }

        const activeProposals = parseActiveProposals(result.data);
        if (activeProposals.length > 0) {
            console.log(`\n${result.dao.name} active proposals:`, activeProposals);
        }
        // }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
