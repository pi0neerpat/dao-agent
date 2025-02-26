import { config } from 'dotenv';
import FirecrawlService from './firecrawl.js';
import { parseDelegateMemberships, parseActiveProposals, createUnifiedDelegateProfile } from './parser.js';
import { writeFileSync } from 'fs';

config();

const DELEGATE_ADDRESS = '0x9492510bbcb93b6992d8b7bb67888558e12dcac4';
const DAO_NAME = 'nounsdao';

async function test() {
    const firecrawl = new FirecrawlService(process.env.FIRECRAWL_API_KEY);
    try {
        // Get delegate data
        console.log('\n🔍 Fetching delegate data...');
        const delegateData = await firecrawl.scrapeDelegate(DELEGATE_ADDRESS, DAO_NAME);
        const daoMemberships = parseDelegateMemberships(delegateData);

        // Fetch all proposals
        console.log('\n📊 Fetching proposals for all DAOs...');
        const proposalResults = await firecrawl.scrapeAllDAOProposals(daoMemberships);

        // Fetch proposal details
        console.log('\n📝 Fetching proposal details...');
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

        // Create unified profile
        const profile = createUnifiedDelegateProfile(delegateData, proposalResults, proposalDetails);
        // Display results
        console.log('\n📊 Delegate Profile Summary:');
        console.log(`Name: ${profile.name}`);
        console.log(`Address: ${profile.address}`);
        console.log(`Total DAOs: ${profile.stats.totalDaos}`);
        console.log(`Total Proposals: ${profile.stats.totalProposals}`);
        console.log(`Active Proposals: ${profile.stats.activeProposals}`);

        profile.daos.forEach(dao => {
            console.log(`\n🏛️  ${dao.name}:`);
            console.log(`Active Proposals: ${dao.stats.activeProposals}`);
            dao.proposals.forEach(prop => {
                console.log(`  - ${prop.title} (${prop.status})`);
                if (prop.details?.forumLinks.length > 0) {
                    console.log(`    Forum: ${prop.details.forumLinks[0]}`);
                }
            });
        });

        console.log(JSON.stringify(profile))
        // Debug: save to a file
        writeFileSync('profile.json', JSON.stringify(profile, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
