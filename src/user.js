import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import FirecrawlService from './firecrawl.js';
import {
    parseDelegateMemberships,
    parseActiveProposals,
    createUnifiedDelegateProfile
} from './parser.js';
import { askAboutProposal, saveAnalysisToFile, summarizeProposal } from './service/proposalAnalyzer.js';
import { getFormattedTimestamp } from './utils.js';

const PROPOSAL_LIMIT = 3

export const getUserProfile = async (delegateAddress, daoResultsLimit) => {
    const firecrawl = new FirecrawlService(process.env.FIRECRAWL_API_KEY);

    // Get delegate data and proposals
    console.log('📊 Fetching delegate data and proposals...');
    const delegateData = await firecrawl.scrapeDelegate(delegateAddress);
    const daoMemberships = parseDelegateMemberships(delegateData);
    // console.log('📊 DAO memberships:', daoMemberships);
    const proposalList = await firecrawl.scrapeAllDAOProposals(daoMemberships.slice(0, daoResultsLimit));
    // console.log('📊 DAO proposals:', proposalList);

    console.log('📝 Fetching proposal details...');
    const proposalDetails = {};
    for (const result of proposalList) {
        if (!result.error && result.data) {
            const allProposals = parseActiveProposals(result.data);
            const limitedProposals = allProposals.slice(0, PROPOSAL_LIMIT);
            const details = await firecrawl.scrapeAllProposalDetails(limitedProposals, result.dao.slug);
            details.forEach(detail => {
                if (detail.details) {
                    proposalDetails[`${result.dao.slug}-${detail.proposalId}`] = detail.details;
                }
            });
        }
    }

    // Create unified delegate profile
    console.log('🔄 Creating unified delegate profile...');
    const profile = createUnifiedDelegateProfile(delegateData, proposalList, proposalDetails);

    // Save profile as before
    const profileTimestamp = getFormattedTimestamp();
    const profileDir = join(process.cwd(), 'profiles');
    const profileFilename = `profile-${profileTimestamp}.json`;
    const profilePath = join(profileDir, profileFilename);

    mkdirSync(profileDir, { recursive: true });
    writeFileSync(profilePath, JSON.stringify(profile, null, 2));
    console.log(`📝 Profile saved to: ${profilePath}`);

    return profile;
    // const analysisResults = {
    //     name: profile.name,
    //     address: profile.address,
    //     daos: []
    // };

    // Analyze only first 3 proposals of the first DAO
    // console.log('🤔 Analyzing proposals...');
    // const firstDao = profile.daos[0];
    // if (firstDao) {
    //     const activeProposals = firstDao.proposals
    //         .filter(p => p.status === 'Active')
    //         .slice(0, 1); // Limit to first 1 active proposals

    //     if (activeProposals.length > 0) {
    //         console.log(`Analyzing ${activeProposals.length} active proposals in ${firstDao.name}:`);

    //         const analyzedProposals = [];
    //         for (const proposal of activeProposals) {
    //             console.log(`Proposal: ${proposal.title}`);

    //             // Get AI summary
    //             console.log('Generating summary...');
    //             const summary = await summarizeProposal(proposal);
    //             console.log('\nSummary:', summary);

    //             const questions = [
    //                 "What is the main objective of this proposal?",
    //                 "What is the current voting status?",
    //                 "Are there any financial implications?"
    //             ];

    //             const qa = [];
    //             for (const question of questions) {
    //                 console.log(`\nQ: ${question}`);
    //                 const answer = await askAboutProposal(proposal, question);
    //                 console.log(`A: ${answer}`);
    //                 qa.push({ question, answer });
    //             }

    //             analyzedProposals.push({
    //                 ...proposal,
    //                 summary,
    //                 qa
    //             });
    //         }

    //         analysisResults.daos.push({
    //             name: firstDao.name,
    //             proposals: analyzedProposals
    //         });
    //     }
    // }
    // await saveAnalysisToFile(analysisResults);
}