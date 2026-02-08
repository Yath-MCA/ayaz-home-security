export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const baseUrl = (process.env.RENDER_BACKEND_URL || '').replace(/\/$/, '');
  const adminToken = process.env.ADMIN_TOKEN || '';

  if (!baseUrl) {
    res.status(500).json({ error: 'RENDER_BACKEND_URL is not set' });
    return;
  }
  if (!adminToken) {
    res.status(500).json({ error: 'ADMIN_TOKEN is not set' });
    return;
  }

  const { active } = req.body || {};
  if (typeof active !== 'boolean') {
    res.status(400).json({ error: 'Body must be { active: boolean }' });
    return;
  }

  try {
    const r = await fetch(`${baseUrl}/admin/active`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ active }),
    });
    const text = await r.text();
    res.status(r.status).setHeader('content-type', r.headers.get('content-type') || 'application/json').send(text);
  } catch (e) {
    res.status(502).json({ error: 'Failed to reach backend', detail: e?.message || String(e) });
  }
}
