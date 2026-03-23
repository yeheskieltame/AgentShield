import type { Metadata } from 'next';
import './globals.css';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import WelcomeToast from '../components/WelcomeToast';

export const metadata: Metadata = {
  title: 'AgentShield Dashboard',
  description: 'DeFi Circuit Breaker Protocol - Real-time Monitoring',
  icons: {
    icon: '/agentshield-icon-filled-32px.png',
    apple: '/agentshield-icon-filled-128px.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen pt-20 pb-20 md:pt-28 md:pb-8 md:pl-20">
        <Navigation />
        <Header />
        <main className="max-w-7xl mx-auto px-4">
          {children}
        </main>
        <WelcomeToast />
        <ChatBubble />
      </body>
    </html>
  );
}
