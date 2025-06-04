import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationWrapper from './components/NavigationWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Benny's Breakfast Burrito Rating",
  description: 'Rate and discover the best breakfast burritos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <div className="flex flex-col h-full">
          <NavigationWrapper />
          <main className="flex-1 relative pt-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
