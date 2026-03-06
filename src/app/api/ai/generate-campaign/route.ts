import { NextResponse } from 'next/server';
import { generateCampaignFromPrompt } from '@/lib/gemini';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Call the Gemini service to generate the structured campaign
        const structuredData = await generateCampaignFromPrompt(prompt);

        return NextResponse.json(structuredData);
    } catch (error: any) {
        console.error('API /api/ai/generate-campaign Error:', error);
        return NextResponse.json({
            error: 'Failed to generate campaign',
            details: error.message
        }, { status: 500 });
    }
}
