'use client';

import { RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
    title: string;
    onRefresh?: () => void;
    isLoading?: boolean;
}

export default function Header({ title, onRefresh, isLoading = false }: HeaderProps) {
    const [lastUpdate, setLastUpdate] = useState<string>('');

    useEffect(() => {
        updateTime();
        const interval = setInterval(updateTime, 30000);
        return () => clearInterval(interval);
    }, []);

    function updateTime() {
        setLastUpdate(
            new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
            })
        );
    }

    return (
        <header className="header" id="header">
            <h1 className="header-title">{title}</h1>
            <div className="header-actions">
                <div className="header-status">
                    <span className="header-status-dot" />
                    API Conectada
                </div>
                {lastUpdate && (
                    <div className="header-status">
                        Atualizado às {lastUpdate}
                    </div>
                )}
                {onRefresh && (
                    <button
                        className="btn btn-secondary btn-icon"
                        onClick={onRefresh}
                        disabled={isLoading}
                        title="Atualizar dados"
                        id="refresh-btn"
                    >
                        <RefreshCw
                            style={{
                                animation: isLoading ? 'spin 1s linear infinite' : 'none',
                            }}
                        />
                    </button>
                )}
            </div>
        </header>
    );
}
