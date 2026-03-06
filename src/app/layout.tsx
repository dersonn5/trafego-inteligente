import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Tráfego Inteligente — Meta Ads Dashboard',
  description: 'Dashboard inteligente para gerenciamento e automação de campanhas Meta Ads',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-layout">
          <Sidebar
            accountName="Anderson Pereira"
            accountId="act_391748118054937"
          />
          <main className="app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
