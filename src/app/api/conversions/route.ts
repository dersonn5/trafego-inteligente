import { NextResponse } from 'next/server';
import { sendConversionEvent } from '@/lib/meta-api';
import type { ConversionEvent } from '@/lib/types';

export async function POST(request: Request) {
    try {
        const pixelId = process.env.META_PIXEL_ID;
        const accessToken = process.env.META_CAPI_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';

        if (!pixelId) {
            return NextResponse.json({ error: 'META_PIXEL_ID not configured' }, { status: 400 });
        }
        if (!accessToken) {
            return NextResponse.json({ error: 'Access token not configured' }, { status: 400 });
        }

        const body = await request.json();
        const events: ConversionEvent[] = Array.isArray(body) ? body : [body];

        // Validate required fields
        for (const event of events) {
            if (!event.event_name || !event.event_time || !event.action_source || !event.user_data) {
                return NextResponse.json(
                    { error: 'Missing required fields: event_name, event_time, action_source, user_data' },
                    { status: 400 }
                );
            }
        }

        const result = await sendConversionEvent(pixelId, accessToken, events);
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('POST /api/conversions error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
