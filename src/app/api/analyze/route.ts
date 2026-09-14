// The main UI sends uploads directly to the configured FastAPI backend.
// This former mock endpoint must not return sample data as successful inference.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function POST() {
  return Response.json(
    { error: 'This analysis endpoint is retired. Use the configured FastAPI /analyze endpoint.' },
    { status: 410 },
  );
}
