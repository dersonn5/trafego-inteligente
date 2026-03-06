'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
    ArrowLeft,
    ChevronDown,
    Target,
    Calendar,
    DollarSign,
    Users,
    MousePointerClick,
    Eye,
    TrendingUp,
    Image as ImageIcon,
} from 'lucide-react';
import {
    formatCurrency,
    formatNumber,
    formatPercent,
    formatDate,
    getObjectiveLabel,
} from '@/lib/utils';
import type { Campaign, AdSet, Ad } from '@/lib/types';

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    return (
        <span className={`status-badge ${s}`}>
            <span className="status-dot" />
            {status === 'ACTIVE' ? 'Ativo' :
                status === 'PAUSED' ? 'Pausado' :
                    status === 'ARCHIVED' ? 'Arquivado' : status}
        </span>
    );
}

function MiniMetrics({ insights }: { insights?: { data: Array<Record<string, string>> } }) {
    const data = insights?.data?.[0];
    if (!data) return <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-xs)' }}>Sem dados</span>;

    return (
        <div className="accordion-metrics">
            <div className="accordion-metric">
                <span className="accordion-metric-label">Gasto</span>
                <span className="accordion-metric-value">{formatCurrency(data.spend)}</span>
            </div>
            <div className="accordion-metric">
                <span className="accordion-metric-label">Alcance</span>
                <span className="accordion-metric-value">{formatNumber(data.reach)}</span>
            </div>
            <div className="accordion-metric">
                <span className="accordion-metric-label">Impressões</span>
                <span className="accordion-metric-value">{formatNumber(data.impressions)}</span>
            </div>
            <div className="accordion-metric">
                <span className="accordion-metric-label">Cliques</span>
                <span className="accordion-metric-value">{formatNumber(data.clicks)}</span>
            </div>
            <div className="accordion-metric">
                <span className="accordion-metric-label">CPC</span>
                <span className="accordion-metric-value">{formatCurrency(data.cpc)}</span>
            </div>
            <div className="accordion-metric">
                <span className="accordion-metric-label">CTR</span>
                <span className="accordion-metric-value">{formatPercent(data.ctr)}</span>
            </div>
        </div>
    );
}

function AdCard({ ad }: { ad: Ad }) {
    const insights = ad.insights?.data?.[0];
    const thumbnailUrl = ad.creative?.thumbnail_url || ad.creative?.image_url;

    return (
        <div className="ad-card">
            <div className="ad-card-preview">
                {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={ad.name} />
                ) : (
                    <ImageIcon style={{ width: 24, height: 24 }} />
                )}
            </div>
            <div className="ad-card-name">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ad.name}
                </span>
                <StatusBadge status={ad.status} />
            </div>
            {insights && (
                <div className="ad-card-metrics">
                    <div>
                        <div className="ad-card-metric-label">Gasto</div>
                        <div className="ad-card-metric-value">{formatCurrency(insights.spend)}</div>
                    </div>
                    <div>
                        <div className="ad-card-metric-label">Cliques</div>
                        <div className="ad-card-metric-value">{formatNumber(insights.clicks)}</div>
                    </div>
                    <div>
                        <div className="ad-card-metric-label">CTR</div>
                        <div className="ad-card-metric-value">{formatPercent(insights.ctr)}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdSetAccordion({ adSet }: { adSet: AdSet }) {
    const [isOpen, setIsOpen] = useState(false);
    const [ads, setAds] = useState<Ad[]>([]);
    const [adsLoading, setAdsLoading] = useState(false);

    const loadAds = async () => {
        if (ads.length > 0) return;
        setAdsLoading(true);
        try {
            const res = await fetch(`/api/meta/ads?adSetId=${adSet.id}`);
            if (res.ok) {
                const data = await res.json();
                setAds(data.data || []);
            }
        } catch (err) {
            console.error('Error loading ads:', err);
        } finally {
            setAdsLoading(false);
        }
    };

    const handleToggle = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        if (newState) loadAds();
    };

    const targeting = adSet.targeting;
    const targetingTags: string[] = [];

    if (targeting?.age_min && targeting?.age_max) {
        targetingTags.push(`${targeting.age_min}-${targeting.age_max} anos`);
    }
    if (targeting?.genders?.length) {
        const genderMap: Record<number, string> = { 1: 'Masculino', 2: 'Feminino' };
        targetingTags.push(targeting.genders.map(g => genderMap[g] || '').filter(Boolean).join(', '));
    }
    if (targeting?.geo_locations?.countries?.length) {
        targetingTags.push(targeting.geo_locations.countries.join(', '));
    }
    if (targeting?.geo_locations?.cities?.length) {
        targetingTags.push(targeting.geo_locations.cities.map(c => c.name).join(', '));
    }
    if (targeting?.flexible_spec?.[0]?.interests?.length) {
        const interests = targeting.flexible_spec[0].interests.slice(0, 3).map(i => i.name);
        if (targeting.flexible_spec[0].interests.length > 3) {
            interests.push(`+${targeting.flexible_spec[0].interests.length - 3}`);
        }
        targetingTags.push(interests.join(', '));
    }

    return (
        <div className="accordion-item">
            <div className="accordion-header" onClick={handleToggle}>
                <div className="accordion-header-left">
                    <Target style={{ width: 16, height: 16, color: 'var(--accent-secondary)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {adSet.name}
                            </span>
                            <StatusBadge status={adSet.status} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                            {adSet.daily_budget && (
                                <span>R$ {(parseFloat(adSet.daily_budget) / 100).toFixed(2)}/dia</span>
                            )}
                            {adSet.lifetime_budget && (
                                <span>R$ {(parseFloat(adSet.lifetime_budget) / 100).toFixed(2)} total</span>
                            )}
                            <span>Otim: {adSet.optimization_goal}</span>
                        </div>
                    </div>
                </div>
                <ChevronDown className={`accordion-chevron ${isOpen ? 'open' : ''}`} style={{ width: 18, height: 18 }} />
            </div>

            {isOpen && (
                <div className="accordion-body">
                    {/* Targeting */}
                    {targetingTags.length > 0 && (
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                                Segmentação
                            </div>
                            <div className="tags">
                                {targetingTags.map((tag, i) => (
                                    <span key={i} className="tag">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ad Set Metrics */}
                    <MiniMetrics insights={adSet.insights as { data: Array<Record<string, string>> } | undefined} />

                    {/* Ads */}
                    <div style={{ marginTop: 'var(--space-5)' }}>
                        <div className="section-title" style={{ fontSize: 'var(--font-size-sm)' }}>
                            <ImageIcon style={{ width: 14, height: 14 }} />
                            Anúncios ({ads.length})
                        </div>

                        {adsLoading ? (
                            <div className="loading-overlay" style={{ padding: 'var(--space-6)' }}>
                                <div className="spinner" />
                            </div>
                        ) : ads.length === 0 ? (
                            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-4)' }}>
                                Nenhum anúncio encontrado neste conjunto
                            </div>
                        ) : (
                            <div className="ad-cards">
                                {ads.map((ad) => (
                                    <AdCard key={ad.id} ad={ad} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CampaignDetailPage() {
    const params = useParams();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [adSets, setAdSets] = useState<AdSet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [campaignsRes, adSetsRes] = await Promise.all([
                fetch(`/api/meta/campaigns`),
                fetch(`/api/meta/adsets?campaignId=${campaignId}`),
            ]);

            if (campaignsRes.ok) {
                const campaignsData = await campaignsRes.json();
                const found = campaignsData.data?.find((c: Campaign) => c.id === campaignId);
                if (found) setCampaign(found);
            }

            if (adSetsRes.ok) {
                const adSetsData = await adSetsRes.json();
                setAdSets(adSetsData.data || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    }, [campaignId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const insights = campaign?.insights?.data?.[0];

    return (
        <>
            <Header
                title={campaign?.name || 'Carregando...'}
                onRefresh={fetchData}
                isLoading={isLoading}
            />
            <div className="app-content">
                <Link
                    href="/campaigns"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        marginBottom: 'var(--space-4)',
                        transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                    <ArrowLeft style={{ width: 14, height: 14 }} />
                    Voltar para Campanhas
                </Link>

                {error && (
                    <div className="error-state" style={{ marginBottom: 'var(--space-6)' }}>
                        ⚠️ {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-overlay">
                        <div className="spinner" />
                    </div>
                ) : campaign ? (
                    <>
                        {/* Campaign Header */}
                        <div className="campaign-detail-header">
                            <div className="campaign-detail-title">
                                {campaign.name}
                                <StatusBadge status={campaign.status} />
                            </div>
                            <div className="campaign-detail-meta">
                                <div className="campaign-detail-meta-item">
                                    <Target />
                                    {getObjectiveLabel(campaign.objective)}
                                </div>
                                {campaign.created_time && (
                                    <div className="campaign-detail-meta-item">
                                        <Calendar />
                                        Criada em {formatDate(campaign.created_time)}
                                    </div>
                                )}
                                {campaign.daily_budget && (
                                    <div className="campaign-detail-meta-item">
                                        <DollarSign />
                                        R$ {(parseFloat(campaign.daily_budget) / 100).toFixed(2)}/dia
                                    </div>
                                )}
                                {campaign.lifetime_budget && (
                                    <div className="campaign-detail-meta-item">
                                        <DollarSign />
                                        R$ {(parseFloat(campaign.lifetime_budget) / 100).toFixed(2)} vitalício
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Campaign Metrics */}
                        {insights && (
                            <div className="metrics-grid">
                                <div className="metric-card" style={{ '--metric-accent': '#f59e0b' } as React.CSSProperties}>
                                    <div className="metric-label"><DollarSign style={{ width: 14, height: 14 }} /> Gasto</div>
                                    <div className="metric-value">{formatCurrency(insights.spend)}</div>
                                </div>
                                <div className="metric-card" style={{ '--metric-accent': '#0ea5e9' } as React.CSSProperties}>
                                    <div className="metric-label"><Users style={{ width: 14, height: 14 }} /> Alcance</div>
                                    <div className="metric-value">{formatNumber(insights.reach)}</div>
                                </div>
                                <div className="metric-card" style={{ '--metric-accent': '#6366f1' } as React.CSSProperties}>
                                    <div className="metric-label"><Eye style={{ width: 14, height: 14 }} /> Impressões</div>
                                    <div className="metric-value">{formatNumber(insights.impressions)}</div>
                                </div>
                                <div className="metric-card" style={{ '--metric-accent': '#00d4aa' } as React.CSSProperties}>
                                    <div className="metric-label"><MousePointerClick style={{ width: 14, height: 14 }} /> Cliques</div>
                                    <div className="metric-value">{formatNumber(insights.clicks)}</div>
                                </div>
                                <div className="metric-card" style={{ '--metric-accent': '#ef4444' } as React.CSSProperties}>
                                    <div className="metric-label"><DollarSign style={{ width: 14, height: 14 }} /> CPC</div>
                                    <div className="metric-value">{formatCurrency(insights.cpc)}</div>
                                </div>
                                <div className="metric-card" style={{ '--metric-accent': '#22c55e' } as React.CSSProperties}>
                                    <div className="metric-label"><TrendingUp style={{ width: 14, height: 14 }} /> CTR</div>
                                    <div className="metric-value">{formatPercent(insights.ctr)}</div>
                                </div>
                            </div>
                        )}

                        {/* Ad Sets Drill-Down */}
                        <div className="section-title">
                            <Target />
                            Conjuntos de Anúncios ({adSets.length})
                        </div>

                        {adSets.length === 0 ? (
                            <div className="card">
                                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                                    <Target />
                                    <p className="empty-state-text">Nenhum conjunto de anúncios encontrado</p>
                                </div>
                            </div>
                        ) : (
                            <div className="accordion">
                                {adSets.map((adSet) => (
                                    <AdSetAccordion key={adSet.id} adSet={adSet} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <p className="empty-state-text">Campanha não encontrada</p>
                    </div>
                )}
            </div>
        </>
    );
}
