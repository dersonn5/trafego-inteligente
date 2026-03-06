'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Megaphone,
    PlusCircle,
    BarChart3,
    Settings,
    Zap,
    Sparkles,
} from 'lucide-react';

const navItems = [
    {
        section: 'Principal',
        links: [
            { href: '/', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/campaigns', label: 'Campanhas', icon: Megaphone },
            { href: '/campaigns/create', label: 'Criar Campanha', icon: PlusCircle },
        ],
    },
    {
        section: 'Análise',
        links: [
            { href: '/insights', label: 'Insights', icon: BarChart3 },
        ],
    },
    {
        section: 'Sistema',
        links: [
            { href: '/integrations', label: 'Integrações', icon: Zap },
            { href: '/settings', label: 'Configurações', icon: Settings },
        ],
    },
];

interface SidebarProps {
    accountName?: string;
    accountId?: string;
}

export default function Sidebar({ accountName = 'Conta Meta', accountId = '' }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">T</div>
                <span className="sidebar-logo-text">Tráfego Inteligente</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div key={section.section} className="sidebar-section">
                        <div className="sidebar-section-title">{section.section}</div>
                        {section.links.map((link) => {
                            const isActive =
                                link.href === '/'
                                    ? pathname === '/'
                                    : pathname.startsWith(link.href);
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                                    id={`nav-${link.href.replace(/\//g, '-').replace(/^-/, '')}`}
                                >
                                    <Icon />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-account">
                    <div className="sidebar-account-avatar">
                        {accountName.charAt(0).toUpperCase()}
                    </div>
                    <div className="sidebar-account-info">
                        <div className="sidebar-account-name">{accountName}</div>
                        {accountId && (
                            <div className="sidebar-account-id">{accountId}</div>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
}
