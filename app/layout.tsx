import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "R8R Platform - Community Rating Platform",
  description: 'Create and discover community-driven rating sites for any category',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
