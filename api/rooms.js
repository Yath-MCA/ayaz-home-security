export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const baseUrl = (process.env.RENDER_BACKEND_URL || '').replace(/\/$/, '');
  if (!baseUrl) {
    res.status(500).json({ error: 'RENDER_BACKEND_URL is not set' });
    return;
  }

  try {
    const r = await fetch(`${baseUrl}/rooms`, { method: 'GET' });
    const text = await r.text();
    res.status(r.status).setHeader('content-type', r.headers.get('content-type') || 'application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'Failed to reach backend', detail: e?.message || String(e) });
  }
}
