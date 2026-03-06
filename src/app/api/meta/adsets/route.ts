import { NextResponse } from 'next/server';
import { getAdSets, createAdSet } from '@/lib/meta-api';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaignId');
        const accessToken = searchParams.get('accessToken') || process.env.META_ACCESS_TOKEN || '';
        const datePreset = searchParams.get('datePreset') || 'last_30d';

        if (!campaignId) {
            return NextResponse.json(
                { error: 'Missing campaignId parameter' },
                { status: 400 }
            );
        }

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Missing accessToken' },
                { status: 400 }
            );
        }

        const adSets = await getAdSets(campaignId, accessToken, datePreset);
        return NextResponse.json({ data: adSets });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('GET /api/meta/adsets error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            adAccountId,
            accessToken,
            adset_index,  // remove AI-specific field
            ...rawAdSetData
        } = body as {
            adAccountId?: string;
            accessToken?: string;
            adset_index?: number;
            [key: string]: any;
        };

        const accountId = adAccountId || process.env.META_AD_ACCOUNT_ID || '';
        const token = accessToken || process.env.META_ACCESS_TOKEN || '';

        if (!accountId || !token) {
            return NextResponse.json(
                { error: 'Missing adAccountId or accessToken' },
                { status: 400 }
            );
        }

        if (!rawAdSetData.campaign_id) {
            return NextResponse.json(
                { error: 'Missing campaign_id' },
                { status: 400 }
            );
        }

        // Ensure required fields have defaults
        const adSetData: Record<string, any> = {
            name: rawAdSetData.name || 'Conjunto de Anúncios',
            campaign_id: rawAdSetData.campaign_id,
            status: rawAdSetData.status || 'PAUSED',
            optimization_goal: rawAdSetData.optimization_goal || 'LINK_CLICKS',
            billing_event: rawAdSetData.billing_event || 'IMPRESSIONS',
            bid_strategy: rawAdSetData.bid_strategy || 'LOWEST_COST_WITHOUT_CAP',
        };

        // Budget — at least one is required
        if (rawAdSetData.daily_budget) {
            adSetData.daily_budget = rawAdSetData.daily_budget;
        } else {
            adSetData.daily_budget = '2000'; // default R$20/day
        }

        // Targeting — ensure minimum valid structure
        if (rawAdSetData.targeting) {
            const t = rawAdSetData.targeting;
            adSetData.targeting = {
                age_min: t.age_min || 18,
                age_max: t.age_max || 65,
                geo_locations: t.geo_locations || { countries: ['BR'] },
            };
            if (t.genders && t.genders.length > 0) {
                adSetData.targeting.genders = t.genders;
            }
            if (t.flexible_spec) {
                adSetData.targeting.flexible_spec = t.flexible_spec;
            }
            if (t.publisher_platforms) {
                adSetData.targeting.publisher_platforms = t.publisher_platforms;
            }
        } else {
            adSetData.targeting = {
                age_min: 18,
                age_max: 65,
                geo_locations: { countries: ['BR'] },
            };
        }

        // Schedule (optional)
        if (rawAdSetData.start_time) {
            adSetData.start_time = rawAdSetData.start_time;
        }
        if (rawAdSetData.end_time) {
            adSetData.end_time = rawAdSetData.end_time;
        }

        const result = await createAdSet(accountId, token, adSetData);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('POST /api/meta/adsets error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
