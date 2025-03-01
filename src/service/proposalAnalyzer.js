import { config } from 'dotenv';
config();

// Import chat function from either Ollama or OpenAI based on environment
const AI_SERVICE = process.env.AI_SERVICE || 'ollama';
const { chat } = AI_SERVICE === 'openai'
    ? await import('./openai/openai.js')
    : await import('./ollama/ollama.js');

import { getFormattedTimestamp } from '../utils.js';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const MODEL = AI_SERVICE === 'openai'
    ? (process.env.OPENAI_MODEL || 'gpt-3.5-turbo')
    : (process.env.OLLAMA_MODEL || 'mistral');

const formattedProposalDetails = (proposal) => {
    // Extract key sections from description if they exist
    const descriptionSections = proposal.description?.split(/^## /m) || [];
    const formattedSections = descriptionSections
        .map(section => {
            const [title, ...content] = section.trim().split('\n');
            if (!content.length) return section.trim(); // Handle first section before any ## headers
            return `${title}:\n${content.join('\n').trim()}`;
        })
        .filter(Boolean);

    return `
PROPOSAL OVERVIEW
----------------
Title: ${proposal.title}
Status: ${proposal.status}
Date: ${proposal.date}
Voting Results: ${proposal.votesFor} For, ${proposal.votesAgainst} Against (${proposal.totalVotes} total)
Quorum Status: ${proposal.votingStats?.quorumCurrent || 0} of ${proposal.votingStats?.quorumRequired || 0} needed
${proposal.forumLinks?.length ? `Discussion Links: ${proposal.forumLinks.join(', ')}` : ''}

PROPOSAL CONTENT
---------------
${formattedSections.join('\n\n')}

${proposal.comments?.length ? `
COMMUNITY FEEDBACK
----------------
${proposal.comments.join('\n')}`
            : ''}`;
};

/**
 * Analyzes a proposal using Ollama
 */
export async function summarizeProposal(proposal) {
    console.log(`Using model: ${MODEL}`);
    const prompt = `
You are a web3 DAO expert, and you use industry standard language to convey complex topics in a simple and concise manner. Analyze this web3 protocol DAO proposal and provide a concise summary. Pay special attention to:
1. The main objective
2. Financial implications (if any)
3. Voting status and timeline
4. Key concerns or benefits

The summary should only be 3 sentences long.

Proposal details:
<document>
${formattedProposalDetails(proposal)}
</document>
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
${formattedProposalDetails(proposal)}
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

async function predictVote(proposal, persona) {
    const prompt = `You are a seasoned web3 DAO contributor. ${persona}.
    Please Analyze this proposal and predict how you would vote. Be diligent to ensure your vote aligns with your persona and values. Be critical in your reasoning. Its easy to just accept all proposals, but we need to ensure is aligns with our values.
Your response should be in the following format as shown in the example response below. Do not discuss the request or add any additional information, other than the requested vote and reason.

<example response>
VOTE: either "FOR" or "AGAINST"
REASON: A single sentence explaining the most relevant reason why the proposal aligns or does not align with your values. 
</example response> 

<proposal>
${formattedProposalDetails(proposal)}
</proposal>
`;

    try {
        let response = '';
        await chat(MODEL, prompt, (json) => {
            if (json.message?.content) {
                response += json.message.content;
            }
        });

        // Parse the response using regex
        const voteMatch = response.match(/VOTE:\s*(FOR|AGAINST)/i);
        const reasonMatch = response.match(/REASON:\s*([^\n]+)/i);

        return {
            vote: voteMatch ? voteMatch[1].toUpperCase() : 'UNKNOWN',
            reason: reasonMatch ? reasonMatch[1].trim() : 'No reason provided'
        };

    } catch (err) {
        console.error('Failed to predict vote:', err);
        return { vote: 'UNKNOWN', reason: 'Failed to analyze proposal' };
    }
}

export async function analyzeProposalsForProfile(profile, persona) {
    const results = [];

    for (const dao of profile.daos) {
        const daoResults = {
            name: dao.name,
            votes: dao.votes || 0,
            percentOfDelegated: dao.percentOfDelegated || 0,
            imageUrl: dao.imageUrl || '',
            proposals: []
        };

        for (const proposal of dao.proposals) {
            const summary = await summarizeProposal(proposal);
            const prediction = await predictVote(proposal, profile.persona);

            daoResults.proposals.push({
                name: proposal.title,
                summary,
                predictedVote: prediction.vote,
                predictedVoteReason: prediction.reason,
                url: proposal.url
            });
            console.log(daoResults.proposals);
        }

        results.push(daoResults);
    }

    return results;
}

export async function saveAnalysisToFile(analysisResults) {
    // Save analysis to file
    const timestamp = getFormattedTimestamp();
    const outputDir = join(process.cwd(), 'output');
    const filename = `analysis-${timestamp}.md`;
    const outputPath = join(outputDir, filename);

    mkdirSync(outputDir, { recursive: true });

    const markdown = `# Proposal Analysis ${timestamp}
 
 ## Delegate Information
 - Name: ${analysisResults.name}
 - Address: ${analysisResults.address}
 
 ## Analysis Results
 ${analysisResults.daos.map(dao => `
 ### ${dao.name}
 ${dao.proposals.map(proposal => `
 #### ${proposal.title}
 - Status: ${proposal.status}
 - Date: ${proposal.date}
 - Votes: ${proposal.votesFor} For, ${proposal.votesAgainst} Against (Total: ${proposal.totalVotes})
 
 **Summary:**
 ${proposal.summary}
 
 **Questions & Answers:**
 ${proposal.qa.map(qa => `
 Q: ${qa.question}
 A: ${qa.answer}
 `).join('\n')}
 `).join('\n')}
 `).join('\n')}`;

    writeFileSync(outputPath, markdown);
    console.log(`\n📝 Analysis saved to: ${outputPath}`);
}