import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const geist = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: 'PulsePro - Employee Engagement Platform',
  description: 'Pulse survey and employee engagement platform for SMEs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
