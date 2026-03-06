export function formatCurrency(value: number | string, currency: string = 'BRL'): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(num);
}

export function formatNumber(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';

    if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (num >= 1_000) {
        return `${(num / 1_000).toFixed(1)}k`;
    }
    return new Intl.NumberFormat('pt-BR').format(num);
}

export function formatPercent(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0%';
    return `${num.toFixed(2)}%`;
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function getObjectiveLabel(objective: string): string {
    const map: Record<string, string> = {
        OUTCOME_AWARENESS: 'Reconhecimento',
        OUTCOME_ENGAGEMENT: 'Engajamento',
        OUTCOME_LEADS: 'Leads',
        OUTCOME_SALES: 'Vendas',
        OUTCOME_TRAFFIC: 'Tráfego',
        OUTCOME_APP_PROMOTION: 'Apps',
        LINK_CLICKS: 'Cliques no Link',
        CONVERSIONS: 'Conversões',
        LEAD_GENERATION: 'Geração de Leads',
        MESSAGES: 'Mensagens',
        REACH: 'Alcance',
        BRAND_AWARENESS: 'Reconhecimento',
        VIDEO_VIEWS: 'Visualizações de Vídeo',
        POST_ENGAGEMENT: 'Engajamento',
        PAGE_LIKES: 'Curtidas na Página',
    };
    return map[objective] || objective;
}

export function getConversionsFromInsights(insights: { data: Array<{ actions?: Array<{ action_type: string; value: string }> }> } | undefined): number {
    if (!insights?.data?.[0]?.actions) return 0;
    const conversionActions = [
        'offsite_conversion.fb_pixel_purchase',
        'offsite_conversion.fb_pixel_lead',
        'offsite_conversion.fb_pixel_complete_registration',
        'lead',
        'purchase',
        'complete_registration',
        'onsite_conversion.messaging_conversation_started_7d',
    ];
    return insights.data[0].actions
        .filter(a => conversionActions.includes(a.action_type))
        .reduce((sum, a) => sum + parseFloat(a.value), 0);
}

export function getCPAFromInsights(insights: { data: Array<{ cost_per_action_type?: Array<{ action_type: string; value: string }> }> } | undefined): number {
    if (!insights?.data?.[0]?.cost_per_action_type) return 0;
    const cpaActions = [
        'offsite_conversion.fb_pixel_purchase',
        'offsite_conversion.fb_pixel_lead',
        'lead',
        'purchase',
    ];
    const cpa = insights.data[0].cost_per_action_type.find(a =>
        cpaActions.includes(a.action_type)
    );
    return cpa ? parseFloat(cpa.value) : 0;
}
