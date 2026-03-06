import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

// Initialize the Gemini API with the key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Define the exact JSON schema we want the AI to output.
// This matches the Meta Graph API requirements closely.
const campaignSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        campaign: {
            type: SchemaType.OBJECT,
            properties: {
                name: { type: SchemaType.STRING, description: "Name of the campaign. Should be descriptive." },
                objective: {
                    type: SchemaType.STRING,
                    description: "Campaign objective. Must be one of: OUTCOME_AWARENESS, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_TRAFFIC, OUTCOME_APP_PROMOTION."
                },
                status: { type: SchemaType.STRING, description: "MUST ALWAYS BE 'PAUSED'. User safety protocol." },
                special_ad_categories: {
                    type: SchemaType.ARRAY,
                    description: "Array of special ad categories. Usually empty ['NONE'] unless specified.",
                    items: { type: SchemaType.STRING }
                },
                daily_budget: { type: SchemaType.STRING, description: "Daily budget in the smallest currency unit (e.g., cents. R$50 = '5000'). Optional if lifetime_budget is used." }
            },
            required: ["name", "objective", "status", "special_ad_categories"]
        },
        adsets: {
            type: SchemaType.ARRAY,
            description: "List of ad sets to create under this campaign.",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    status: { type: SchemaType.STRING, description: "MUST ALWAYS BE 'PAUSED'." },
                    optimization_goal: { type: SchemaType.STRING, description: "E.g., LINK_CLICKS, IMPRESSIONS, REACH, LEAD_GENERATION" },
                    billing_event: { type: SchemaType.STRING, description: "E.g., IMPRESSIONS, LINK_CLICKS" },
                    daily_budget: { type: SchemaType.STRING, description: "Daily budget in cents. E.g., '2000' for R$20." },
                    targeting: {
                        type: SchemaType.OBJECT,
                        properties: {
                            age_min: { type: SchemaType.INTEGER },
                            age_max: { type: SchemaType.INTEGER },
                            genders: { type: SchemaType.ARRAY, items: { type: SchemaType.INTEGER }, description: "1 for male, 2 for female. Empty for all." },
                            geo_locations: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    countries: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "ISO country codes, e.g., ['BR']" }
                                }
                            }
                        }
                    }
                },
                required: ["name", "status", "optimization_goal", "billing_event"]
            }
        },
        ads: {
            type: SchemaType.ARRAY,
            description: "List of ads to create. (Optional for now if the user only wants structure)",
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    name: { type: SchemaType.STRING },
                    status: { type: SchemaType.STRING, description: "MUST ALWAYS BE 'PAUSED'." },
                    adset_index: { type: SchemaType.INTEGER, description: "Index of the adset in the adsets array that this ad belongs to (0-indexed)." },
                    creative: {
                        type: SchemaType.OBJECT,
                        properties: {
                            title: { type: SchemaType.STRING, description: "Primary headline" },
                            body: { type: SchemaType.STRING, description: "Primary text / body copy" }
                        }
                    }
                },
                required: ["name", "status", "adset_index"]
            }
        }
    },
    required: ["campaign", "adsets", "ads"]
};

// Expose the generation function
export async function generateCampaignFromPrompt(userPrompt: string) {
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: campaignSchema,
                temperature: 0.2,
            }
        });

        const systemInstruction = `
        You are an elite Meta Ads (Facebook Ads) media buyer API assistant. 
        Your job is to translate the user's natural language request into a valid Meta Ads Campaign structure in JSON format.
        CRITICAL RULE: ALL 'status' fields MUST BE SET TO 'PAUSED'. Never create an active campaign/adset/ad.
        
        Currency: Assume BRL (Reais) and convert to cents (e.g. R$ 50 = "5000") if the user uses R$ or doesn't specify currency.
        Targeting: Try your best to map localities and ages.
        Objectives: Map the user's intent to one of the valid OUTCOME_* objectives. 
        If they want Traffic, use 'OUTCOME_TRAFFIC', optimization_goal 'LINK_CLICKS', billing 'IMPRESSIONS'.
        If they want Sales, use 'OUTCOME_SALES', optimization_goal 'OFFSITE_CONVERSIONS', billing 'IMPRESSIONS'.
        If they want Engagement, use 'OUTCOME_ENGAGEMENT'.
        If they want Leads, use 'OUTCOME_LEADS', optimization_goal 'LEAD_GENERATION', billing 'IMPRESSIONS'.
        
        If the user does not provide enough info for AdSets or Ads, create sensible defaults or placeholders (e.g., "Conjunto 01 - Aberto", "Anúncio 01").
        `;

        const fullPrompt = systemInstruction + "\n\nUser Prompt: " + userPrompt;

        const result = await model.generateContent(fullPrompt);

        const responseText = result.response.text();
        return JSON.parse(responseText);

    } catch (error: any) {
        console.error("Gemini API Error:", error?.message || error);
        throw new Error(error?.message || "Failed to generate campaign structure from AI.");
    }
}
