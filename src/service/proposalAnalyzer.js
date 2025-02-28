import { config } from 'dotenv';
config();

import { chat } from './ollama/ollama.js';
import { getFormattedTimestamp } from '../utils.js';
import { join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

const MODEL = process.env.OLLAMA_MODEL || 'mistral'

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
Analyze this DAO proposal and provide a concise summary. Pay special attention to:
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

export async function analyzeProposalsForProfile(profile) {
    
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