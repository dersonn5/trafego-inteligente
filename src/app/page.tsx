'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import {
  DollarSign,
  Users,
  MousePointerClick,
  Eye,
  TrendingUp,
  ArrowUpRight,
  Megaphone,
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getObjectiveLabel,
} from '@/lib/utils';
import type { Campaign, InsightsData } from '@/lib/types';

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentColor?: string;
}

function MetricCard({ label, value, icon, accentColor }: MetricCardProps) {
  return (
    <div
      className="metric-card"
      style={{ '--metric-accent': accentColor } as React.CSSProperties}
    >
      <div className="metric-label">
        {icon}
        {label}
      </div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

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

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [accountInsights, setAccountInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [campaignsRes, insightsRes] = await Promise.all([
        fetch('/api/meta/campaigns'),
        fetch('/api/meta/insights?datePreset=last_30d'),
      ]);

      if (!campaignsRes.ok) {
        const errData = await campaignsRes.json();
        throw new Error(errData.error || 'Failed to fetch campaigns');
      }

      const campaignsData = await campaignsRes.json();
      setCampaigns(campaignsData.data || []);

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        if (insightsData.data?.[0]) {
          setAccountInsights(insightsData.data[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');

  return (
    <>
      <Header
        title="Dashboard"
        onRefresh={fetchData}
        isLoading={isLoading}
      />
      <div className="app-content">
        {error && (
          <div className="error-state" style={{ marginBottom: 'var(--space-6)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* KPI Metrics */}
        <div className="metrics-grid">
          <MetricCard
            label="Gasto Total"
            value={accountInsights ? formatCurrency(accountInsights.spend) : '—'}
            icon={<DollarSign />}
            accentColor="#f59e0b"
          />
          <MetricCard
            label="Alcance"
            value={accountInsights ? formatNumber(accountInsights.reach) : '—'}
            icon={<Users />}
            accentColor="#0ea5e9"
          />
          <MetricCard
            label="Impressões"
            value={accountInsights ? formatNumber(accountInsights.impressions) : '—'}
            icon={<Eye />}
            accentColor="#6366f1"
          />
          <MetricCard
            label="Cliques"
            value={accountInsights ? formatNumber(accountInsights.clicks) : '—'}
            icon={<MousePointerClick />}
            accentColor="#00d4aa"
          />
          <MetricCard
            label="CPC"
            value={accountInsights ? formatCurrency(accountInsights.cpc) : '—'}
            icon={<DollarSign />}
            accentColor="#ef4444"
          />
          <MetricCard
            label="CTR"
            value={accountInsights ? formatPercent(accountInsights.ctr) : '—'}
            icon={<TrendingUp />}
            accentColor="#22c55e"
          />
        </div>

        {/* Active Campaigns */}
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="chart-header">
            <h2 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone style={{ width: 18, height: 18, color: 'var(--accent-primary)' }} />
              Campanhas Ativas ({activeCampaigns.length})
            </h2>
            <Link href="/campaigns" className="btn btn-secondary btn-sm">
              Ver todas <ArrowUpRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {isLoading ? (
            <div className="loading-overlay">
              <div className="spinner" />
            </div>
          ) : activeCampaigns.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <Megaphone />
              <p className="empty-state-text">Nenhuma campanha ativa</p>
              <Link href="/campaigns/create" className="btn btn-primary">
                Criar Campanha
              </Link>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Campanha</th>
                    <th>Objetivo</th>
                    <th>Status</th>
                    <th>Gasto</th>
                    <th>Alcance</th>
                    <th>Cliques</th>
                    <th>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCampaigns.slice(0, 5).map((campaign) => {
                    const insights = campaign.insights?.data?.[0];
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
                        <td>{insights ? formatPercent(insights.ctr) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Campaigns Summary */}
        {campaigns.length > 0 && (
          <div className="card">
            <div className="chart-header">
              <h2 className="chart-title">Todas as Campanhas ({campaigns.length})</h2>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
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
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const insights = campaign.insights?.data?.[0];
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
