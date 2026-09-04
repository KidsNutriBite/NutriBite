import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function testGeminiKey() {
    console.log("Testing Gemini API Key with available models...");
    
    // Test with v1beta endpoint
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    
    for (const model of models) {
        try {
            console.log(`\nTesting model: ${model}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const res = await axios.post(url, {
                contents: [{
                    parts: [{
                        text: "Respond with a brief 1-sentence confirmation that you are NutriGuide AI pediatric assistant."
                    }]
                }]
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });
            
            console.log(`✅ Model ${model} SUCCESS!`);
            const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log(`Response: ${text?.trim()}`);
            return; // Success!
        } catch (err) {
            console.log(`❌ Model ${model} failed: ${err.response?.status} - ${JSON.stringify(err.response?.data?.error || err.message)}`);
        }
    }
}

testGeminiKey();
