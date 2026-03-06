'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import {
    BarChart3,
    TrendingUp,
    Calendar,
} from 'lucide-react';
import {
    formatCurrency,
    formatNumber,
    formatPercent,
} from '@/lib/utils';
import type { InsightsData } from '@/lib/types';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

type DatePreset = 'last_7d' | 'last_14d' | 'last_30d';

const datePresetLabels: Record<DatePreset, string> = {
    last_7d: '7 dias',
    last_14d: '14 dias',
    last_30d: '30 dias',
};

export default function InsightsPage() {
    const [dailyData, setDailyData] = useState<InsightsData[]>([]);
    const [summaryData, setSummaryData] = useState<InsightsData | null>(null);
    const [datePreset, setDatePreset] = useState<DatePreset>('last_30d');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [dailyRes, summaryRes] = await Promise.all([
                fetch(`/api/meta/insights?datePreset=${datePreset}&timeIncrement=1`),
                fetch(`/api/meta/insights?datePreset=${datePreset}`),
            ]);

            if (dailyRes.ok) {
                const data = await dailyRes.json();
                setDailyData(data.data || []);
            }

            if (summaryRes.ok) {
                const data = await summaryRes.json();
                setSummaryData(data.data?.[0] || null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar insights');
        } finally {
            setIsLoading(false);
        }
    }, [datePreset]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    const chartData = dailyData.map((d) => ({
        date: new Date(d.date_start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        spend: parseFloat(d.spend || '0'),
        clicks: parseInt(d.clicks || '0', 10),
        impressions: parseInt(d.impressions || '0', 10),
        reach: parseInt(d.reach || '0', 10),
        cpc: parseFloat(d.cpc || '0'),
        ctr: parseFloat(d.ctr || '0'),
    }));

    const customTooltipStyle = {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
    };

    return (
        <>
            <Header
                title="Insights"
                onRefresh={fetchInsights}
                isLoading={isLoading}
            />
            <div className="app-content">
                <div className="page-header">
                    <div className="page-header-top">
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BarChart3 style={{ color: 'var(--accent-primary)' }} />
                            Insights
                        </h1>
                        <div className="chart-filters">
                            {(Object.entries(datePresetLabels) as [DatePreset, string][]).map(([key, label]) => (
                                <button
                                    key={key}
                                    className={`chart-filter-btn ${datePreset === key ? 'active' : ''}`}
                                    onClick={() => setDatePreset(key)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="page-subtitle">Performance geral da conta nos últimos {datePresetLabels[datePreset]}</p>
                </div>

                {error && (
                    <div className="error-state" style={{ marginBottom: 'var(--space-6)' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Summary Metrics */}
                {summaryData && (
                    <div className="metrics-grid">
                        <div className="metric-card" style={{ '--metric-accent': '#f59e0b' } as React.CSSProperties}>
                            <div className="metric-label">Gasto Total</div>
                            <div className="metric-value">{formatCurrency(summaryData.spend)}</div>
                        </div>
                        <div className="metric-card" style={{ '--metric-accent': '#0ea5e9' } as React.CSSProperties}>
                            <div className="metric-label">Alcance</div>
                            <div className="metric-value">{formatNumber(summaryData.reach)}</div>
                        </div>
                        <div className="metric-card" style={{ '--metric-accent': '#6366f1' } as React.CSSProperties}>
                            <div className="metric-label">Impressões</div>
                            <div className="metric-value">{formatNumber(summaryData.impressions)}</div>
                        </div>
                        <div className="metric-card" style={{ '--metric-accent': '#00d4aa' } as React.CSSProperties}>
                            <div className="metric-label">Cliques</div>
                            <div className="metric-value">{formatNumber(summaryData.clicks)}</div>
                        </div>
                        <div className="metric-card" style={{ '--metric-accent': '#ef4444' } as React.CSSProperties}>
                            <div className="metric-label">CPC Médio</div>
                            <div className="metric-value">{formatCurrency(summaryData.cpc)}</div>
                        </div>
                        <div className="metric-card" style={{ '--metric-accent': '#22c55e' } as React.CSSProperties}>
                            <div className="metric-label">CTR Médio</div>
                            <div className="metric-value">{formatPercent(summaryData.ctr)}</div>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-overlay">
                        <div className="spinner" />
                    </div>
                ) : chartData.length > 0 ? (
                    <>
                        {/* Spend Chart */}
                        <div className="chart-container">
                            <div className="chart-header">
                                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Calendar style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
                                    Gasto Diário
                                </h3>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#55556e" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#55556e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                                    <Tooltip contentStyle={customTooltipStyle} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Gasto']} />
                                    <Area type="monotone" dataKey="spend" stroke="#f59e0b" fill="url(#gradSpend)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Clicks Chart */}
                        <div className="chart-container">
                            <div className="chart-header">
                                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <TrendingUp style={{ width: 16, height: 16, color: 'var(--accent-secondary)' }} />
                                    Cliques Diários
                                </h3>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#55556e" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#55556e" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={customTooltipStyle} formatter={(value: number) => [formatNumber(value), 'Cliques']} />
                                    <Bar dataKey="clicks" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* CTR Chart */}
                        <div className="chart-container">
                            <div className="chart-header">
                                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <TrendingUp style={{ width: 16, height: 16, color: '#22c55e' }} />
                                    CTR Diário
                                </h3>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="gradCtr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#55556e" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#55556e" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip contentStyle={customTooltipStyle} formatter={(value: number) => [`${value.toFixed(2)}%`, 'CTR']} />
                                    <Area type="monotone" dataKey="ctr" stroke="#22c55e" fill="url(#gradCtr)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    <div className="card">
                        <div className="empty-state">
                            <BarChart3 />
                            <p className="empty-state-text">Sem dados de insights para o período selecionado</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
