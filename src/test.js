import { config } from 'dotenv';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import FirecrawlService from './firecrawl.js';
import {
    parseDelegateMemberships,
    parseActiveProposals,
    createUnifiedDelegateProfile
} from './parser.js';
import { askAboutProposal, saveAnalysisToFile, summarizeProposal } from './service/proposalAnalyzer.js';
import { serve } from './service/ollama/ollama.js';
import { getFormattedTimestamp } from './utils.js';

config();

const DELEGATE_ADDRESS = '0x1111fd96fD579642c0D589cd477188e29b47b738';

// 0x9492510bbcb93b6992d8b7bb67888558e12dcac4
const DAO_NAME = 'nounsdao';


async function test() {
    try {
        // Initialize Ollama and services
        console.log('🤖 Initializing Ollama service...');
        const serveType = await serve();
        console.log(`Ollama initialized (${serveType})`);

        const firecrawl = new FirecrawlService(process.env.FIRECRAWL_API_KEY);

        // Get delegate data and proposals
        console.log('📊 Fetching delegate data and proposals...');
        const delegateData = await firecrawl.scrapeDelegate(DELEGATE_ADDRESS, DAO_NAME);
        const daoMemberships = parseDelegateMemberships(delegateData);
        const proposalResults = await firecrawl.scrapeAllDAOProposals(daoMemberships);

        // Fetch proposal details
        console.log('📝 Fetching proposal details...');
        const proposalDetails = {};
        for (const result of proposalResults) {
            if (!result.error && result.data) {
                const proposals = parseActiveProposals(result.data);
                const details = await firecrawl.scrapeAllProposalDetails(proposals, result.dao.slug);

                details.forEach(detail => {
                    if (detail.details) {
                        proposalDetails[`${result.dao.slug}-${detail.proposalId}`] = detail.details;
                    }
                });
            }
        }

        // Create unified delegate profile
        console.log('🔄 Creating unified delegate profile...');
        const profile = createUnifiedDelegateProfile(delegateData, proposalResults, proposalDetails);
        // Save unified profile
        const profileTimestamp = getFormattedTimestamp();
        const profileDir = join(process.cwd(), 'profiles');
        const profileFilename = `profile-${profileTimestamp}.json`;
        const profilePath = join(profileDir, profileFilename);

        mkdirSync(profileDir, { recursive: true });
        writeFileSync(profilePath, JSON.stringify(profile, null, 2));
        console.log(`\n📝 Profile saved to: ${profilePath}`);

        const analysisResults = {
            name: profile.name,
            address: profile.address,
            daos: []
        };

        // Analyze active proposals using the unified profile
        console.log('\n🤔 Analyzing proposals...');
        for (const dao of profile.daos) {
            const activeProposals = dao.proposals.filter(p => p.status === 'Active');
            if (activeProposals.length > 0) {
                console.log(`\nAnalyzing ${activeProposals.length} active proposals in ${dao.name}:`);

                const analyzedProposals = [];
                for (const proposal of activeProposals) {
                    console.log(`\nProposal: ${proposal.title}`);

                    // Get AI summary
                    console.log('Generating summary...');
                    const summary = await summarizeProposal(proposal);
                    console.log('\nSummary:', summary);

                    const questions = [
                        "What is the main objective of this proposal?",
                        "What is the current voting status?",
                        "Are there any financial implications?"
                    ];

                    const qa = [];
                    for (const question of questions) {
                        console.log(`\nQ: ${question}`);
                        const answer = await askAboutProposal(proposal, question);
                        console.log(`A: ${answer}`);
                        qa.push({ question, answer });
                    }

                    analyzedProposals.push({
                        ...proposal,
                        summary,
                        qa
                    });
                }

                analysisResults.daos.push({
                    name: dao.name,
                    proposals: analyzedProposals
                });
            }
        }
        await saveAnalysisToFile(analysisResults);


    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

test();
