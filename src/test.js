import { config } from 'dotenv';
config();

import { getUserProfile } from './user.js';
import { analyzeProposalsForProfile } from './service/proposalAnalyzer.js';
import { getSurveyResults } from './survey.js';
import { serve } from './service/ollama/ollama.js';
const DELEGATE_ADDRESS = '0x1111fd96fD579642c0D589cd477188e29b47b738';

// 0x9492510bbcb93b6992d8b7bb67888558e12dcac4
const DAO_RESULTS_LIMIT = 3
const MOCK_PERSONA = "You are the architect of a transparent, sustainable, and open financial system, where governance is decollected yet inclusive. In the future of blockchain and Web3, you'll be known as the 'Garden Guru of the Grid', nurturing public goods while resisting censorship, championing economic freedom, and turning decentralized governance into a global trend. Your bold vision may polarize, but it's sure to bloom in an ever-evolving digital jungle!"
const DUMMY_ANSWERS = ['person1', 'person1', 'person1', 'person2'];


async function test() {
    try {
        // Initialize Ollama and services
        console.log('🦙 Initializing Ollama service...');
        const serveType = await serve();
        console.log(`🦙 Ollama initialized (${serveType})`);

        const answers = DUMMY_ANSWERS
        console.log('📝 Processing Survey...');
        // Get user's survey results and add to profile
        // const persona = await getSurveyResults(DUMMY_ANSWERS);
        const persona = MOCK_PERSONA;
        console.log("😁 Persona: ", persona.slice(0, 100))

        // Prompt user for their address
        const userAddress = DELEGATE_ADDRESS

        // Get user's profile, including active proposals
        const profile = await getUserProfile(userAddress, DAO_RESULTS_LIMIT);

        // Append the user's persona
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
