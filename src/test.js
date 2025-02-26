import { config } from 'dotenv';
import FirecrawlService from './firecrawl.js';
import { parseDelegateMemberships } from './parser.js';

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
        console.log('Delegate Data:', delegateData);
        console.log('DAO Memberships:', daoMemberships);

        // // Test DAO scraping
        // console.log('\n🔍 Testing DAO scraping...');
        // const daoData = await firecrawl.scrapeDAO(DAO_NAME);
        // console.log('DAO Data:', daoData);

        // // // Test proposal scraping
        // console.log('\n🔍 Testing proposal scraping...');
        // const proposalData = await firecrawl.scrapeProposal(DAO_NAME, PROPOSAL_ID);
        // console.log('Proposal Data:', proposalData);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
