import 'fumadocs-ui/style.css';
import './global.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Oh My ClaudeCode — Docs',
  description:
    'Official documentation for oh-my-claudecode, a multi-agent orchestration layer for Claude Code.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
