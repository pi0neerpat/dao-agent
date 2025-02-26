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
 * Extracts active proposals from DAO data
 * @param {Object} daoData - Raw DAO data from Firecrawl
 * @returns {Array<Object>} List of active proposals
 */
export function parseActiveProposals(daoData) {
    if (!daoData?.markdown) {
        return [];
    }

    const proposals = [];
    // Updated regex to match the actual table format in the DAO data
    const proposalRegex = /\| \[([^\]]+)\]\(([^)]+)\)<br>Active<br>([^|]+?) \| ([^|]+) \| ([^|]+) \|/g;
    let match;

    while ((match = proposalRegex.exec(daoData.markdown)) !== null) {
        const [_, title, url, date, votesFor, votesAgainst] = match;
        proposals.push({
            title: title.trim(),
            url: url.trim(),
            date: date.trim(),
            votesFor: votesFor.trim(),
            votesAgainst: votesAgainst.trim(),
            status: 'Active'
        });
    }

    return proposals;
}
