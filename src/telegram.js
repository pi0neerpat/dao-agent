import { config } from 'dotenv';
config();

import TelegramBot from 'node-telegram-bot-api';
import { getSurveyResults } from './survey.js';
import { pairs } from './survey.js'; // Add this import

// Bot configuration
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// Store user survey sessions
const userSessions = new Map();

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
 */
function initializeSession(userId) {
    userSessions.set(userId, {
        currentPair: 0,
        answers: [],
        persona: null,
        surveyComplete: false
    });
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
    const session = userSessions.get(userId);
    if (!session) {
        bot.sendMessage(chatId, "Sorry, your session has expired. Please start over with /start");
        return;
    }

    // Save the answer
    session.answers.push(choice);

    // Move to next pair
    session.currentPair++;

    // Check if survey is complete
    if (session.currentPair >= pairs.length) {
        // Show results if all pairs are done
        await displayResults(chatId, session.answers);
        // Clean up session
        userSessions.delete(userId);
    } else {
        // Show next pair
        await showSurveyPair(chatId, session.currentPair);
    }
}

/**
 * Processes and displays the final survey results
 * @param {number} chatId - Telegram chat ID
 * @param {Array<string>} answers - Collection of user answers
 */
async function displayResults(chatId, answers) {
    try {
        await bot.sendMessage(chatId, "🔮 Analyzing your choices...");

        const summary = await getSurveyResults(answers);

        // Store persona in session for later use
        const userId = chatId;
        const session = userSessions.get(userId);
        session.persona = summary;
        session.surveyComplete = true;

        // Send persona results
        await bot.sendMessage(chatId,
            "🎭 Your Web3 Persona Analysis:\n\n" +
            summary + "\n\n"
        );

        await bot.sendMessage(chatId,
            "🌱 DAOs need more Regenerates like you! \n\n" +
            "I can make voting easier by summarizing proposals, and predicting 🤔 how your persona might vote. Try it out:\n" +
            "• Paste a wallet address or ENS name\n" +
            "• /analyze <wallet_address>\n"
        );

    } catch (error) {
        console.error('Error displaying results:', error);
        await bot.sendMessage(chatId,
            "Sorry, there was an error generating your results. " +
            "Please try again with /start"
        );
        userSessions.delete(chatId);
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
    // TODO: Implement DAO proposal analysis
    return "Analyzing your DAO interactions...";
}

// Command handler for starting the survey
bot.onText(/\/start/, (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Initialize new session
    initializeSession(userId);

    // Welcome message
    bot.sendMessage(chatId,
        "Hi, I'm your DAO Personal Assistant! 🌟\n\n" +
        "You'll be presented with 4 pairs of crypto personalities.\n" +
        "For each pair, choose the one that resonates most with your values.\n" +
        "At the end, you'll receive your personalized Web3 persona!\n\n" +
        "Let's begin! 🚀"
    ).then(() => {
        // Show first pair after welcome message
        showSurveyPair(chatId, 0);
    });
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
 * Processes a wallet address and returns DAO analysis
 * @param {number} chatId - Telegram chat ID
 * @param {number} userId - User ID
 * @param {string} walletAddress - Wallet or ENS to analyze
 */
async function processWalletAnalysis(chatId, userId, walletAddress) {
    const session = userSessions.get(userId);
    if (!session?.surveyComplete) {
        await bot.sendMessage(chatId,
            "⚠️ Please complete the persona survey first using /start"
        );
        return;
    }

    try {
        if (await validateWalletInput(walletAddress)) {
            await bot.sendMessage(chatId, "🔍 Processing your wallet...");

            const analysis = await analyzeDaoProposals(walletAddress, session.persona);

            await bot.sendMessage(chatId,
                "Based on your Web3 persona and DAO interactions:\n\n" +
                analysis + "\n\n" +
                "Want to analyze another wallet? Use /analyze <wallet_address>"
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
            "Please try again or start over with /start"
        );
    }
}

// Add analyze command handler
bot.onText(/\/analyze(?:@\w+)?(?: (.+))?/, async (msg, match) => {
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
    const session = userSessions.get(userId);

    // Only process text messages when waiting for wallet address
    if (!msg.text || !session || !session.surveyComplete || msg.text.startsWith('/')) {
        return;
    }

    await processWalletAnalysis(chatId, userId, msg.text.trim());
});
