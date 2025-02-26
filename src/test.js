import { config } from 'dotenv';
import FirecrawlService from './firecrawl.js';

config();

const DELEGATE_ADDRESS = '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71';
const DAO_NAME = 'nounsdao';
const PROPOSAL_ID = '756';

async function test() {
    const firecrawl = new FirecrawlService(process.env.FIRECRAWL_API_KEY);

    try {
        // Test delegate scraping
        console.log('\n🔍 Testing delegate scraping...');
        const delegateData = await firecrawl.scrapeDelegate(DELEGATE_ADDRESS, DAO_NAME);
        // console.log('Delegate Data:', delegateData);

        // // Test DAO scraping
        // console.log('\n🔍 Testing DAO scraping...');
        // const daoData = await firecrawl.scrapeDAO(DAO_NAME);
        // console.log('DAO Data:', daoData);

        // // Test proposal scraping
        // console.log('\n🔍 Testing proposal scraping...');
        // const proposalData = await firecrawl.scrapeProposal(DAO_NAME, PROPOSAL_ID);
        // console.log('Proposal Data:', proposalData);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
