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
 */

/**
 * Initializes a new survey session for a user
 * @param {number} userId - Telegram user ID
 */
function initializeSession(userId) {
    userSessions.set(userId, {
        currentPair: 0,
        answers: []
    });
}

/**
 * Displays the current pair of people to choose from
 * @param {number} chatId - Telegram chat ID
 * @param {number} pairIndex - Index of the current pair to show
 */
async function showSurveyPair(chatId, pairIndex) {
    const pair = pairs[pairIndex];
    
    // First, send both images as a media group
    await bot.sendMediaGroup(chatId, [
        {
            type: 'photo',
            media: pair.person1.imageUrl,
            caption: `Option 1: ${pair.person1.name}`
        },
        {
            type: 'photo',
            media: pair.person2.imageUrl,
            caption: `Option 2: ${pair.person2.name}`
        }
    ]);

    // Then send the detailed message with buttons
    const message = `Round ${pairIndex + 1}/4\n\n` +
        `Option 1: ${pair.person1.name}\n` +
        `Attributes: ${pair.person1.attributes.join(', ')}\n\n` +
        `Option 2: ${pair.person2.name}\n` +
        `Attributes: ${pair.person2.attributes.join(', ')}\n\n` +
        `Choose your preferred option:`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: pair.person1.name, callback_data: 'person1' },
                { text: pair.person2.name, callback_data: 'person2' }
            ]
        ]
    };

    await bot.sendMessage(chatId, message, {
        reply_markup: keyboard,
        parse_mode: 'HTML'
    });
}

/**
 * Handles the user's selection for a survey pair
 * @param {number} userId - Telegram user ID
 * @param {number} chatId - Telegram chat ID
 * @param {string} choice - Selected choice (person1 or person2)
 */
function handleSurveyResponse(userId, chatId, choice) {
    // ...implementation needed...
}

/**
 * Processes and displays the final survey results
 * @param {number} chatId - Telegram chat ID
 * @param {Array<string>} answers - Collection of user answers
 */
async function displayResults(chatId, answers) {
    // ...implementation needed...
}

// Command handler for starting the survey
bot.onText(/\/start/, (msg) => {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    // Initialize new session
    initializeSession(userId);

    // Welcome message
    bot.sendMessage(chatId,
        "Welcome to the Web3 Persona Survey! 🌟\n\n" +
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
