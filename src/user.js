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

export const getUserProfile = async (delegateAddress, proposalResultsLimit) => {
    const firecrawl = new FirecrawlService(process.env.FIRECRAWL_API_KEY);

    // Get delegate data and proposals
    console.log('📊 Fetching delegate data and proposals...');
    const delegateData = await firecrawl.scrapeDelegate(delegateAddress);
    const daoMemberships = parseDelegateMemberships(delegateData);
    // console.log('📊 DAO memberships:', daoMemberships);
    // const proposalList = await firecrawl.scrapeAllDAOProposals(daoMemberships);
    // TODO: Remove debug limit daos
    const proposalList = await firecrawl.scrapeAllDAOProposals(daoMemberships.slice(0, 1));
    // console.log('📊 DAO proposals:', proposalList);

    console.log('📝 Fetching proposal details...');
    const proposalDetails = {};
    for (const result of proposalList) {
        if (!result.error && result.data) {
            const allProposals = parseActiveProposals(result.data);
            const limitedProposals = allProposals.slice(0, proposalResultsLimit);
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
}