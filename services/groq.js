const Groq = require('groq-sdk');
const config = require('../config.js');

const groq = new Groq({
    apiKey: config.GROQ_API_KEY
});

async function generateGroqResponse(userMessage, systemPrompt, conversationHistory = []) {
    try {
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        if (conversationHistory && conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }

        messages.push({
            role: 'user',
            content: userMessage
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: config.BOT_CONFIG.GROQ_MODEL,
            max_tokens: config.BOT_CONFIG.MAX_TOKENS,
            temperature: config.BOT_CONFIG.TEMPERATURE,
            top_p: 1,
            stream: false
        });

        return chatCompletion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    } catch (error) {
        console.error('Error generating Groq response:', error);
        
        if (error.status === 429) {
            return 'I\'m currently experiencing high demand. Please try again in a moment.';
        } else if (error.status === 401) {
            return 'There\'s an issue with my API configuration. Please contact the bot owner.';
        } else {
            return 'I encountered an error while generating a response. Please try again.';
        }
    }
}

module.exports = {
    generateGroqResponse
};

/*
@Author: Sujit Sharma
Community: https://discord.gg/XkXSRrRE3P (SoizX Devs™)
Reach out for support or credits.
*/
