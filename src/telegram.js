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

    const keyboard = {
        inline_keyboard: [
            [
                { text: pair.person1.name, callback_data: 'person1' },
                { text: pair.person2.name, callback_data: 'person2' }
            ]
        ]
    };
    console.log(pair.imageUrl)

    // Send single image with choice buttons
    await bot.sendPhoto(chatId, pair.imageUrl, {
        // caption: `Round ${pairIndex + 1}/4\nWho resonates with you more?`,
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
        // Show loading message
        await bot.sendMessage(chatId, "🔮 Analyzing your choices...");

        // Get personalized results
        const summary = await getSurveyResults(answers);

        // Send results with some formatting
        await bot.sendMessage(chatId,
            "🎭 Your Web3 Persona Analysis:\n\n" +
            summary + "\n\n" +
            "Want to try again? Just type /start!"
        );
    } catch (error) {
        console.error('Error displaying results:', error);
        await bot.sendMessage(chatId,
            "Sorry, there was an error generating your results. " +
            "Please try again with /start"
        );
    }
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
