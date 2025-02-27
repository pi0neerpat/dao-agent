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

    // Extract voting stats with better parsing
    const votingInfo = markdown.match(/Quorum\s*(\d+)\s*of\s*(\d+)/);
    const votingStats = {
        quorumReached: votingInfo ? parseInt(votingInfo[1]) >= parseInt(votingInfo[2]) : false,
        quorumCurrent: votingInfo ? parseInt(votingInfo[1]) : 0,
        quorumRequired: votingInfo ? parseInt(votingInfo[2]) : 0
    };

    // Extract all sections with improved section detection
    const sectionRegex = /#{2,3}\s+([^#\n]+)\n+([\s\S]+?)(?=#{2,3}|$)/g;
    let sectionMatch;
    const sections = {};
    while ((sectionMatch = sectionRegex.exec(markdown)) !== null) {
        const [_, title, content] = sectionMatch;
        sections[title.trim()] = content.trim();
    }

    // Build flattened proposal details
    return {
        proposedBy: markdown.match(/by\s*\[(.*?)\]/)?.[1] || '',
        proposedDate: markdown.match(/Proposed on: ([^<\n]+)/)?.[1] || '',
        forumLinks,
        votingStats,
        summary: sections['Summary'] || sections['Description'] || '',
        description: sections['Description'] || '',
        rationale: sections['Rationale'] || sections['Motivation'] || '',
        specification: sections['Specification'] || sections['Implementation'] || '',
        impact: sections['Impact'] || sections['Impact Overview'] || '',
        // Include all other sections as-is
        ...sections
    };
}

/**
 * Creates a unified delegate profile with DAOs and their proposals
 */
export function createUnifiedDelegateProfile(delegateData, daoProposalResults, proposalDetails = {}) {
    const daos = parseDelegateMemberships(delegateData);

    const enhancedDaos = daos.map(dao => {
        const daoResult = daoProposalResults.find(r => r.dao.slug === dao.slug);
        const proposals = daoResult?.data ? parseActiveProposals(daoResult.data) : [];

        const enhancedProposals = proposals.map(proposal => {
            const proposalId = proposal.url.split('/').pop();
            const details = proposalDetails[`${dao.slug}-${proposalId}`];
            return {
                ...proposal,
                details: details ? parseProposalDetails(details) : null
            };
        });

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

