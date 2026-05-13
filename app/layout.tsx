import type { Metadata } from 'next';
import './globals.css';
import SecurityProvider from './components/SecurityProvider';
import { NotificationProvider } from './components/NotificationProvider';

export const metadata: Metadata = {
  title: 'SocioCipher',
  description: 'Pseudonymous, ephemeral social discussion.',
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <NotificationProvider>
          <SecurityProvider>
            {children}
          </SecurityProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
