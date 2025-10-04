import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] ,display: "swap",});

export const metadata: Metadata = {
  title: 'Smart Grading System',
  description: 'AI-powered automated grading and analytics platform for educators',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}