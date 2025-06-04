import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Settings - Burrito Rater',
  description: 'Admin settings and controls for Burrito Rater',
};

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 