import { config } from 'dotenv';
config();

import TelegramBot from 'node-telegram-bot-api';
import { getSurveyResults } from './survey.js';
import { pairs } from './survey.js';
import {
    getOrCreateUser,
    createSession,
    updateSession,
    getActiveSession,
    updateUserPersona
} from './supabase.js';
import { resolveENS } from './ens.js';
import { getUserProfile } from './user.js';
import { analyzeProposalsForProfile } from './service/proposalAnalyzer.js';

// Bot configuration
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

const PROPOSAL_RESULTS_LIMIT = process.env.PROPOSAL_RESULTS_LIMIT || 3
// Remove userSessions Map as we're using Supabase now

/**
 * Represents a user's survey session
 * @typedef {Object} UserSession
 * @property {number} currentPair - Current pair index (0-3)
 * @property {Array<string>} answers - Collection of user answers
 * @property {string} persona - Stored persona result
 * @property {boolean} surveyComplete - Whether survey is complete
 */

/**
 * Initializes a new survey session for a user
 * @param {number} userId - Telegram user ID
 * @param {string} username - Telegram username
 */
async function initializeSession(userId, username) {
    await getOrCreateUser(userId, username);
    return await createSession(userId);
}

/**
 * Displays the current pair of people to choose from
 * @param {number} chatId - Telegram chat ID
 * @param {number} pairIndex - Index of the current pair to show
 */
async function showSurveyPair(chatId, pairIndex) {
    const pair = pairs[pairIndex];

    const keyboard = {
        inline_keyboard: [
            [
                { text: pair.person1.name, callback_data: 'person1' },
                { text: pair.person2.name, callback_data: 'person2' }
            ]
        ]
    };
    // Send single image with choice buttons
    await bot.sendPhoto(chatId, pair.imageUrl, {
        reply_markup: keyboard
    });
}

/**
 * Handles the user's selection for a survey pair
 * @param {number} userId - Telegram user ID
 * @param {number} chatId - Telegram chat ID
 * @param {string} choice - Selected choice (person1 or person2)
 */
async function handleSurveyResponse(userId, chatId, choice) {
    try {
        const session = await getActiveSession(userId);
        if (!session) {
            bot.sendMessage(chatId, "Sorry, your session has expired. Please start over with /start");
            return;
        }

        const updatedAnswers = [...session.answers, choice];
        const updates = {
            answers: updatedAnswers,
            current_pair: session.current_pair + 1
        };

        if (session.current_pair + 1 >= pairs.length) {
            updates.is_complete = true;
            await updateSession(session.id, updates);
            await displayResults(chatId, updatedAnswers, userId);
        } else {
            await updateSession(session.id, updates);
            await showSurveyPair(chatId, session.current_pair + 1);
        }
    } catch (error) {
        console.error('Error handling survey response:', error);
        bot.sendMessage(chatId, "An error occurred. Please try again with /start");
    }
}

/**
 * Processes and displays the final survey results
 * @param {number} chatId - Telegram chat ID
 * @param {Array<string>} answers - Collection of user answers
 * @param {number} userId - Telegram user ID
 */
async function displayResults(chatId, answers, userId) {
    try {
        await bot.sendMessage(chatId, "🔮 Analyzing your choices...");

        const summary = await getSurveyResults(answers);

        // Store persona in database
        await updateUserPersona(userId, summary);

        // Send persona results
        await bot.sendMessage(chatId,
            "🎭 Your Web3 Persona Analysis:\n\n" +
            summary + "\n\n"
        );

        await bot.sendMessage(chatId,
            "🌱 DAOs need more Regenerates like you! \n\n" +
            "I can make voting easier by digesting active proposals and predicting 🤔 how your persona might vote. Try it out:\n" +
            "• /digest <wallet_address>\n"
        );

    } catch (error) {
        console.error('Error displaying results:', error);
        await bot.sendMessage(chatId,
            "Sorry, there was an error generating your results. " +
            "Please try again with /start"
        );
    }
}

/**
 * Validates and processes wallet address or ENS name
 * @param {string} input - Wallet address or ENS name
 * @returns {boolean} - Whether the input is valid
 */
async function validateWalletInput(input) {
    // Remove whitespace
    const address = input.trim();

    // Check if it's an ENS name (.eth)
    if (address.toLowerCase().endsWith('.eth')) {
        // Basic ENS validation: letters, numbers, hyphens, minimum 3 chars before .eth
        const ensName = address.slice(0, -4); // remove .eth
        const validENSRegex = /^[a-zA-Z0-9-]{3,}$/;
        return validENSRegex.test(ensName);
    }

    // Check if it's an Ethereum address
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
}

/**
 * Analyzes DAO proposals based on user's persona
 * @param {string} wallet - Wallet address
 * @param {string} persona - User's persona summary
 */
async function analyzeDaoProposals(wallet, persona) {
    const profile = await getUserProfile(wallet, PROPOSAL_RESULTS_LIMIT);
    const analysisResults = await analyzeProposalsForProfile(profile, persona);
    return analysisResults
}

// Command handler for starting the survey
bot.onText(/\/start/, async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const username = msg.from.username || null;

    try {
        // Initialize new session with username
        await initializeSession(userId, username);

        // Welcome message
        await bot.sendMessage(chatId,
            "Hi" + (username ? ` @${username}` : "") + ", I'm your DAO Delegate Assistant! 🌟\n\n" +
            "You'll be presented with 4 pairs of crypto personalities. For each pair, choose the one that resonates most with your values.\n" +
            "At the end, you'll receive your personalized Web3 persona!\n\n" +
            "Let's begin! 🚀"
        );

        // Show first pair after welcome message
        await showSurveyPair(chatId, 0);
    } catch (error) {
        console.error('Error starting session:', error);
        await bot.sendMessage(chatId, "Error starting survey. Please try again with /start");
    }
});

// Handle callback queries (button clicks)
bot.on('callback_query', (query) => {
    const userId = query.from.id;
    const chatId = query.message.chat.id;
    const choice = query.data; // 'person1' or 'person2'

    // Acknowledge the callback query
    bot.answerCallbackQuery(query.id);

    // Handle the response (we'll implement this next)
    handleSurveyResponse(userId, chatId, choice);
});

/**
 * Formats the analysis results into a structured message
 * @param {Array<Object>} analysis - Analysis results
 * @returns {string} - Formatted message
 */
async function sendAnalysisResults(chatId, analysis) {
    await bot.sendMessage(chatId, '*🗞️ YOUR DAO DIGEST*', { parse_mode: 'Markdown' });

    // First, separate DAOs with and without proposals
    const activeDaos = analysis.filter(dao => dao.proposals.length > 0);
    const inactiveDaos = analysis.filter(dao => dao.proposals.length === 0);

    // List inactive DAOs first if any exist
    if (inactiveDaos.length > 0) {
        let inactiveMessage = '*Other DAOs (no active proposals):*\n';
        inactiveDaos.forEach(dao => {
            inactiveMessage += `• [${dao.name}](https://www.tally.xyz/gov/${dao.slug})\n`;
        });
        await bot.sendMessage(chatId, inactiveMessage, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });
        await bot.sendMessage(chatId, '━━━━━━━━━━━━━━━');
    }

    // Process DAOs with active proposals
    for (const dao of activeDaos) {
        if (dao.imageUrl) {
            await bot.sendPhoto(chatId, dao.imageUrl, {
                caption: `*${dao.name}*`,
                parse_mode: 'Markdown',
                width: 30,
                height: 30
            });
        }

        let statsMessage = `🗳 Votes: ${dao.votes}\n`;
        statsMessage += `💪 Voting Power: ${dao.percentOfDelegated}\n`;
        await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });

        for (let i = 0; i < dao.proposals.length; i++) {
            const proposal = dao.proposals[i];
            let proposalMessage = `*📜 #${i + 1}* `;
            proposalMessage += `*${proposal.name}*\n\n`;
            proposalMessage += `${proposal.summary}\n\n`;

            // Only show prediction if there's a reason
            if (proposal.predictedVoteReason && proposal.predictedVoteReason !== 'No reason provided') {
                const voteEmoji = proposal.predictedVote === 'FOR' ? '👍' : '👎';
                proposalMessage += `*Your Predicted Vote:* ${voteEmoji} ${proposal.predictedVoteReason}\n\n`;
            } else {
                proposalMessage += `*Prediction:* ❓ No prediction available\n\n`;
            }

            proposalMessage += `[🗳️ Go Vote Now!](${proposal.url})\n`;

            await bot.sendMessage(chatId, proposalMessage, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
        }

        await bot.sendMessage(chatId, '━━━━━━━━━━━━━━━');
    }
}

/**
 * Processes a wallet address and returns DAO analysis
 * @param {number} chatId - Telegram chat ID
 * @param {number} userId - User ID
 * @param {string} walletAddress - Wallet or ENS to analyze
 */
async function processWalletAnalysis(chatId, userId, walletAddressInput) {
    try {
        const user = await getOrCreateUser(userId);
        if (!user.persona) {
            await bot.sendMessage(chatId,
                "⚠️ Please complete the persona survey first using /start"
            );
            return;
        }

        let walletAddress = walletAddressInput;
        if (await validateWalletInput(walletAddressInput)) {
            await bot.sendMessage(chatId, "🔍 Looking up your DAOs...\n(this may take a while)");

            if (walletAddressInput.toLowerCase().endsWith('.eth')) {
                walletAddress = await resolveENS(walletAddressInput);
                if (!walletAddress) {
                    throw new Error(`Could not resolve wallet address for: ${walletAddressInput}`);
                }
            }

            // Store wallet address
            await updateUserPersona(userId, user.persona, walletAddress);

            const analysis = await analyzeDaoProposals(walletAddress, user.persona);

            await sendAnalysisResults(chatId, analysis);

            await bot.sendMessage(chatId,
                "Want to analyze another wallet? Use /digest <wallet_address>"
            );
        } else {
            await bot.sendMessage(chatId,
                "⚠️ Please enter a valid Ethereum address or ENS name."
            );
        }
    } catch (error) {
        console.error('Error processing wallet:', error);
        await bot.sendMessage(chatId,
            "Sorry, there was an error processing your wallet. " +
            error.message
        );
    }
}

// Add analyze command handler
bot.onText(/\/digest(?:@\w+)?(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const walletAddress = match[1]?.trim();

    if (!walletAddress) {
        await bot.sendMessage(chatId,
            "Please provide a wallet address or ENS name.\n" +
            "Usage: /analyze <wallet_address>"
        );
        return;
    }

    await processWalletAnalysis(chatId, userId, walletAddress);
});

// Update the message handler to use the new processWalletAnalysis function
bot.on('message', async (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const session = await getActiveSession(userId);

    // Only process text messages when waiting for wallet address
    if (!msg.text || !session || !session.is_complete || msg.text.startsWith('/')) {
        return;
    }

    await processWalletAnalysis(chatId, userId, msg.text.trim());
});
