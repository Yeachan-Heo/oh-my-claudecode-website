import { z } from 'zod';

// Docs page paths like "/docs/getting-started" or "/ko/docs/agents/executor".
// Enforces the shape so user-controlled path can't contain markdown or URLs.
const pathShape = z
  .string()
  .min(1)
  .max(500)
  .regex(/^\/[\w\-./]*$/, {
    message: 'path must start with / and use [A-Za-z0-9_./-] only',
  });

export const reportSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('vote'),
    path: pathShape,
    locale: z.string().min(2).max(5),
    value: z.enum(['up', 'down']),
    turnstileToken: z.string().min(1),
  }),
  z.object({
    kind: z.literal('report'),
    category: z.enum(['bug', 'question', 'suggestion']),
    title: z.string().min(10).max(120),
    body: z.string().min(20).max(8000),
    path: pathShape.optional(),
    locale: z.string().min(2).max(5),
    turnstileToken: z.string().min(1),
  }),
]);

export type ReportBody = z.infer<typeof reportSchema>;
