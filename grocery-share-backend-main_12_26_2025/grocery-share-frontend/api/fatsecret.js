let cachedToken = null;

async function getToken(clientId, clientSecret) {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=barcode',
  });

  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.access_token || !data.expires_in) {
    throw new Error('Invalid token response');
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export default async function handler(req, res) {
  const barcode = req.query.barcode || req.url?.split('/barcode/')[1]?.split('?')[0];

  if (!barcode) {
    return res.status(400).json({ error: 'Barcode parameter required' });
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'FatSecret credentials not configured' });
  }

  try {
    const token = await getToken(clientId, clientSecret);
    const gtin = barcode.padStart(13, '0');

    const apiRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=food.find_id_for_barcode.v2&barcode=${gtin}&format=json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!apiRes.ok) {
      cachedToken = null;
      return res.status(apiRes.status).json({ error: `FatSecret API error: ${apiRes.status}` });
    }

    const data = await apiRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'FatSecret lookup failed' });
  }
}
