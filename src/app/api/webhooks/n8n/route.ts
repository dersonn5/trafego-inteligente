import { NextResponse } from 'next/server';
import { createCampaign, updateCampaignStatus } from '@/lib/meta-api';
import type { N8nWebhookPayload } from '@/lib/types';

export async function POST(request: Request) {
    try {
        // Auth check
        const authHeader = request.headers.get('authorization');
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

        if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: N8nWebhookPayload = await request.json();
        const accessToken = process.env.META_ACCESS_TOKEN || '';
        const adAccountId = body.ad_account_id || process.env.META_AD_ACCOUNT_ID || '';

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token not configured' }, { status: 400 });
        }

        switch (body.action) {
            case 'create_campaign': {
                if (!body.data?.name || !body.data?.objective) {
                    return NextResponse.json({ error: 'Missing name or objective in data' }, { status: 400 });
                }
                const result = await createCampaign(adAccountId, accessToken, {
                    name: body.data.name as string,
                    objective: body.data.objective as string,
                    status: (body.data.status as string) || 'PAUSED',
                } as never);
                return NextResponse.json({ success: true, campaign_id: result.id });
            }

            case 'pause_campaign': {
                if (!body.campaign_id) {
                    return NextResponse.json({ error: 'Missing campaign_id' }, { status: 400 });
                }
                await updateCampaignStatus(body.campaign_id, accessToken, 'PAUSED');
                return NextResponse.json({ success: true, campaign_id: body.campaign_id, status: 'PAUSED' });
            }

            case 'activate_campaign': {
                if (!body.campaign_id) {
                    return NextResponse.json({ error: 'Missing campaign_id' }, { status: 400 });
                }
                await updateCampaignStatus(body.campaign_id, accessToken, 'ACTIVE');
                return NextResponse.json({ success: true, campaign_id: body.campaign_id, status: 'ACTIVE' });
            }

            case 'update_budget': {
                return NextResponse.json({ error: 'update_budget not yet implemented' }, { status: 501 });
            }

            default:
                return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('POST /api/webhooks/n8n error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
