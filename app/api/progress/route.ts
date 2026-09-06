import { BlobPreconditionFailedError, get, put } from '@vercel/blob';

import {
  emptyProgress,
  mergeProgress,
  normalizeProgress,
  type ProgressState,
} from '@/lib/progress';

export const runtime = 'nodejs';

type ProgressRecord = {
  progress: ProgressState;
  revision: number;
  generation: number;
  updatedAt: string;
};

type StoredRecord = {
  record: ProgressRecord;
  etag: string;
};

const responseHeaders = {
  'Cache-Control': 'no-store, max-age=0',
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: responseHeaders });
}

function validKey(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
}

async function pathnameFor(key: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(key),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return `progress/${hash}.json`;
}

function normalizeRecord(value: unknown): ProgressRecord | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ProgressRecord>;
  const progress = normalizeProgress(candidate.progress);
  if (
    !progress ||
    !Number.isInteger(candidate.revision) ||
    candidate.revision! < 0 ||
    !Number.isInteger(candidate.generation) ||
    candidate.generation! < 0
  ) {
    return null;
  }
  return {
    progress,
    revision: candidate.revision!,
    generation: candidate.generation!,
    updatedAt:
      typeof candidate.updatedAt === 'string'
        ? candidate.updatedAt
        : new Date(0).toISOString(),
  };
}

async function readRecord(pathname: string): Promise<StoredRecord | null> {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;

  const record = normalizeRecord(await new Response(result.stream).json());
  if (!record) throw new Error('Stored progress is invalid');
  return { record, etag: result.blob.etag };
}

async function writeRecord(
  pathname: string,
  record: ProgressRecord,
  etag?: string,
) {
  await put(pathname, JSON.stringify(record), {
    access: 'private',
    allowOverwrite: Boolean(etag),
    cacheControlMaxAge: 60,
    contentType: 'application/json',
    ifMatch: etag,
  });
}

async function mutateRecord(
  pathname: string,
  mutate: (current: ProgressRecord | null) => ProgressRecord | null,
) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const stored = await readRecord(pathname);
    const next = mutate(stored?.record ?? null);
    if (!next) return stored?.record ?? null;

    try {
      await writeRecord(pathname, next, stored?.etag);
      return next;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError && attempt < 3) continue;
      throw error;
    }
  }
  throw new Error('Could not save progress after retrying');
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 12_000) return json({ error: 'Request too large' }, 413);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!validKey(body.key)) return json({ error: 'Invalid resume key' }, 400);

    const pathname = await pathnameFor(body.key);

    if (body.action === 'load') {
      const stored = await readRecord(pathname);
      return json(
        stored
          ? { found: true, ...stored.record }
          : {
              found: false,
              progress: null,
              revision: 0,
              generation: 0,
              updatedAt: null,
            },
      );
    }

    if (body.action === 'save') {
      const progress = normalizeProgress(body.progress);
      const generation = Number(body.generation);
      if (!progress || !Number.isInteger(generation) || generation < 0)
        return json({ error: 'Invalid progress' }, 400);

      const saved = await mutateRecord(pathname, (current) => {
        if (current && generation < current.generation) return null;
        if (current && generation > current.generation) return null;

        return {
          progress: current
            ? mergeProgress(current.progress, progress)
            : progress,
          revision: (current?.revision ?? 0) + 1,
          generation,
          updatedAt: new Date().toISOString(),
        };
      });

      return json({ found: Boolean(saved), ...saved });
    }

    if (body.action === 'reset') {
      const saved = await mutateRecord(pathname, (current) => ({
        progress: emptyProgress,
        revision: (current?.revision ?? 0) + 1,
        generation: (current?.generation ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      }));
      return json({ found: true, ...saved });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (error) {
    console.error('Progress sync failed', error);
    return json({ error: 'Progress sync is temporarily unavailable' }, 503);
  }
}
