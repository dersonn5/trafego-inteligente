'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Target,
    Users,
    Image as ImageIcon,
    AlertCircle,
} from 'lucide-react';
import type { CampaignObjective } from '@/lib/types';

type Step = 1 | 2 | 3 | 4;

const objectives: { value: CampaignObjective; label: string; description: string }[] = [
    { value: 'OUTCOME_SALES', label: 'Vendas', description: 'Encontre pessoas propensas a comprar seus produtos ou serviços' },
    { value: 'OUTCOME_LEADS', label: 'Leads', description: 'Colete leads para o seu negócio, como e-mails e telefones' },
    { value: 'OUTCOME_TRAFFIC', label: 'Tráfego', description: 'Envie mais pessoas para um destino: site, app ou evento' },
    { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento', description: 'Obtenha mais mensagens, curtidas, comentários e compartilhamentos' },
    { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento', description: 'Alcance o maior número de pessoas que possam se lembrar do seu anúncio' },
    { value: 'OUTCOME_APP_PROMOTION', label: 'Promoção do App', description: 'Encontre novas pessoas para instalar seu app e continuar usando' },
];

const stepLabels = ['Campanha', 'Conjunto de Anúncios', 'Anúncio', 'Revisão'];

export default function CreateCampaignPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Step 1
    const [campaignName, setCampaignName] = useState('');
    const [objective, setObjective] = useState<CampaignObjective>('OUTCOME_SALES');
    const [specialAdCategory, setSpecialAdCategory] = useState('NONE');

    // Step 2
    const [adSetName, setAdSetName] = useState('');
    const [dailyBudget, setDailyBudget] = useState('20');
    const [ageMin, setAgeMin] = useState('18');
    const [ageMax, setAgeMax] = useState('65');
    const [genders, setGenders] = useState('0');
    const [locations, setLocations] = useState('BR');
    const [optimizationGoal, setOptimizationGoal] = useState('OFFSITE_CONVERSIONS');

    // Step 3
    const [adName, setAdName] = useState('');
    const [primaryText, setPrimaryText] = useState('');
    const [headline, setHeadline] = useState('');
    const [description, setDescription] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [ctaType, setCtaType] = useState('LEARN_MORE');

    const canProceed = () => {
        switch (step) {
            case 1: return campaignName.trim().length > 0;
            case 2: return adSetName.trim().length > 0 && parseFloat(dailyBudget) > 0;
            case 3: return adName.trim().length > 0 && primaryText.trim().length > 0;
            case 4: return true;
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/meta/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: campaignName,
                    objective,
                    status: 'PAUSED',
                    special_ad_categories: specialAdCategory === 'NONE' ? [] : [specialAdCategory],
                }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Erro ao criar campanha');
            }

            const data = await res.json();
            router.push(`/campaigns/${data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Header title="Criar Campanha" />
            <div className="app-content" style={{ maxWidth: 800 }}>
                {/* Step Indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-8)',
                }}>
                    {stepLabels.map((label, i) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 'var(--radius-full)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 700,
                                background: step > i + 1 ? 'var(--accent-primary)' : step === i + 1 ? 'var(--accent-primary-muted)' : 'var(--bg-tertiary)',
                                color: step > i + 1 ? 'var(--text-inverse)' : step === i + 1 ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                                border: step === i + 1 ? '2px solid var(--accent-primary)' : '2px solid transparent',
                                transition: 'all var(--transition-base)',
                            }}>
                                {step > i + 1 ? <Check style={{ width: 14, height: 14 }} /> : i + 1}
                            </div>
                            <span style={{
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: step === i + 1 ? 600 : 400,
                                color: step === i + 1 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                            }}>
                                {label}
                            </span>
                            {i < 3 && (
                                <div style={{
                                    width: 40,
                                    height: 1,
                                    background: step > i + 1 ? 'var(--accent-primary)' : 'var(--border-default)',
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="error-state" style={{ marginBottom: 'var(--space-6)' }}>
                        <AlertCircle style={{ width: 16, height: 16 }} />
                        {error}
                    </div>
                )}

                {/* Step 1: Campaign */}
                {step === 1 && (
                    <div className="card">
                        <div className="section-title"><Target /> Configuração da Campanha</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Nome da Campanha *
                                </label>
                                <input
                                    type="text"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="Ex: Black Friday 2026 - Conversão"
                                    id="campaign-name-input"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Objetivo
                                </label>
                                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                                    {objectives.map((obj) => (
                                        <button
                                            key={obj.value}
                                            onClick={() => setObjective(obj.value)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                                padding: 'var(--space-3) var(--space-4)',
                                                background: objective === obj.value ? 'var(--accent-primary-muted)' : 'var(--bg-tertiary)',
                                                border: `1px solid ${objective === obj.value ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                textAlign: 'left',
                                                transition: 'all var(--transition-fast)',
                                            }}
                                        >
                                            <span style={{ fontWeight: 600, color: objective === obj.value ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                                                {obj.label}
                                            </span>
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)' }}>
                                                {obj.description}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Categoria Especial de Anúncio
                                </label>
                                <select
                                    value={specialAdCategory}
                                    onChange={(e) => setSpecialAdCategory(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <option value="NONE">Nenhuma</option>
                                    <option value="HOUSING">Habitação</option>
                                    <option value="EMPLOYMENT">Emprego</option>
                                    <option value="FINANCIAL_PRODUCTS_SERVICES">Produtos e Serviços Financeiros</option>
                                    <option value="ISSUES_ELECTIONS_POLITICS">Questões Sociais, Eleições ou Política</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Ad Set */}
                {step === 2 && (
                    <div className="card">
                        <div className="section-title"><Users /> Conjunto de Anúncios</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Nome do Conjunto *
                                </label>
                                <input
                                    type="text"
                                    value={adSetName}
                                    onChange={(e) => setAdSetName(e.target.value)}
                                    placeholder="Ex: 25-34 SP Interesses"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Orçamento Diário (R$)
                                </label>
                                <input
                                    type="number"
                                    value={dailyBudget}
                                    onChange={(e) => setDailyBudget(e.target.value)}
                                    min="1"
                                    step="1"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                        Idade Mínima
                                    </label>
                                    <input
                                        type="number"
                                        value={ageMin}
                                        onChange={(e) => setAgeMin(e.target.value)}
                                        min="13"
                                        max="65"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'var(--bg-tertiary)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                        Idade Máxima
                                    </label>
                                    <input
                                        type="number"
                                        value={ageMax}
                                        onChange={(e) => setAgeMax(e.target.value)}
                                        min="13"
                                        max="65"
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'var(--bg-tertiary)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Gênero
                                </label>
                                <select
                                    value={genders}
                                    onChange={(e) => setGenders(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <option value="0">Todos</option>
                                    <option value="1">Masculino</option>
                                    <option value="2">Feminino</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Países (código ISO)
                                </label>
                                <input
                                    type="text"
                                    value={locations}
                                    onChange={(e) => setLocations(e.target.value)}
                                    placeholder="BR, US, PT"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Otimização
                                </label>
                                <select
                                    value={optimizationGoal}
                                    onChange={(e) => setOptimizationGoal(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <option value="OFFSITE_CONVERSIONS">Conversões</option>
                                    <option value="LINK_CLICKS">Cliques no Link</option>
                                    <option value="IMPRESSIONS">Impressões</option>
                                    <option value="REACH">Alcance</option>
                                    <option value="LANDING_PAGE_VIEWS">Visualizações da Página</option>
                                    <option value="LEAD_GENERATION">Geração de Leads</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Ad */}
                {step === 3 && (
                    <div className="card">
                        <div className="section-title"><ImageIcon /> Anúncio</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Nome do Anúncio *
                                </label>
                                <input
                                    type="text"
                                    value={adName}
                                    onChange={(e) => setAdName(e.target.value)}
                                    placeholder="Ex: Video Depoimento 01"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Texto Principal *
                                </label>
                                <textarea
                                    value={primaryText}
                                    onChange={(e) => setPrimaryText(e.target.value)}
                                    placeholder="O texto que aparece acima do criativo..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Headline
                                </label>
                                <input
                                    type="text"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    placeholder="Título do anúncio"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descrição curta"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    URL do Site
                                </label>
                                <input
                                    type="url"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    placeholder="https://seusite.com.br"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                                    Call to Action
                                </label>
                                <select
                                    value={ctaType}
                                    onChange={(e) => setCtaType(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <option value="LEARN_MORE">Saiba Mais</option>
                                    <option value="SHOP_NOW">Comprar Agora</option>
                                    <option value="SIGN_UP">Cadastre-se</option>
                                    <option value="SUBSCRIBE">Assinar</option>
                                    <option value="CONTACT_US">Fale Conosco</option>
                                    <option value="GET_QUOTE">Solicitar Orçamento</option>
                                    <option value="DOWNLOAD">Baixar</option>
                                    <option value="SEND_WHATSAPP_MESSAGE">Enviar Mensagem no WhatsApp</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="card">
                        <div className="section-title"><Check /> Revisão Final</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                            <div style={{
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-4)',
                                border: '1px solid var(--border-subtle)',
                            }}>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                    Campanha
                                </div>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{campaignName}</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    Objetivo: {objectives.find(o => o.value === objective)?.label}
                                </div>
                            </div>

                            <div style={{
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-4)',
                                border: '1px solid var(--border-subtle)',
                            }}>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                    Conjunto de Anúncios
                                </div>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{adSetName}</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    Budget: R$ {dailyBudget}/dia · Idade: {ageMin}-{ageMax} · Países: {locations}
                                </div>
                            </div>

                            <div style={{
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-4)',
                                border: '1px solid var(--border-subtle)',
                            }}>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                    Anúncio
                                </div>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>{adName}</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                    {primaryText.substring(0, 100)}{primaryText.length > 100 ? '...' : ''}
                                </div>
                                {websiteUrl && (
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--accent-secondary)', marginTop: 4 }}>
                                        {websiteUrl}
                                    </div>
                                )}
                            </div>

                            <div style={{
                                background: 'var(--warning-muted)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-4)',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--warning)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                            }}>
                                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                                A campanha será criada com status <strong>&nbsp;PAUSADO&nbsp;</strong> por segurança. Ative-a manualmente quando estiver pronto.
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 'var(--space-6)',
                }}>
                    {step > 1 ? (
                        <button
                            className="btn btn-secondary"
                            onClick={() => setStep((step - 1) as Step)}
                        >
                            <ChevronLeft style={{ width: 16, height: 16 }} />
                            Voltar
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < 4 ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => setStep((step + 1) as Step)}
                            disabled={!canProceed()}
                            style={{ opacity: canProceed() ? 1 : 0.5 }}
                        >
                            Próximo
                            <ChevronRight style={{ width: 16, height: 16 }} />
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            style={{ minWidth: 180 }}
                        >
                            {isSubmitting ? (
                                <div className="spinner" style={{ width: 16, height: 16 }} />
                            ) : (
                                <>
                                    <Check style={{ width: 16, height: 16 }} />
                                    Criar Campanha
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
