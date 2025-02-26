/**
 * Extracts DAO memberships from delegate data
 * @param {Object} delegateData - Raw delegate data from Firecrawl
 * @returns {Array<Object>} List of DAOs with their details
 */
export function parseDelegateMemberships(delegateData) {
    if (!delegateData?.markdown) {
        return [];
    }

    const markdown = delegateData.markdown;

    // Find the DAO Memberships section and its table
    const daoSection = markdown.split('###### DAO Memberships')[1];
    if (!daoSection) return [];

    // Updated regex to capture the image URL and handle all table rows
    const tableRegex = /\| .*?!\[Governance icon\]\((.*?)\)<br>\[([^\]]+)\]\(https:\/\/www\.tally\.xyz\/gov\/([^/]+)\/.*?\) \| ([0-9.KMB<]+) \| ([0-9.%]+) \| (.*?) \|/g;
    const daos = [];
    let match;

    while ((match = tableRegex.exec(daoSection)) !== null) {
        const [_, imageUrl, name, slug, votes, percentOfDelegated, delegators] = match;

        // Skip if it's the header row
        if (name === 'DAO') continue;

        daos.push({
            name,                   // The DAO name from the link text
            slug,                   // The DAO's slug from the URL
            imageUrl,              // The DAO's governance icon
            votes,
            percentOfDelegated,
            delegators: delegators.replace(' addresses delegating', '')
        });
    }

    return daos;
}

/**
 * Extracts all proposals from DAO data
 * @param {Object} daoData - Raw DAO data from Firecrawl
 * @returns {Array<Object>} List of all proposals
 */
export function parseActiveProposals(daoData) {
    if (!daoData?.markdown) {
        return [];
    }

    const proposals = [];
    // Simplified regex to match the table format
    const proposalRegex = /\| \[([^\]]+)\]\(([^)]+)\)<br>([^<]+)<br>([^|]+?) \| ([0-9]+) \| ([0-9]+) \| ([0-9]+)/g;
    let match;

    while ((match = proposalRegex.exec(daoData.markdown)) !== null) {
        const [_, title, url, status, date, votesFor, votesAgainst, totalVotes] = match;
        
        proposals.push({
            title: title.trim(),
            url: url.trim(),
            status: status.trim(),
            date: date.trim(),
            votesFor: parseInt(votesFor),
            votesAgainst: parseInt(votesAgainst),
            totalVotes: parseInt(totalVotes)
        });
    }

    return proposals;
}

/**
 * Extracts detailed information from a proposal page
 * @param {Object} proposalData - Raw proposal data from Firecrawl
 * @returns {Object} Detailed proposal information
 */
export function parseProposalDetails(proposalData) {
    if (!proposalData?.markdown) {
        return null;
    }

    const markdown = proposalData.markdown;

    // Extract forum discussion links
    const forumLinks = [];
    const forumRegex = /\[(?:Discussion|Forum).*?\]\((https?:\/\/(?:discourse|forum|gov).[^\)]+)\)/gi;
    let forumMatch;
    while ((forumMatch = forumRegex.exec(markdown)) !== null) {
        forumLinks.push(forumMatch[1]);
    }

    // Extract proposal description
    const descriptionMatch = markdown.match(/#{2,3} Description\s+([\s\S]+?)(?=#{2,3}|$)/i);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    return {
        forumLinks,
        description,
        fullMarkdown: markdown
    };
}

/**
 * Creates a unified delegate profile with DAOs and their proposals
 * @param {Object} delegateData - Raw delegate data
 * @param {Array} daoProposalResults - Results from scraping DAO proposals
 * @param {Object} proposalDetails - Detailed proposal data
 * @returns {Object} Unified delegate profile
 */
export function createUnifiedDelegateProfile(delegateData, daoProposalResults, proposalDetails = {}) {
    // Get basic DAO memberships
    const daos = parseDelegateMemberships(delegateData);

    // Create enhanced DAO objects with proposals
    const enhancedDaos = daos.map(dao => {
        // Find proposal results for this DAO
        const daoResult = daoProposalResults.find(result => result.dao.slug === dao.slug);
        const proposals = daoResult?.data ? parseActiveProposals(daoResult.data) : [];

        // Enhance proposals with their details
        const enhancedProposals = proposals.map(proposal => {
            const proposalId = proposal.url.split('/').pop();
            const details = proposalDetails[`${dao.slug}-${proposalId}`];
            const parsedDetails = details ? parseProposalDetails(details) : null;

            return {
                ...proposal,
                details: parsedDetails
            };
        });

        // Return enhanced DAO object
        return {
            ...dao,
            proposals: enhancedProposals,
            stats: {
                totalProposals: enhancedProposals.length,
                activeProposals: enhancedProposals.filter(p => p.status === 'Active').length,
                executedProposals: enhancedProposals.filter(p => p.status === 'Executed').length
            }
        };
    });

    // Create unified profile
    return {
        address: delegateData.metadata?.sourceURL?.split('/').pop(),
        name: delegateData.metadata?.ogTitle?.split("'")[0],
        daos: enhancedDaos,
        stats: {
            totalDaos: enhancedDaos.length,
            totalProposals: enhancedDaos.reduce((sum, dao) => sum + dao.proposals.length, 0),
            activeProposals: enhancedDaos.reduce((sum, dao) => sum + dao.stats.activeProposals, 0)
        }
    };
}
