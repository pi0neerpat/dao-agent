import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = 'gpt-3.5-turbo';

/**
 * Chat implementation using OpenAI that matches Ollama's interface
 * @param {string} model - The model to use (defaults to gpt-3.5-turbo)
 * @param {string} prompt - The prompt to send
 * @param {function} onProgress - Callback function for streaming responses
 */
export async function chat(model = DEFAULT_MODEL, prompt, onProgress) {
    try {
        const stream = await openai.chat.completions.create({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content && onProgress) {
                onProgress({
                    message: {
                        content
                    }
                });
            }
        }
    } catch (error) {
        console.error('OpenAI chat error:', error);
        throw error;
    }
}

/**
 * Initialize OpenAI service (matches Ollama's serve interface)
 */
export async function serve() {
    try {
        const models = await openai.models.list();
        return models ? 'openai' : 'failed';
    } catch (error) {
        console.error('Failed to initialize OpenAI:', error);
        throw error;
    }
}
