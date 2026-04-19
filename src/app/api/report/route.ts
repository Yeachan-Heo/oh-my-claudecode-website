import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { reportSchema } from '@/lib/report-schema';

export const runtime = 'nodejs';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Lazy-initialised Upstash-backed rate limiters. Kept out of module
// top-level so builds without KV env vars don't crash at import time.
let cachedLimiters: { report: Ratelimit; vote: Ratelimit } | null = null;
function getLimiters(): { report: Ratelimit; vote: Ratelimit } | null {
  if (cachedLimiters) return cachedLimiters;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  cachedLimiters = {
    report: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      prefix: 'rl:report',
      analytics: false,
    }),
    vote: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      prefix: 'rl:vote',
      analytics: false,
    }),
  };
  return cachedLimiters;
}

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  action?: string;
  hostname?: string;
}

async function verifyTurnstile(
  token: string,
  ip: string | null,
): Promise<{ ok: boolean; replay: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY as string;
  const form = new URLSearchParams();
  form.set('secret', secret);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) return { ok: false, replay: false };
  const json = (await res.json()) as TurnstileResponse;
  const codes = json['error-codes'] ?? [];
  return {
    ok: json.success === true,
    replay: codes.includes('timeout-or-duplicate'),
  };
}

// Defuse user-supplied markdown so issue bodies can't fire @mentions or
// impersonate the trusted metadata footer. Inserts a zero-width space
// between @ and the handle so visible text is preserved.
function sanitizeIssueBody(raw: string): string {
  const noMentions = raw.replace(/@([a-zA-Z0-9-]+)/g, '@\u200B$1');
  return [
    '<!-- user-content-start -->',
    noMentions,
    '<!-- user-content-end -->',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error('Missing TURNSTILE_SECRET_KEY');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid payload',
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          code: i.code,
        })),
      },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';

  const limiters = getLimiters();
  if (limiters) {
    const bucket = body.kind === 'vote' ? limiters.vote : limiters.report;
    const { success, reset } = await bucket.limit(ip);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }
  }

  const verify = await verifyTurnstile(
    body.turnstileToken,
    ip === 'unknown' ? null : ip,
  );
  if (!verify.ok || verify.replay) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 403 },
    );
  }

  if (body.kind === 'vote') {
    console.log(
      JSON.stringify({
        type: 'vote',
        ts: new Date().toISOString(),
        path: body.path,
        locale: body.locale,
        value: body.value,
      }),
    );
    return NextResponse.json({ ok: true });
  }

  const token = process.env.GITHUB_REPORT_TOKEN;
  const owner = process.env.GITHUB_REPORT_REPO_OWNER;
  const repo = process.env.GITHUB_REPORT_REPO_NAME;
  if (!token || !owner || !repo) {
    console.error('Missing GitHub env vars');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const octokit = new Octokit({ auth: token });
  try {
    const issue = await octokit.rest.issues.create({
      owner,
      repo,
      title: body.title,
      body: [
        sanitizeIssueBody(body.body),
        '',
        '---',
        `- Page: ${body.path ?? '(none)'}`,
        `- Locale: ${body.locale}`,
        '- Submitted via: omc.vibetip.help',
      ].join('\n'),
      labels: [`kind/${body.category}`, 'via/web'],
    });
    return NextResponse.json({ ok: true, url: issue.data.html_url });
  } catch (e) {
    console.error('GitHub issue create failed', e);
    return NextResponse.json(
      { error: 'Could not file issue' },
      { status: 503 },
    );
  }
}
