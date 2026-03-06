import {
    META_API_BASE,
    type Campaign,
    type AdSet,
    type Ad,
    type AdAccount,
    type InsightsData,
    type MetaApiResponse,
    type CreateCampaignRequest,
    type ConversionEvent,
} from './types';

class MetaApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public errorType?: string,
        public errorSubcode?: number
    ) {
        super(message);
        this.name = 'MetaApiError';
    }
}

const CAMPAIGN_FIELDS = [
    'id', 'name', 'status', 'objective',
    'daily_budget', 'lifetime_budget', 'budget_remaining',
    'special_ad_categories', 'created_time', 'updated_time',
    'start_time', 'stop_time',
].join(',');

const CAMPAIGN_INSIGHTS_FIELDS = [
    'spend', 'impressions', 'reach', 'clicks',
    'cpc', 'cpm', 'ctr',
    'actions', 'cost_per_action_type',
    'date_start', 'date_stop',
].join(',');

const ADSET_FIELDS = [
    'id', 'name', 'status', 'campaign_id',
    'daily_budget', 'lifetime_budget', 'budget_remaining',
    'optimization_goal', 'billing_event', 'bid_amount',
    'targeting', 'start_time', 'end_time',
    'created_time', 'updated_time',
].join(',');

const AD_FIELDS = [
    'id', 'name', 'status', 'adset_id', 'campaign_id',
    'creative{id,name,title,body,image_url,thumbnail_url,object_story_spec}',
    'created_time', 'updated_time',
].join(',');

async function metaFetch<T>(
    endpoint: string,
    accessToken: string,
    options: {
        method?: 'GET' | 'POST' | 'DELETE';
        params?: Record<string, string>;
        body?: Record<string, unknown>;
    } = {}
): Promise<T> {
    const { method = 'GET', params = {}, body } = options;

    const url = new URL(`${META_API_BASE}${endpoint}`);
    url.searchParams.set('access_token', accessToken);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    const fetchOptions: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };

    if (body && method === 'POST') {
        // Meta API prefers form-encoded for POST but also accepts JSON for some endpoints
        // We'll use URLSearchParams for better compatibility
        const formBody = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
            formBody.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
        formBody.set('access_token', accessToken);
        fetchOptions.body = formBody.toString();
        fetchOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    }

    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.json();

    if (!response.ok || data.error) {
        const error = data.error || {};
        throw new MetaApiError(
            error.message || 'Unknown Meta API error',
            error.code || response.status,
            error.type,
            error.error_subcode
        );
    }

    return data as T;
}

// ─── Ad Accounts ─────────────────────────────────────────────────

export async function getAdAccounts(accessToken: string): Promise<AdAccount[]> {
    const response = await metaFetch<MetaApiResponse<AdAccount>>(
        '/me/adaccounts',
        accessToken,
        { params: { fields: 'id,name,account_status,currency,timezone_name,amount_spent', limit: '100' } }
    );
    return response.data;
}

// ─── Campaigns ───────────────────────────────────────────────────

export async function getCampaigns(
    adAccountId: string,
    accessToken: string,
    options: { datePreset?: string; limit?: number } = {}
): Promise<Campaign[]> {
    const { datePreset = 'last_30d', limit = 50 } = options;

    const response = await metaFetch<MetaApiResponse<Campaign>>(
        `/${adAccountId}/campaigns`,
        accessToken,
        {
            params: {
                fields: `${CAMPAIGN_FIELDS},insights.date_preset(${datePreset}){${CAMPAIGN_INSIGHTS_FIELDS}}`,
                limit: String(limit),
            },
        }
    );
    return response.data;
}

export async function getCampaign(
    campaignId: string,
    accessToken: string,
    datePreset: string = 'last_30d'
): Promise<Campaign> {
    return metaFetch<Campaign>(
        `/${campaignId}`,
        accessToken,
        {
            params: {
                fields: `${CAMPAIGN_FIELDS},insights.date_preset(${datePreset}){${CAMPAIGN_INSIGHTS_FIELDS}}`,
            },
        }
    );
}

export async function createCampaign(
    adAccountId: string,
    accessToken: string,
    data: CreateCampaignRequest
): Promise<{ id: string }> {
    return metaFetch<{ id: string }>(
        `/${adAccountId}/campaigns`,
        accessToken,
        {
            method: 'POST',
            body: {
                name: data.name,
                objective: data.objective,
                status: data.status || 'PAUSED',
                special_ad_categories: data.special_ad_categories || [],
                ...(data.daily_budget && { daily_budget: data.daily_budget }),
                ...(data.lifetime_budget && { lifetime_budget: data.lifetime_budget }),
            },
        }
    );
}

export async function updateCampaignStatus(
    campaignId: string,
    accessToken: string,
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
): Promise<{ success: boolean }> {
    return metaFetch<{ success: boolean }>(
        `/${campaignId}`,
        accessToken,
        { method: 'POST', body: { status } }
    );
}

// ─── Ad Sets ─────────────────────────────────────────────────────

export async function getAdSets(
    campaignId: string,
    accessToken: string,
    datePreset: string = 'last_30d'
): Promise<AdSet[]> {
    const response = await metaFetch<MetaApiResponse<AdSet>>(
        `/${campaignId}/adsets`,
        accessToken,
        {
            params: {
                fields: `${ADSET_FIELDS},insights.date_preset(${datePreset}){${CAMPAIGN_INSIGHTS_FIELDS}}`,
                limit: '100',
            },
        }
    );
    return response.data;
}

export async function createAdSet(
    adAccountId: string,
    accessToken: string,
    data: any
): Promise<{ id: string }> {
    return metaFetch<{ id: string }>(
        `/${adAccountId}/adsets`,
        accessToken,
        {
            method: 'POST',
            body: data,
        }
    );
}

// ─── Ads ─────────────────────────────────────────────────────────

export async function getAds(
    adSetId: string,
    accessToken: string,
    datePreset: string = 'last_30d'
): Promise<Ad[]> {
    const response = await metaFetch<MetaApiResponse<Ad>>(
        `/${adSetId}/ads`,
        accessToken,
        {
            params: {
                fields: `${AD_FIELDS},insights.date_preset(${datePreset}){${CAMPAIGN_INSIGHTS_FIELDS}}`,
                limit: '100',
            },
        }
    );
    return response.data;
}

export async function createAd(
    adAccountId: string,
    accessToken: string,
    data: any
): Promise<{ id: string }> {
    return metaFetch<{ id: string }>(
        `/${adAccountId}/ads`,
        accessToken,
        {
            method: 'POST',
            body: data,
        }
    );
}

// ─── Insights ────────────────────────────────────────────────────

export async function getInsights(
    objectId: string,
    accessToken: string,
    options: {
        datePreset?: string;
        timeRange?: { since: string; until: string };
        breakdowns?: string[];
        timeIncrement?: string;
    } = {}
): Promise<InsightsData[]> {
    const params: Record<string, string> = {
        fields: CAMPAIGN_INSIGHTS_FIELDS,
    };

    if (options.datePreset) {
        params.date_preset = options.datePreset;
    } else if (options.timeRange) {
        params.time_range = JSON.stringify(options.timeRange);
    } else {
        params.date_preset = 'last_30d';
    }

    if (options.breakdowns?.length) {
        params.breakdowns = options.breakdowns.join(',');
    }

    if (options.timeIncrement) {
        params.time_increment = options.timeIncrement;
    }

    const response = await metaFetch<MetaApiResponse<InsightsData>>(
        `/${objectId}/insights`,
        accessToken,
        { params }
    );
    return response.data;
}

// ─── Insights over time (for charts) ────────────────────────────

export async function getInsightsOverTime(
    adAccountId: string,
    accessToken: string,
    options: {
        datePreset?: string;
        timeIncrement?: string;
    } = {}
): Promise<InsightsData[]> {
    const { datePreset = 'last_30d', timeIncrement = '1' } = options;

    const response = await metaFetch<MetaApiResponse<InsightsData>>(
        `/${adAccountId}/insights`,
        accessToken,
        {
            params: {
                fields: CAMPAIGN_INSIGHTS_FIELDS,
                date_preset: datePreset,
                time_increment: timeIncrement,
            },
        }
    );
    return response.data;
}

// ─── Conversions API (CAPI) ─────────────────────────────────────

export async function sendConversionEvent(
    pixelId: string,
    accessToken: string,
    events: ConversionEvent[]
): Promise<{ events_received: number; fbtrace_id: string }> {
    return metaFetch<{ events_received: number; fbtrace_id: string }>(
        `/${pixelId}/events`,
        accessToken,
        {
            method: 'POST',
            body: {
                data: events,
            },
        }
    );
}

export { MetaApiError };
