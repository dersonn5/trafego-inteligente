'use client';

import Header from '@/components/layout/Header';
import { Zap, Webhook, Code, Activity, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
            {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
            {copied ? 'Copiado!' : 'Copiar'}
        </button>
    );
}

function IntegrationCard({ icon, name, desc, status, children }: { icon: React.ReactNode; name: string; desc: string; status: string; children: React.ReactNode }) {
    return (
        <div className="card" style={{ padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: status === 'ok' ? 'var(--accent-primary-muted)' : 'var(--warning-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: status === 'ok' ? 'var(--accent-primary)' : 'var(--warning)' }}>{icon}</div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
                    </div>
                </div>
                <span className={`status-badge ${status === 'ok' ? 'active' : 'paused'}`}><span className="status-dot" />{status === 'ok' ? 'Configurado' : 'Pendente'}</span>
            </div>
            <div style={{ padding: '20px 24px' }}>{children}</div>
        </div>
    );
}

export default function IntegrationsPage() {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const capiEndpoint = `${base}/api/conversions`;
    const n8nEndpoint = `${base}/api/webhooks/n8n`;

    return (
        <>
            <Header title="Integrações" />
            <div className="app-content">
                <div className="page-header">
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap style={{ color: 'var(--accent-primary)' }} /> Integrações</h1>
                    <p className="page-subtitle">Configure endpoints e integrações com serviços externos</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <IntegrationCard icon={<Activity size={24} />} name="Conversions API (CAPI)" desc="Envie eventos de conversão server-side para o Meta" status="ok">
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Endpoint</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                                <span className="tag" style={{ background: 'var(--accent-secondary-muted)', color: 'var(--accent-secondary)', border: 'none' }}>POST</span>
                                <code style={{ flex: 1, fontSize: 13 }}>{capiEndpoint}</code>
                                <CopyBtn text={capiEndpoint} />
                            </div>
                        </div>
                    </IntegrationCard>

                    <IntegrationCard icon={<Webhook size={24} />} name="n8n Webhook" desc="Receba triggers do n8n para automatizar campanhas" status="ok">
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Endpoint</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                                <span className="tag" style={{ background: 'var(--accent-secondary-muted)', color: 'var(--accent-secondary)', border: 'none' }}>POST</span>
                                <code style={{ flex: 1, fontSize: 13 }}>{n8nEndpoint}</code>
                                <CopyBtn text={n8nEndpoint} />
                            </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ações: create_campaign, pause_campaign, activate_campaign, update_budget</div>
                    </IntegrationCard>

                    <IntegrationCard icon={<Code size={24} />} name="Meta Pixel" desc="Instale o Pixel no seu site para rastrear eventos do browser" status="pending">
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Configure o <code>META_PIXEL_ID</code> no <code>.env.local</code> para ativar.</p>
                    </IntegrationCard>
                </div>

                <div className="card" style={{ marginTop: 24 }}>
                    <div className="section-title"><ExternalLink /> Como conectar ao n8n</div>
                    <ol style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: 13, listStyle: 'decimal' }}>
                        <li>No n8n, adicione um nó <strong>HTTP Request</strong></li>
                        <li>Método: <strong>POST</strong> · URL: <code>{n8nEndpoint}</code></li>
                        <li>Header: <code>Authorization: Bearer SEU_N8N_WEBHOOK_SECRET</code></li>
                        <li>Body JSON com a ação desejada</li>
                    </ol>
                </div>
            </div>
        </>
    );
}
