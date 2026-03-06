'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Sparkles, Send, CheckCircle2, AlertCircle, PauseCircle, Loader2, XCircle } from 'lucide-react';

interface StepLog {
    label: string;
    status: 'pending' | 'loading' | 'success' | 'error';
    detail?: string;
}

export default function AICreatorPage() {
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmittingToMeta, setIsSubmittingToMeta] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [aiDraft, setAiDraft] = useState<any | null>(null);
    const [steps, setSteps] = useState<StepLog[]>([]);

    const updateStep = (index: number, update: Partial<StepLog>) => {
        setSteps(prev => prev.map((s, i) => i === index ? { ...s, ...update } : s));
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setAiDraft(null);
        setSuccessMessage(null);
        setSteps([]);

        try {
            const res = await fetch('/api/ai/generate-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || errData.error || 'Falha ao conectar com a IA');
            }

            const data = await res.json();
            setAiDraft(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreateInMeta = async () => {
        if (!aiDraft) return;

        setIsSubmittingToMeta(true);
        setError(null);
        setSuccessMessage(null);

        // Build step list
        const initialSteps: StepLog[] = [
            { label: `Campanha: ${aiDraft.campaign.name}`, status: 'pending' },
        ];
        aiDraft.adsets.forEach((adset: any, i: number) => {
            initialSteps.push({ label: `Conjunto ${i + 1}: ${adset.name}`, status: 'pending' });
            const adsForSet = aiDraft.ads?.filter((a: any) => a.adset_index === i) || [];
            adsForSet.forEach((ad: any) => {
                initialSteps.push({ label: `  Anúncio: ${ad.name}`, status: 'pending' });
            });
        });
        setSteps(initialSteps);

        let stepIdx = 0;

        try {
            // 1. Create Campaign
            updateStep(stepIdx, { status: 'loading' });

            const campaignRes = await fetch('/api/meta/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiDraft.campaign),
            });

            if (!campaignRes.ok) {
                const err = await campaignRes.json();
                updateStep(stepIdx, { status: 'error', detail: err.error?.message || err.error });
                throw new Error(`Campanha: ${err.error?.message || err.error}`);
            }

            const createdCampaign = await campaignRes.json();
            const campaignId = createdCampaign.id;
            updateStep(stepIdx, { status: 'success', detail: `ID: ${campaignId}` });
            stepIdx++;

            // 2. Create AdSets + Ads
            for (let i = 0; i < aiDraft.adsets.length; i++) {
                const adsetDraft = { ...aiDraft.adsets[i] };
                adsetDraft.campaign_id = campaignId;

                updateStep(stepIdx, { status: 'loading' });

                const adsetRes = await fetch('/api/meta/adsets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(adsetDraft),
                });

                if (!adsetRes.ok) {
                    const err = await adsetRes.json();
                    updateStep(stepIdx, { status: 'error', detail: err.error?.message || err.error || 'Falha desconhecida' });
                    throw new Error(`Conjunto ${i + 1}: ${err.error?.message || err.error}`);
                }

                const createdAdset = await adsetRes.json();
                const adsetId = createdAdset.id;
                updateStep(stepIdx, { status: 'success', detail: `ID: ${adsetId}` });
                stepIdx++;

                // 3. Create Ads for this AdSet
                const adsForThisSet = aiDraft.ads?.filter((a: any) => a.adset_index === i) || [];
                for (const adDraft of adsForThisSet) {
                    updateStep(stepIdx, { status: 'loading' });

                    const adPayload = {
                        ...adDraft,
                        adset_id: adsetId,
                    };

                    const adRes = await fetch('/api/meta/ads', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(adPayload),
                    });

                    if (!adRes.ok) {
                        const err = await adRes.json();
                        updateStep(stepIdx, { status: 'error', detail: err.error?.message || err.error || 'Falha' });
                        // Ads failing is non-fatal — continue to next
                        stepIdx++;
                        continue;
                    }

                    const createdAd = await adRes.json();
                    updateStep(stepIdx, { status: 'success', detail: `ID: ${createdAd.id}` });
                    stepIdx++;
                }
            }

            const allSuccess = steps.every(s => s.status !== 'error');
            setSuccessMessage(allSuccess
                ? '✅ Campanha criada com todos os níveis! Redirecionando...'
                : '⚠️ Campanha criada, mas alguns itens falharam. Verifique o log abaixo.'
            );

            setTimeout(() => {
                router.push(`/campaigns/${campaignId}`);
            }, 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao submeter para a Meta.');
        } finally {
            setIsSubmittingToMeta(false);
        }
    };

    return (
        <>
            <Header title="Criação com IA (Beta)" />
            <div className="app-content" style={{ maxWidth: 900 }}>

                <div style={{
                    marginBottom: 'var(--space-6)',
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(0, 212, 170, 0.1) 100%)',
                    border: '1px solid rgba(0, 212, 170, 0.2)',
                    padding: 'var(--space-6)',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                        <Sparkles style={{ color: 'var(--accent-primary)', width: 24, height: 24 }} />
                        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                            Gerador de Campanhas Automático
                        </h2>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', margin: 0, maxWidth: 600 }}>
                        Descreva a campanha que você deseja criar. A IA irá estruturar as configurações técnicas, o público alvo e orçamentos automaticamente. <b>As campanhas são sempre submetidas pausadas.</b>
                    </p>
                </div>

                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                        O que você quer criar hoje?
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Crie uma campanha de mensagens no WhatsApp para a clínica de estética, focada em mulheres de 25-45 anos que moram em São Paulo. Orçamento de R$ 50 diários divididos em 2 conjuntos de anúncios (um aberto e um foco em maquiagem)."
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            resize: 'vertical',
                            fontSize: 'var(--font-size-sm)',
                            lineHeight: 1.5,
                            marginBottom: 'var(--space-4)'
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="btn btn-primary"
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                        >
                            {isGenerating ? (
                                <div className="spinner" style={{ width: 16, height: 16 }} />
                            ) : (
                                <Sparkles style={{ width: 16, height: 16 }} />
                            )}
                            {isGenerating ? 'Analisando e Estruturando...' : 'Gerar Estrutura com IA'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-state" style={{ marginBottom: 'var(--space-6)', justifyContent: 'flex-start' }}>
                        <AlertCircle style={{ width: 20, height: 20 }} />
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="empty-state" style={{ marginBottom: 'var(--space-6)', background: 'var(--success-muted)', borderColor: 'var(--success)', color: 'var(--success)', flexDirection: 'row', padding: '16px', gap: '8px' }}>
                        <CheckCircle2 style={{ width: 20, height: 20 }} />
                        <span style={{ fontWeight: 600 }}>{successMessage}</span>
                    </div>
                )}

                {/* Progress Log */}
                {steps.length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Progresso da Criação na Meta
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {steps.map((step, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    background: step.status === 'error' ? 'rgba(239,68,68,0.08)' :
                                        step.status === 'success' ? 'rgba(34,197,94,0.08)' :
                                            step.status === 'loading' ? 'rgba(14,165,233,0.08)' :
                                                'var(--bg-tertiary)',
                                    fontSize: 'var(--font-size-xs)',
                                    transition: 'all 200ms ease',
                                }}>
                                    {step.status === 'loading' && <Loader2 size={14} style={{ color: 'var(--accent-secondary)', animation: 'spin 1s linear infinite' }} />}
                                    {step.status === 'success' && <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />}
                                    {step.status === 'error' && <XCircle size={14} style={{ color: 'var(--danger)' }} />}
                                    {step.status === 'pending' && <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--text-tertiary)' }} />}
                                    <span style={{
                                        flex: 1,
                                        fontWeight: step.status === 'loading' ? 600 : 400,
                                        color: step.status === 'error' ? 'var(--danger)' :
                                            step.status === 'success' ? 'var(--text-primary)' :
                                                step.status === 'loading' ? 'var(--accent-secondary)' :
                                                    'var(--text-tertiary)',
                                    }}>{step.label}</span>
                                    {step.detail && (
                                        <span style={{
                                            fontSize: 11,
                                            color: step.status === 'error' ? 'var(--danger)' : 'var(--text-tertiary)',
                                            fontFamily: 'monospace',
                                        }}>{step.detail}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {aiDraft && !isGenerating && (
                    <div className="card" style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
                            <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 style={{ color: 'var(--success)' }} />
                                Rascunho da Campanha Gerado
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--warning-muted)', padding: '4px 10px', borderRadius: 20, fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--warning)' }}>
                                <PauseCircle size={14} /> SEMPRE PAUSADA
                            </div>
                        </div>

                        {/* Visão da Estrutura */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {/* Campanha */}
                            <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-primary)' }}>
                                <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 4 }}>
                                    Nível 1: Campanha
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-default)', marginBottom: 8 }}>
                                    {aiDraft.campaign.name}
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                                    <span><b>Objetivo:</b> {aiDraft.campaign.objective}</span>
                                    {aiDraft.campaign.daily_budget && (
                                        <span><b>Orç. Diário Geral:</b> R$ {(parseInt(aiDraft.campaign.daily_budget) / 100).toFixed(2)}</span>
                                    )}
                                </div>
                            </div>

                            {/* AdSets */}
                            <div style={{ display: 'grid', gap: 'var(--space-3)', paddingLeft: 'var(--space-5)' }}>
                                {aiDraft.adsets.map((adset: any, idx: number) => (
                                    <div key={idx} style={{ background: 'var(--bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-secondary)' }}>
                                        <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 4 }}>
                                            Nível 2: Conjunto {idx + 1}
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>
                                            {adset.name}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            <b>Targeting:</b> Idade {adset.targeting?.age_min || 18}-{adset.targeting?.age_max || 65} |
                                            Geo: {adset.targeting?.geo_locations?.countries?.join(', ') || 'N/A'}
                                            <br />
                                            <b>Otimização:</b> {adset.optimization_goal} |
                                            <b> Orçamento:</b> {adset.daily_budget ? `R$ ${(parseInt(adset.daily_budget) / 100).toFixed(2)}` : 'N/A'}
                                        </div>

                                        {/* Ads dentro deste AdSet */}
                                        <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                                            {aiDraft.ads?.filter((a: any) => a.adset_index === idx).map((ad: any, adIdx: number) => (
                                                <div key={adIdx} style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--text-tertiary)' }}>
                                                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700 }}>
                                                        Nível 3: Anúncio
                                                    </div>
                                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)' }}>{ad.name}</div>
                                                    {ad.creative?.title && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}><b>Title:</b> {ad.creative.title}</div>}
                                                    {ad.creative?.body && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}><b>Texto:</b> {ad.creative.body}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => { setAiDraft(null); setSteps([]); }}
                                disabled={isSubmittingToMeta}
                            >
                                Descartar e Tentar Novamente
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateInMeta}
                                disabled={isSubmittingToMeta}
                                style={{ minWidth: 200 }}
                            >
                                {isSubmittingToMeta ? (
                                    <>
                                        <div className="spinner" style={{ width: 16, height: 16 }} />
                                        Criando na Meta...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Confirmar & Criar na Meta
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
