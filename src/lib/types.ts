// Meta Marketing API TypeScript types

export const META_API_VERSION = process.env.META_API_VERSION || 'v25.0';
export const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// Campaign objectives available in v25.0
export type CampaignObjective =
    | 'OUTCOME_AWARENESS'
    | 'OUTCOME_ENGAGEMENT'
    | 'OUTCOME_LEADS'
    | 'OUTCOME_SALES'
    | 'OUTCOME_TRAFFIC'
    | 'OUTCOME_APP_PROMOTION';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
export type AdSetStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
export type AdStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';

export interface InsightsData {
    spend: string;
    impressions: string;
    reach: string;
    clicks: string;
    cpc: string;
    cpm: string;
    ctr: string;
    actions?: Array<{
        action_type: string;
        value: string;
    }>;
    cost_per_action_type?: Array<{
        action_type: string;
        value: string;
    }>;
    date_start: string;
    date_stop: string;
}

export interface Campaign {
    id: string;
    name: string;
    status: CampaignStatus;
    objective: CampaignObjective;
    daily_budget?: string;
    lifetime_budget?: string;
    budget_remaining?: string;
    special_ad_categories: string[];
    created_time: string;
    updated_time: string;
    start_time?: string;
    stop_time?: string;
    insights?: {
        data: InsightsData[];
    };
}

export interface AdSet {
    id: string;
    name: string;
    status: AdSetStatus;
    campaign_id: string;
    daily_budget?: string;
    lifetime_budget?: string;
    budget_remaining?: string;
    optimization_goal: string;
    billing_event: string;
    bid_amount?: string;
    targeting?: {
        age_min?: number;
        age_max?: number;
        genders?: number[];
        geo_locations?: {
            countries?: string[];
            regions?: Array<{ key: string; name: string }>;
            cities?: Array<{ key: string; name: string }>;
        };
        flexible_spec?: Array<{
            interests?: Array<{ id: string; name: string }>;
            behaviors?: Array<{ id: string; name: string }>;
        }>;
        publisher_platforms?: string[];
        facebook_positions?: string[];
        instagram_positions?: string[];
    };
    start_time?: string;
    end_time?: string;
    created_time: string;
    updated_time: string;
    insights?: {
        data: InsightsData[];
    };
}

export interface AdCreative {
    id: string;
    name?: string;
    title?: string;
    body?: string;
    image_url?: string;
    thumbnail_url?: string;
    object_story_spec?: {
        page_id: string;
        link_data?: {
            link: string;
            message: string;
            name?: string;
            description?: string;
            call_to_action?: {
                type: string;
                value?: { link: string };
            };
            image_hash?: string;
        };
        video_data?: {
            video_id: string;
            title?: string;
            message?: string;
            call_to_action?: {
                type: string;
                value?: { link: string };
            };
        };
    };
}

export interface Ad {
    id: string;
    name: string;
    status: AdStatus;
    adset_id: string;
    campaign_id?: string;
    creative?: AdCreative;
    created_time: string;
    updated_time: string;
    insights?: {
        data: InsightsData[];
    };
}

export interface AdAccount {
    id: string;
    name: string;
    account_status: number;
    currency?: string;
    timezone_name?: string;
    amount_spent?: string;
}

// Create campaign request
export interface CreateCampaignRequest {
    name: string;
    objective: CampaignObjective;
    status?: CampaignStatus;
    special_ad_categories?: string[];
    daily_budget?: string;
    lifetime_budget?: string;
}

// Create ad set request
export interface CreateAdSetRequest {
    name: string;
    campaign_id: string;
    daily_budget?: string;
    lifetime_budget?: string;
    optimization_goal: string;
    billing_event: string;
    bid_amount?: string;
    targeting: Record<string, unknown>;
    start_time?: string;
    end_time?: string;
    status?: AdSetStatus;
}

// CAPI event
export interface ConversionEvent {
    event_name: string;
    event_time: number;
    event_id?: string;
    event_source_url?: string;
    action_source: 'website' | 'app' | 'phone_call' | 'chat' | 'email' | 'other';
    user_data: {
        em?: string[];    // hashed email
        ph?: string[];    // hashed phone
        fn?: string[];    // hashed first name
        ln?: string[];    // hashed last name
        ct?: string[];    // hashed city
        st?: string[];    // hashed state
        zp?: string[];    // hashed zip
        country?: string[];
        external_id?: string[];
        client_ip_address?: string;
        client_user_agent?: string;
        fbc?: string;
        fbp?: string;
    };
    custom_data?: {
        value?: number;
        currency?: string;
        content_name?: string;
        content_category?: string;
        content_ids?: string[];
        content_type?: string;
        num_items?: number;
    };
}

// API response wrapper
export interface MetaApiResponse<T> {
    data: T[];
    paging?: {
        cursors: {
            before: string;
            after: string;
        };
        next?: string;
        previous?: string;
    };
}

// n8n webhook payload
export interface N8nWebhookPayload {
    action: 'create_campaign' | 'pause_campaign' | 'activate_campaign' | 'update_budget';
    ad_account_id?: string;
    campaign_id?: string;
    data?: Record<string, unknown>;
}

// Dashboard aggregated metrics
export interface DashboardMetrics {
    totalSpend: number;
    totalReach: number;
    totalImpressions: number;
    totalClicks: number;
    averageCPC: number;
    averageCTR: number;
    averageCPM: number;
    totalConversions: number;
    averageCPA: number;
}
