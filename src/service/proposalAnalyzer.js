import { chat } from './ollama/ollama.js';

const MODEL = process.env.OLLAMA_MODEL || 'mistral';

/**
 * Analyzes a proposal using Ollama
 */
export async function summarizeProposal(proposal) {
    const prompt = `
Analyze this DAO proposal and provide a concise summary. Pay special attention to:
1. The main objective
2. Financial implications (if any)
3. Voting status and timeline
4. Key concerns or benefits

Proposal details:
<document>
    Title: ${proposal.title}
    Status: ${proposal.status}
    Date: ${proposal.date}
    Votes: ${proposal.votesFor} For, ${proposal.votesAgainst} Against (Total: ${proposal.totalVotes})
    Quorum Status: ${proposal.votingStats?.quorumCurrent || 0} of ${proposal.votingStats?.quorumRequired || 0} needed
    
    Summary: ${proposal.summary || 'No summary available'}
    Description: ${proposal.description || 'No description available'}
    Rationale: ${proposal.rationale || 'No rationale available'}
    Specification: ${proposal.specification || 'No specification available'}
    Impact: ${proposal.impact || 'No impact available'}
</document>
`;

    console.log('Prompt:', prompt);
    let response = '';
    try {
        await chat(MODEL, prompt, (json) => {
            if (json.message?.content) {
                response += json.message.content;
            }
        });
        return response;
    } catch (err) {
        console.error('Failed to analyze proposal:', err);
        throw err;
    }
}

/**
 * Answers questions about a specific proposal
 * @param {Object} proposal - The proposal to analyze
 * @param {string} question - The user's question
 * @returns {Promise<string>} The AI's response
 */
export async function askAboutProposal(proposal, question) {
    const prompt = `
You are a DAO governance expert. Answer the following question about this proposal.
Use only the information provided in the proposal details below.
If the answer cannot be determined from the provided information, say so clearly.

Proposal Context:
<document>
    Title: ${proposal.title}
    Status: ${proposal.status}
    Date: ${proposal.date}
    Current Votes: ${proposal.votesFor} For, ${proposal.votesAgainst} Against (${proposal.totalVotes} total)
    Quorum Status: ${proposal.votingStats?.quorumCurrent || 0} of ${proposal.votingStats?.quorumRequired || 0} needed
    
    Summary: ${proposal.summary || 'No summary available'}
    Description: ${proposal.description || 'No description available'}
    Rationale: ${proposal.rationale || 'No rationale available'}
    Specification: ${proposal.specification || 'No specification available'}
    Impact: ${proposal.impact || 'No impact available'}
    ${proposal.forumLinks?.length ? `Discussion: ${proposal.forumLinks.join(', ')}` : ''}
</document>

User Question: ${question}

Please provide a clear and concise answer based on the proposal details above.
`;

    let response = '';
    try {
        await chat(MODEL, prompt, (json) => {
            if (json.message?.content) {
                response += json.message.content;
            }
        });
        return response;
    } catch (err) {
        console.error('Failed to answer question about proposal:', err);
        throw err;
    }
}
