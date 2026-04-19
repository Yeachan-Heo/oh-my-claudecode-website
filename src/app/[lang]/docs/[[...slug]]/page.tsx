import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import { source } from '@/lib/source';
import { i18n } from '@/lib/i18n';
import { findNeighbour } from 'fumadocs-core/page-tree';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Mermaid } from '@/components/mermaid';
import { ReportForm } from '@/components/report-form';

export default async function Page(props: {
  params: Promise<{ slug?: string[]; lang: string }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug, params.lang);
  if (!page) notFound();

  const MDXContent = page.data.body;

  const langPrefix =
    params.lang === i18n.defaultLanguage ? '' : `/${params.lang}`;

  const navNames: Record<string, Record<string, string>> = {
    en: {
      docs: 'Docs',
      gettingStarted: 'Getting Started',
      concepts: 'Core Concepts',
      guides: 'Guides',
      agents: 'Agents',
    },
    ko: {
      docs: '문서',
      gettingStarted: '시작하기',
      concepts: '주요 개념',
      guides: '가이드',
      agents: '에이전트',
    },
    zh: {
      docs: '文档',
      gettingStarted: '快速开始',
      concepts: '核心概念',
      guides: '指南',
      agents: '智能体',
    },
    ja: {
      docs: 'ドキュメント',
      gettingStarted: 'クイックスタート',
      concepts: 'コアコンセプト',
      guides: 'ガイド',
      agents: 'エージェント',
    },
  };
  const n = navNames[params.lang] ?? navNames.en;

  const anchorPageNav: Record<
    string,
    {
      previous?: { name: string; url: string };
      next?: { name: string; url: string };
    }
  > = {
    'getting-started': {
      previous: { name: n.docs, url: `${langPrefix}/docs` },
      next: { name: n.concepts, url: `${langPrefix}/docs/concepts` },
    },
    concepts: {
      previous: {
        name: n.gettingStarted,
        url: `${langPrefix}/docs/getting-started`,
      },
      next: { name: n.guides, url: `${langPrefix}/docs/guides` },
    },
    guides: {
      previous: { name: n.concepts, url: `${langPrefix}/docs/concepts` },
      next: { name: n.agents, url: `${langPrefix}/docs/agents` },
    },
  };
  const slugKey = params.slug?.length === 1 ? params.slug[0] : null;
  const customNav = slugKey ? anchorPageNav[slugKey] : null;

  const tree = source.getPageTree(params.lang);
  const autoNav = findNeighbour(tree, page.url);
  const footerItems = customNav ?? autoNav;

  return (
    <DocsPage
      toc={page.data.toc}
      breadcrumb={{ enabled: true, includeRoot: true, includePage: true }}
      footer={{ items: footerItems }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={{
            ...defaultMdxComponents,
            Steps,
            Step,
            Tab,
            Tabs,
            Mermaid,
            ReportForm,
          }}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[]; lang: string }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug, params.lang);
  if (!page) notFound();

  return {
    title: `${page.data.title} — OMC Docs`,
    description: page.data.description,
  };
}
