import { config } from 'dotenv';
config();

import { getUserProfile } from './user.js';
import { analyzeProposalsForProfile } from './service/proposalAnalyzer.js';
import { getSurveyResults } from './survey.js';
const DELEGATE_ADDRESS = '0x1111fd96fD579642c0D589cd477188e29b47b738';

// 0x9492510bbcb93b6992d8b7bb67888558e12dcac4
const DAO_RESULTS_LIMIT = 3
const MOCK_PERSONA = "You are the architect of a transparent, sustainable, and open financial system, where governance is decollected yet inclusive. In the future of blockchain and Web3, you'll be known as the 'Garden Guru of the Grid', nurturing public goods while resisting censorship, championing economic freedom, and turning decentralized governance into a global trend. Your bold vision may polarize, but it's sure to bloom in an ever-evolving digital jungle!"

async function test() {
    try {

        console.log('Taking Survey...');
        // Get user's survey results and add to profile
        const DUMMY_ANSWERS = ['person1', 'person1', 'person1', 'person2'];
        // const persona = await getSurveyResults(DUMMY_ANSWERS);
        const persona = MOCK_PERSONA;

        // Prompt user for their address

        // Get user's profile, including active proposals
        const profile = await getUserProfile(DELEGATE_ADDRESS, DAO_RESULTS_LIMIT);

        profile.persona = persona;

        // Analyze active proposals with survey results
        const analysisResults = await analyzeProposalsForProfile(profile);
        console.log('🧫 Analysis Results:', analysisResults);

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();
