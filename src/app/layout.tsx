import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayoutWrapper from '../components/MainLayoutWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MamaFarm | Organic Sprouts Business Tracker',
  description: 'Manage sprouts purchases, sales dispatches, shop ledgers, and operational metrics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        <MainLayoutWrapper>{children}</MainLayoutWrapper>
      </body>
    </html>
  );
}
