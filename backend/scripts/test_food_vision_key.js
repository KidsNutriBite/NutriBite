import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_VISION_API_KEY || process.env.GEMINI_API_KEY;
const imagePath = 'c:/Users/LENOVO/Desktop/project-phase/frontend/public/indian_food.jpg';

async function testGeminiVision() {
    console.log("Testing Gemini Vision for Food Plate Detection...");
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    console.log(`Image loaded! Size: ${imageBuffer.length} bytes`);

    const prompt = `Analyze this meal plate photo and return ONLY valid JSON:
{
  "foods": ["Idli", "Sambar", "Chutney"],
  "portion_estimates": {
    "Idli": "2 pieces",
    "Sambar": "1 cup",
    "Chutney": "2 tbsp"
  },
  "confidence_scores": [0.95, 0.90, 0.88],
  "nutrition_estimates": {
    "Idli": { "calories": 130, "protein": 4.0, "carbs": 26.0, "fats": 0.4, "fiber": 1.5, "iron": 0.8, "calcium": 25, "vitaminC": 0 },
    "Sambar": { "calories": 140, "protein": 5.5, "carbs": 18.0, "fats": 3.2, "fiber": 4.0, "iron": 1.4, "calcium": 35, "vitaminC": 4.5 },
    "Chutney": { "calories": 90, "protein": 1.2, "carbs": 3.0, "fats": 8.5, "fiber": 2.1, "iron": 0.3, "calcium": 10, "vitaminC": 1.0 }
  }
}`;

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];

    for (const model of models) {
        console.log(`\nAttempting model: ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            const res = await axios.post(url, {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 45000
            });

            console.log(`✅ Gemini Vision Model ${model} SUCCESS!`);
            const jsonText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log("Response JSON:\n", jsonText);
            const parsed = JSON.parse(jsonText);
            console.log("Detected Foods:", parsed.foods);
            console.log("Portions:", parsed.portion_estimates);
            return;
        } catch (err) {
            console.error(`❌ Model ${model} error:`, err.response?.status, err.response?.data?.error?.message || err.message);
        }
    }
}

testGeminiVision();
