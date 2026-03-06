import { NextResponse } from 'next/server';
import { getInsights, getInsightsOverTime } from '@/lib/meta-api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const objectId = searchParams.get('objectId') || process.env.META_AD_ACCOUNT_ID || '';
        const accessToken = searchParams.get('accessToken') || process.env.META_ACCESS_TOKEN || '';
        const datePreset = searchParams.get('datePreset') || 'last_30d';
        const timeIncrement = searchParams.get('timeIncrement') || '';
        const breakdowns = searchParams.get('breakdowns') || '';

        if (!objectId || !accessToken) {
            return NextResponse.json(
                { error: 'Missing objectId or accessToken' },
                { status: 400 }
            );
        }

        // If timeIncrement is set, return daily data for charts
        if (timeIncrement) {
            const data = await getInsightsOverTime(objectId, accessToken, {
                datePreset,
                timeIncrement,
            });
            return NextResponse.json({ data });
        }

        const data = await getInsights(objectId, accessToken, {
            datePreset,
            breakdowns: breakdowns ? breakdowns.split(',') : undefined,
        });

        return NextResponse.json({ data });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('GET /api/meta/insights error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
