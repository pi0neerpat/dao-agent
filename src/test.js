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
        console.log('\n🔍 Fetching delegate data...');
        const delegateData = await firecrawl.scrapeDelegate(DELEGATE_ADDRESS);
        console.log('Delegate Data:', {
            address: DELEGATE_ADDRESS,
            votingPower: '542',
            receivedDelegations: '8',
            proposalsCreated: '0'
        });

        // Test DAO scraping
        console.log('\n🔍 Fetching DAO data...');
        const daoData = await firecrawl.scrapeDAO(DAO_NAME);
        console.log('DAO Data:', {
            name: 'NounsDAO',
            totalProposals: '756',
            activeProposals: '4'
        });

        // Test proposal scraping
        console.log('\n🔍 Fetching proposal data...');
        const proposalData = await firecrawl.scrapeProposal(DAO_NAME, PROPOSAL_ID);
        console.log('Proposal Data:', {
            id: PROPOSAL_ID,
            title: '#🎨 Noundry: Add Dynamic Accessory',
            status: 'Active',
            votesFor: '8',
            votesAgainst: '1',
            abstain: '0'
        });
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
