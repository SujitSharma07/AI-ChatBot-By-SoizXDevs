const { GoogleGenAI } = require('@google/genai');
const config = require('../config.js');
const https = require('https');

const genAI = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

function downloadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', (chunk) => {
                chunks.push(chunk);
            });

            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const base64 = buffer.toString('base64');
                resolve(base64);
            });

            response.on('error', (error) => {
                reject(error);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

async function analyzeImageWithGemini(imageUrl, customPrompt = null) {
    try {
        const imageBase64 = await downloadImageAsBase64(imageUrl);
        
        const analysisPrompt = customPrompt || 'Analyze this image in detail. Describe what you see, including objects, people, text, colors, composition, and any other notable elements. Be descriptive but concise.';
        
        const result = await genAI.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{
                parts: [
                    { text: analysisPrompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageBase64
                        }
                    }
                ]
            }]
        });

        const text = result.candidates[0].content.parts[0].text;
        
        return text;
    } catch (error) {
        console.error('Error analyzing image with Gemini:', error);
        
        if (error.status === 429) {
            return 'Image analysis is currently experiencing high demand. Please try again later.';
        } else if (error.status === 401 || error.status === 403) {
            return 'There\'s an issue with the image analysis API configuration. Please check the API key.';
        } else {
            return `I encountered an error while analyzing the image: ${error.message}`;
        }
    }
}

module.exports = {
    analyzeImageWithGemini
};

/*
@Author: Sujit Sharma
Community: https://discord.gg/XkXSRrRE3P (SoizX Devs™)
Reach out for support or credits.
*/
