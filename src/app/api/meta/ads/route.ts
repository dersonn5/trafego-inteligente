import { NextResponse } from 'next/server';
import { getAds, createAd } from '@/lib/meta-api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const adSetId = searchParams.get('adSetId');
        const accessToken = searchParams.get('accessToken') || process.env.META_ACCESS_TOKEN || '';
        const datePreset = searchParams.get('datePreset') || 'last_30d';

        if (!adSetId) {
            return NextResponse.json(
                { error: 'Missing adSetId parameter' },
                { status: 400 }
            );
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Missing accessToken' },
                { status: 400 }
            );
        }

        const ads = await getAds(adSetId, accessToken, datePreset);
        return NextResponse.json({ data: ads });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('GET /api/meta/ads error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { adAccountId, accessToken, creative, adset_id, adset_index, ...rest } = body as {
            adAccountId?: string;
            accessToken?: string;
            creative?: { title?: string; body?: string };
            adset_id: string;
            adset_index?: number;
            [key: string]: any;
        };

        const accountId = adAccountId || process.env.META_AD_ACCOUNT_ID || '';
        const token = accessToken || process.env.META_ACCESS_TOKEN || '';
        const pageId = process.env.META_PAGE_ID || '';

        if (!accountId || !token) {
            return NextResponse.json(
                { error: 'Missing adAccountId or accessToken' },
                { status: 400 }
            );
        }

        if (!pageId) {
            return NextResponse.json(
                { error: 'META_PAGE_ID is not configured in .env.local. Required to create ads.' },
                { status: 400 }
            );
        }

        if (!adset_id) {
            return NextResponse.json(
                { error: 'Missing adset_id' },
                { status: 400 }
            );
        }

        // Build the ad creative spec from AI-generated creative data
        const adCreativeSpec: Record<string, any> = {
            name: `Creative - ${rest.name || 'Auto'}`,
            object_story_spec: {
                page_id: pageId,
                link_data: {
                    message: creative?.body || 'Saiba mais',
                    name: creative?.title || rest.name || 'Anúncio',
                    link: `https://fb.com/${pageId}`,
                    call_to_action: { type: 'LEARN_MORE' },
                },
            },
        };

        // Add instagram_user_id if available
        const igUserId = process.env.META_INSTAGRAM_USER_ID;
        if (igUserId) {
            adCreativeSpec.object_story_spec.instagram_user_id = igUserId;
        }

        const adData = {
            name: rest.name || 'Anúncio Auto',
            status: rest.status || 'PAUSED',
            adset_id,
            creative: adCreativeSpec,
        };

        const result = await createAd(accountId, token, adData);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('POST /api/meta/ads error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
