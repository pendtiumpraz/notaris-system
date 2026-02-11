import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import ChatbotWidget from '@/components/chatbot-widget';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Client Portal Notaris',
  description: 'Portal klien untuk layanan notaris',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
            <ChatbotWidget />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  color: '#e2e8f0',
                },
              }}
              richColors
              closeButton
            />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
