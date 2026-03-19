'use client';

import { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

export function Mermaid({ chart }: { chart: string }) {
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState('');
  const reactId = useId();

  useEffect(() => {
    const isDark = resolvedTheme === 'dark';
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      look: 'handDrawn',
      fontFamily: 'inherit',
      securityLevel: 'strict',
    });

    const id = `mermaid-${reactId.replace(/:/g, '')}`;
    mermaid.render(id, chart.trim()).then(({ svg }) => {
      setSvg(DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } }));
    });
  }, [chart, resolvedTheme, reactId]);

  return (
    <div
      className="my-6 flex justify-center [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
