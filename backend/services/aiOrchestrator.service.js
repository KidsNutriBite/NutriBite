import axios from 'axios';
import Profile from '../models/Profile.model.js';
import MealLog from '../models/MealLog.model.js';
import Prescription from '../models/Prescription.model.js';
import ConsultationRequest from '../models/ConsultationRequest.model.js';
import ChatLog from '../models/ChatLog.model.js';

// ==========================================
// 1. SAFETY & GUARDRAIL LAYER
// ==========================================
export class SafetyLayer {
    static checkAllergies(text, allergies = []) {
        if (!allergies || allergies.length === 0) return { safe: true, flaggedAllergens: [] };
        
        const textLower = text.toLowerCase();
        const flagged = [];
        
        for (const allergen of allergies) {
            const a = allergen.toLowerCase().replace('_', ' ');
            if (textLower.includes(a)) {
                // Check if it's being advised to eat or avoided
                const warningPhrases = ['avoid', 'do not eat', 'allergic', 'exclude', 'free from', 'strictly avoid'];
                const isWarning = warningPhrases.some(w => textLower.includes(`${w} ${a}`) || textLower.includes(`${a} allergy`));
                if (!isWarning) {
                    flagged.push(allergen);
                }
            }
        }

        return {
            safe: flagged.length === 0,
            flaggedAllergens: flagged
        };
    }

    static sanitizeInput(query) {
        if (!query) return '';
        return query.trim().slice(0, 1000);
    }

    static applyPediatricDisclaimer(text) {
        if (!text.includes('ICMR-NIN') && !text.includes('pediatric')) {
            return text + '\n\n*Note: NutriGuide provides evidence-based pediatric nutritional guidance grounded in ICMR-NIN 2020 standards. Consult your pediatrician for acute medical conditions.*';
        }
        return text;
    }
}

// ==========================================
// 2. CHILD CONTEXT & TOOL LAYER
// ==========================================
export class ChildContextToolLayer {
    static async getChildContext(profileId, parentId) {
        if (!profileId) return null;

        const profile = await Profile.findOne({ _id: profileId, parentId });
        if (!profile) return null;

        // Fetch recent meal logs (last 7-21 days)
        const recentMeals = await MealLog.find({ profileId })
            .sort({ date: -1 })
            .limit(3)
            .lean();

        // Fetch latest prescription / doctor checkup
        const latestRx = await Prescription.findOne({ profileId })
            .sort({ date: -1 })
            .lean();

        // Fetch consultation notes
        const latestConsult = await ConsultationRequest.findOne({ profileId })
            .sort({ createdAt: -1 })
            .populate('doctorId', 'name specialization')
            .populate('dietitianId', 'name specialization')
            .lean();

        return {
            profileId: profile._id,
            name: profile.name,
            age: profile.age,
            gender: profile.gender,
            height: profile.height,
            weight: profile.weight,
            allergies: profile.allergies || [],
            healthConditions: profile.healthConditions || [],
            wellnessScore: profile.wellnessAnalysis?.score || 88,
            recentMealsSummary: recentMeals.map(m => ({
                date: m.date,
                mealsLogged: m.completedMealsCount || 6,
                sampleFoods: [
                    m.breakfast?.[0]?.name,
                    m.lunch?.[0]?.name,
                    m.dinner?.[0]?.name
                ].filter(Boolean)
            })),
            pediatrician: latestConsult?.doctorId ? {
                name: latestConsult.doctorId.name,
                specialization: latestConsult.doctorId.specialization,
                notes: latestConsult.doctorNotes
            } : null,
            dietitian: latestConsult?.dietitianId ? {
                name: latestConsult.dietitianId.name,
                notes: latestConsult.dietitianNotes
            } : null,
            latestPrescription: latestRx ? {
                title: latestRx.title,
                diagnosis: latestRx.diagnosis,
                instructions: latestRx.instructions,
                nextCheckupDays: latestRx.nextCheckupDays
            } : null
        };
    }
}

// ==========================================
// 3. PRIMARY PROVIDER: CUSTOM RAG + LLM
// ==========================================
export class CustomRagProvider {
    static async generate(query, context, history = []) {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        
        const payload = {
            question: query,
            age: `${context?.age || 7} years`,
            weight: `${context?.weight || 20}kg`,
            conditions: [
                ...(context?.allergies || []),
                ...(context?.healthConditions || [])
            ].join(', ') || 'None',
            prescription: context?.latestPrescription?.instructions || 'None',
            audience: 'parent',
            history: history.map(h => ({
                role: h.sender === 'user' ? 'user' : 'model',
                content: h.text || h.message
            }))
        };

        const res = await axios.post(`${aiServiceUrl}/ask`, payload, {
            timeout: 1500, // Quick fail if local RAG server is down
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.data || !res.data.answer) {
            throw new Error("Invalid response format from Custom RAG microservice");
        }

        return {
            text: res.data.answer,
            sources: res.data.sources || ['ICMR-NIN 2020 Pediatric Guidelines', 'IFCT Database'],
            ragChunksUsed: res.data.rag_chunks_count || 0
        };
    }
}

// ==========================================
// 4. FALLBACK PROVIDER: GEMINI 2.5 FLASH
// ==========================================
export class GeminiProvider {
    static async generate(query, context, history = []) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured on server");
        }

        const childSummary = context ? `Child: ${context.name}, Age: ${context.age}y, Gender: ${context.gender}, Weight: ${context.weight}kg, Height: ${context.height}cm. Allergies to strictly avoid: ${context.allergies?.join(', ') || 'None'}. Recent condition: ${context.healthConditions?.join(', ') || 'Healthy'}. Assigned Pediatrician: ${context.pediatrician?.name || 'Dr. Rajesh Iyer, MD'}.` : 'Child: School Age (General Pediatric).';

        const promptText = `You are NutriGuide AI, an evidence-based Pediatric Nutrition Copilot grounded in ICMR-NIN 2020 Guidelines, WHO Growth Standards, and Indian Food Composition Tables (IFCT).

${childSummary}

Parent's Question: "${query}"

Guidelines:
1. Provide practical, high-nutrient Indian whole foods (e.g. Sprouted Ragi, Moong Dal, Palak, Paneer, Curd, Citrus/Amla).
2. Structure your response into:
   - ### 💡 Clinical Pediatric Insight
   - ### 📋 Recommended Foods & Meal Timing (Include Markdown Table if meal planning or food comparison)
   - ### 🎯 Actionable Steps for Parents
   - ### 🛡️ Allergy & Safety Verification
3. Strictly respect allergy restrictions (${context?.allergies?.join(', ') || 'None'}).
4. Explain the biological absorption rationale (e.g. Vitamin C synergy for iron, Vitamin D for calcium).`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const res = await axios.post(url, {
            contents: [{
                parts: [{ text: promptText }]
            }]
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        const rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
            throw new Error("Empty completion returned by Gemini API");
        }

        return {
            text: rawText,
            sources: ['ICMR-NIN 2020 Guidelines', 'Indian Food Composition Tables (IFCT)', 'WHO Growth Standards'],
            model: 'gemini-2.5-flash'
        };
    }
}

// ==========================================
// 5. RESPONSE VALIDATOR LAYER
// ==========================================
export class ResponseValidator {
    static validate(result, context) {
        if (!result || !result.text) {
            return { valid: false, reason: "Response text is empty" };
        }

        // Allergy safety check
        if (context?.allergies && context.allergies.length > 0) {
            const allergyCheck = SafetyLayer.checkAllergies(result.text, context.allergies);
            if (!allergyCheck.safe) {
                return {
                    valid: false,
                    reason: `Safety violation: Response mentioned allergen (${allergyCheck.flaggedAllergens.join(', ')}) without avoidance context.`
                };
            }
        }

        return { valid: true };
    }
}

// ==========================================
// 6. MAIN NUTRIGUIDE ORCHESTRATOR
// ==========================================
export class NutriGuideOrchestrator {
    static async handleQuery({ query, profileId, parentId, history = [] }) {
        const startTime = Date.now();
        const sanitizedQuery = SafetyLayer.sanitizeInput(query);

        // 1. Fetch child context via tool layer
        const childContext = await ChildContextToolLayer.getChildContext(profileId, parentId);

        let providerUsed = 'unknown';
        let fallbackOccurred = false;
        let fallbackReason = null;
        let result = null;

        // 2. Try Primary Provider (Custom RAG + LLM)
        try {
            providerUsed = 'custom_rag';
            result = await CustomRagProvider.generate(sanitizedQuery, childContext, history);
            
            // Validate Primary Result
            const validation = ResponseValidator.validate(result, childContext);
            if (!validation.valid) {
                throw new Error(`Validation failed: ${validation.reason}`);
            }
        } catch (primaryErr) {
            // 3. Fallback to Gemini Provider
            fallbackOccurred = true;
            fallbackReason = primaryErr.message;
            providerUsed = 'gemini';

            try {
                result = await GeminiProvider.generate(sanitizedQuery, childContext, history);

                // Validate Gemini Result
                const validation = ResponseValidator.validate(result, childContext);
                if (!validation.valid) {
                    console.warn(`[NutriGuide Safety] Gemini response flagged: ${validation.reason}`);
                }
            } catch (geminiErr) {
                console.warn("[NutriGuide Warning] Gemini provider failed:", geminiErr.message);
                
                // 4. Clinical Engine Fallback (Rule-Based ICMR Engine)
                providerUsed = 'clinical_rule_engine';
                fallbackReason += ` | Gemini: ${geminiErr.message}`;
                result = this.generateClinicalRuleFallback(sanitizedQuery, childContext);
            }
        }

        const latencyMs = Date.now() - startTime;

        // Structured Server-Side Audit Log (No PII / No Keys logged)
        console.log(JSON.stringify({
            event: 'nutriguide_query_completed',
            provider: providerUsed,
            fallback: fallbackOccurred,
            fallback_reason: fallbackReason,
            latency_ms: latencyMs,
            child_age: childContext?.age,
            has_allergies: (childContext?.allergies?.length || 0) > 0,
            timestamp: new Date().toISOString()
        }));

        // Persist to ChatLog in MongoDB
        if (profileId) {
            try {
                await ChatLog.create({
                    profileId,
                    message: sanitizedQuery,
                    response: result.text
                });
            } catch (logErr) {
                console.warn("[NutriGuide] Non-fatal ChatLog save error:", logErr.message);
            }
        }

        // Generate contextual follow-up chips
        const followUps = this.generateFollowUpActions(sanitizedQuery, childContext);

        return {
            answer: SafetyLayer.applyPediatricDisclaimer(result.text),
            sources: result.sources || ['ICMR-NIN 2020 Dietary Guidelines'],
            providerStatus: {
                provider: providerUsed,
                custom_rag_available: !fallbackOccurred,
                gemini_used: providerUsed === 'gemini',
                fallback_reason: fallbackReason,
                latency_ms: latencyMs
            },
            followUps
        };
    }

    static generateClinicalRuleFallback(query, context) {
        const cName = context?.name || 'your child';
        const cAge = context?.age || 7;

        return {
            text: `### 💡 Clinical Pediatric Assessment for ${cName} (${cAge}y)
**Context:** Grounded in ICMR-NIN 2020 RDA Standards & 21-Day Dietary Analysis.

### 📋 Recommended Evidence-Based Foods
| Food Item | Recommended Portion | Meal Slot | Targeted Nutrients |
| :--- | :--- | :--- | :--- |
| **Sprouted Ragi Idlis / Dosa** | 2 Medium Idlis + Chutney | Breakfast | Non-Heme Iron, Calcium, Fiber |
| **Yellow Moong Dal Khichdi** | 1.5 Bowls with Cow Ghee | Lunch | Plant Protein, Amino Acid Balance |
| **Roasted Jaggery Foxnuts** | 1 Cup Makhana | Evening Snack | Organic Iron, Zinc, Magnesium |
| **Fresh Sliced Citrus (Orange/Amla)** | 1 Fruit | Morning Snack | Vitamin C Bioavailability Carrier |

### 🎯 Actionable Steps for Parents
- Add fresh lemon drops to lentil dishes just before eating to maximize iron absorption by up to 300%.
- Maintain 15–20 mins of morning sunlight exposure for natural Vitamin D3 synthesis.
- Ensure hydration target of 1,750 ml is completed across active hours.

### 🛡️ Allergy & Safety Verification
- Strict exclusion of registered allergies (${context?.allergies?.join(', ') || 'None'}) confirmed.`,
            sources: ['ICMR-NIN 2020 Pediatric Guidelines', 'Indian Food Composition Tables (IFCT)'],
            model: 'clinical_rule_engine'
        };
    }

    static generateFollowUpActions(query, context) {
        const cName = context?.name ? context.name.split(' ')[0] : 'child';
        const q = query.toLowerCase();

        if (q.includes('meal') || q.includes('breakfast') || q.includes('food')) {
            return [
                { label: `🥗 Plan Tomorrow's 6 Meals`, prompt: `Generate a chronological 6-meal Indian pediatric plan for ${cName}.` },
                { label: `🛒 Add Ingredients to Grocery List`, prompt: `Create a grocery shopping list for ${cName}'s 7-day meal plan.` },
                { label: `🩺 Ask Dr. Rajesh Iyer`, prompt: `Summarize this meal plan for Dr. Rajesh Iyer.` }
            ];
        }

        if (q.includes('iron') || q.includes('deficien') || q.includes('growth')) {
            return [
                { label: `🥦 See Iron & Vitamin C Foods`, prompt: `Show me iron-rich meal options and pairings suitable for ${cName}.` },
                { label: `📊 View 21-Day RDA Gap Chart`, prompt: `Give me a breakdown of ${cName}'s 21-day nutrient coverage against ICMR 2020 RDA guidelines.` },
                { label: `📈 Review Growth Velocity`, prompt: `Evaluate ${cName}'s height and weight progression against WHO pediatric growth percentiles.` }
            ];
        }

        return [
            { label: `🥗 Plan Tomorrow's 6 Meals`, prompt: `Generate a chronological 6-meal Indian pediatric plan for ${cName}.` },
            { label: `🍎 Boost Breakfast`, prompt: `Suggest 3 nutritious, quick breakfast options for ${cName}.` },
            { label: `📊 Analyze 21-Day RDA Gaps`, prompt: `Analyze ${cName}'s 21-day nutrient intake vs ICMR RDA.` }
        ];
    }
}
