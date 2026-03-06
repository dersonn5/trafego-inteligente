'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
    Search,
    PlusCircle,
    Play,
    Pause,
    Archive,
    Megaphone,
} from 'lucide-react';
import {
    formatCurrency,
    formatNumber,
    formatPercent,
    getObjectiveLabel,
} from '@/lib/utils';
import type { Campaign } from '@/lib/types';

type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

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

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchCampaigns = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/meta/campaigns');
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to fetch');
            }
            const data = await res.json();
            setCampaigns(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const handleStatusChange = async (campaignId: string, newStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') => {
        setUpdatingId(campaignId);
        try {
            const res = await fetch('/api/meta/campaigns', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId, status: newStatus }),
            });
            if (res.ok) {
                setCampaigns(prev =>
                    prev.map(c => c.id === campaignId ? { ...c, status: newStatus } : c)
                );
            }
        } catch (err) {
            console.error('Error updating status:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        ALL: campaigns.length,
        ACTIVE: campaigns.filter(c => c.status === 'ACTIVE').length,
        PAUSED: campaigns.filter(c => c.status === 'PAUSED').length,
        ARCHIVED: campaigns.filter(c => c.status === 'ARCHIVED').length,
    };

    return (
        <>
            <Header
                title="Campanhas"
                onRefresh={fetchCampaigns}
                isLoading={isLoading}
            />
            <div className="app-content">
                <div className="page-header">
                    <div className="page-header-top">
                        <h1 className="page-title">Campanhas</h1>
                        <Link href="/campaigns/create" className="btn btn-primary">
                            <PlusCircle style={{ width: 16, height: 16 }} />
                            Nova Campanha
                        </Link>
                    </div>
                    <p className="page-subtitle">{campaigns.length} campanhas encontradas</p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                    <div style={{
                        flex: 1,
                        minWidth: 240,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                    }}>
                        <Search style={{
                            position: 'absolute',
                            left: 12,
                            width: 16,
                            height: 16,
                            color: 'var(--text-tertiary)',
                        }} />
                        <input
                            type="text"
                            placeholder="Buscar campanha..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            id="campaign-search"
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 36px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-size-base)',
                            }}
                        />
                    </div>

                    <div className="chart-filters">
                        {(['ALL', 'ACTIVE', 'PAUSED', 'ARCHIVED'] as StatusFilter[]).map((status) => (
                            <button
                                key={status}
                                className={`chart-filter-btn ${statusFilter === status ? 'active' : ''}`}
                                onClick={() => setStatusFilter(status)}
                            >
                                {status === 'ALL' ? 'Todas' :
                                    status === 'ACTIVE' ? 'Ativas' :
                                        status === 'PAUSED' ? 'Pausadas' : 'Arquivadas'}
                                {' '}({statusCounts[status]})
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="error-state" style={{ marginBottom: 'var(--space-6)' }}>
                        ⚠️ {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-overlay">
                        <div className="spinner" />
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <Megaphone />
                            <p className="empty-state-text">
                                {search ? 'Nenhuma campanha encontrada para esta busca' : 'Nenhuma campanha encontrada'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Campanha</th>
                                    <th>Objetivo</th>
                                    <th>Status</th>
                                    <th>Gasto</th>
                                    <th>Alcance</th>
                                    <th>Cliques</th>
                                    <th>CPC</th>
                                    <th>CTR</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCampaigns.map((campaign) => {
                                    const insights = campaign.insights?.data?.[0];
                                    const isUpdating = updatingId === campaign.id;

                                    return (
                                        <tr key={campaign.id}>
                                            <td>
                                                <div className="table-campaign-name">
                                                    <Link href={`/campaigns/${campaign.id}`}>
                                                        {campaign.name}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="tag">
                                                    {getObjectiveLabel(campaign.objective)}
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge status={campaign.status} />
                                            </td>
                                            <td>{insights ? formatCurrency(insights.spend) : '—'}</td>
                                            <td>{insights ? formatNumber(insights.reach) : '—'}</td>
                                            <td>{insights ? formatNumber(insights.clicks) : '—'}</td>
                                            <td>{insights ? formatCurrency(insights.cpc) : '—'}</td>
                                            <td>{insights ? formatPercent(insights.ctr) : '—'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    {campaign.status === 'PAUSED' && (
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
                                                            disabled={isUpdating}
                                                            title="Ativar"
                                                        >
                                                            <Play style={{ width: 12, height: 12 }} />
                                                        </button>
                                                    )}
                                                    {campaign.status === 'ACTIVE' && (
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => handleStatusChange(campaign.id, 'PAUSED')}
                                                            disabled={isUpdating}
                                                            title="Pausar"
                                                        >
                                                            <Pause style={{ width: 12, height: 12 }} />
                                                        </button>
                                                    )}
                                                    {campaign.status !== 'ARCHIVED' && (
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => handleStatusChange(campaign.id, 'ARCHIVED')}
                                                            disabled={isUpdating}
                                                            title="Arquivar"
                                                        >
                                                            <Archive style={{ width: 12, height: 12 }} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
