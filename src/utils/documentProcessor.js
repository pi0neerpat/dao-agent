
/**
 * Converts a proposal into a text representation
 * @param {Object} proposal - The proposal object
 * @returns {string} Text representation of the proposal
 */
function proposalToText(proposal) {
    const details = proposal.details || {};
    let text = [
        `Title: ${proposal.title}`,
        `Status: ${proposal.status}`,
        `Date: ${proposal.date}`,
        `Voting Results: ${proposal.votesFor} For, ${proposal.votesAgainst} Against (Total: ${proposal.totalVotes})`,
        details.summary ? `Summary: ${details.summary}` : '',
        details.description ? `Description: ${details.description}` : '',
        details.rationale ? `Rationale: ${details.rationale}` : '',
        details.impact ? `Impact: ${details.impact}` : '',
        details.forumLinks?.length ? `Forum Links: ${details.forumLinks.join(', ')}` : ''
    ].filter(Boolean).join('\n');

    return text;
}

/**
 * Converts a DAO into a text representation
 * @param {Object} dao - The DAO object
 * @returns {string} Text representation of the DAO
 */
function daoToText(dao) {
    let text = [
        `DAO: ${dao.name}`,
        `Votes: ${dao.votes}`,
        `Delegators: ${dao.delegators}`,
        `Active Proposals: ${dao.stats.activeProposals}`,
        `Total Proposals: ${dao.stats.totalProposals}`,
        `Executed Proposals: ${dao.stats.executedProposals}`,
        '\nProposals:',
        ...dao.proposals.map(p => proposalToText(p))
    ].join('\n');

    return text;
}

/**
 * Converts a delegate profile into a document suitable for embeddings
 * @param {Object} profile - The unified delegate profile
 * @returns {Object} Document with sections and metadata
 */
export function profileToDocument(profile) {
    const sections = [];

    // Add delegate overview
    sections.push({
        title: 'Delegate Overview',
        content: [
            `Delegate: ${profile.name}`,
            `Address: ${profile.address}`,
            `Total DAOs: ${profile.stats.totalDaos}`,
            `Total Proposals: ${profile.stats.totalProposals}`,
            `Active Proposals: ${profile.stats.activeProposals}`
        ].join('\n')
    });

    // Add each DAO's information as a section
    profile.daos.forEach(dao => {
        sections.push({
            title: `DAO: ${dao.name}`,
            content: daoToText(dao)
        });
    });

    return {
        title: `Delegate Profile: ${profile.name}`,
        sections,
        metadata: {
            address: profile.address,
            totalDaos: profile.stats.totalDaos,
            totalProposals: profile.stats.totalProposals,
            activeProposals: profile.stats.activeProposals,
            daos: profile.daos.map(d => d.name)
        }
    };
}
