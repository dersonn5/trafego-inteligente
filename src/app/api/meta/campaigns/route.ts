import { NextResponse } from 'next/server';
import { getCampaigns, createCampaign, updateCampaignStatus } from '@/lib/meta-api';
import type { CreateCampaignRequest } from '@/lib/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const adAccountId = searchParams.get('adAccountId') || process.env.META_AD_ACCOUNT_ID || '';
        const accessToken = searchParams.get('accessToken') || process.env.META_ACCESS_TOKEN || '';
        const datePreset = searchParams.get('datePreset') || 'last_30d';

        if (!adAccountId || !accessToken) {
            return NextResponse.json(
                { error: 'Missing adAccountId or accessToken' },
                { status: 400 }
            );
        }

        const campaigns = await getCampaigns(adAccountId, accessToken, { datePreset });
        return NextResponse.json({ data: campaigns });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('GET /api/meta/campaigns error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { adAccountId, accessToken, ...campaignData } = body as {
            adAccountId?: string;
            accessToken?: string;
        } & CreateCampaignRequest;

        const accountId = adAccountId || process.env.META_AD_ACCOUNT_ID || '';
        const token = accessToken || process.env.META_ACCESS_TOKEN || '';

        if (!accountId || !token) {
            return NextResponse.json(
                { error: 'Missing adAccountId or accessToken' },
                { status: 400 }
            );
        }

        const result = await createCampaign(accountId, token, campaignData);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('POST /api/meta/campaigns error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { campaignId, status, accessToken } = body as {
            campaignId: string;
            status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
            accessToken?: string;
        };

        const token = accessToken || process.env.META_ACCESS_TOKEN || '';

        if (!campaignId || !status || !token) {
            return NextResponse.json(
                { error: 'Missing campaignId, status, or accessToken' },
                { status: 400 }
            );
        }

        const result = await updateCampaignStatus(campaignId, token, status);
        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('PATCH /api/meta/campaigns error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
