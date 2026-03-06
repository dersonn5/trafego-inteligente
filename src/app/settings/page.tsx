'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Settings, User, Key, Shield, Check, AlertCircle } from 'lucide-react';
import type { AdAccount } from '@/lib/types';

export default function SettingsPage() {
    const [accounts, setAccounts] = useState<AdAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        async function loadAccounts() {
            try {
                const res = await fetch('/api/meta/accounts');
                if (res.ok) {
                    const data = await res.json();
                    setAccounts(data.data || []);
                }
            } catch { /* silent */ }
            setIsLoading(false);
        }
        loadAccounts();
    }, []);

    const inputStyle = {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        fontSize: 14,
    };

    const labelStyle = {
        display: 'block' as const,
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: 8,
    };

    return (
        <>
            <Header title="Configurações" />
            <div className="app-content" style={{ maxWidth: 700 }}>
                <div className="page-header">
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Settings style={{ color: 'var(--accent-primary)' }} /> Configurações
                    </h1>
                    <p className="page-subtitle">Gerencie suas contas e credenciais Meta</p>
                </div>

                {/* Account Info */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="section-title"><User /> Contas de Anúncios</div>
                    {isLoading ? (
                        <div className="loading-overlay" style={{ padding: 24 }}><div className="spinner" /></div>
                    ) : accounts.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {accounts.map(acc => (
                                <div key={acc.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 10,
                                    border: `1px solid ${selectedAccount === acc.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                    cursor: 'pointer', transition: 'all 150ms',
                                }} onClick={() => setSelectedAccount(acc.id)}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{acc.name}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{acc.id} {acc.currency && `· ${acc.currency}`}</div>
                                    </div>
                                    <span className={`status-badge ${acc.account_status === 1 ? 'active' : 'paused'}`}>
                                        <span className="status-dot" />
                                        {acc.account_status === 1 ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                            Nenhuma conta encontrada. Verifique seu token de acesso.
                        </div>
                    )}
                </div>

                {/* Credentials */}
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="section-title"><Key /> Credenciais (.env.local)</div>
                    <div style={{
                        background: 'var(--warning-muted)', borderRadius: 10, padding: 12,
                        border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: 'var(--warning)',
                        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
                    }}>
                        <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                        As credenciais são gerenciadas no arquivo <code>.env.local</code>. Nunca exponha tokens no código.
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label style={labelStyle}>META_APP_ID</label>
                            <input style={inputStyle} type="text" placeholder="Seu App ID" disabled value="Configurado via .env.local" />
                        </div>
                        <div>
                            <label style={labelStyle}>META_ACCESS_TOKEN</label>
                            <input style={inputStyle} type="password" value="••••••••••••••••••••" disabled />
                        </div>
                        <div>
                            <label style={labelStyle}>META_AD_ACCOUNT_ID</label>
                            <input style={inputStyle} type="text" value="act_391748118054937" disabled />
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="card">
                    <div className="section-title"><Shield /> Segurança</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check style={{ width: 14, height: 14, color: 'var(--success)' }} />
                            Tokens armazenados em variáveis de ambiente (não expostos ao browser)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check style={{ width: 14, height: 14, color: 'var(--success)' }} />
                            API routes server-side (tokens nunca saem do servidor)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Check style={{ width: 14, height: 14, color: 'var(--success)' }} />
                            CORS restrito · HTTPS em produção
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
