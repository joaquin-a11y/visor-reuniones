export default async function handler(req, res) {
  try {
    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const siteId = process.env.SITE_ID;
    const listId = process.env.LIST_ID;

    if (!tenantId || !clientId || !clientSecret || !siteId || !listId) {
      return res.status(500).json({ error: 'Faltan variables de entorno' });
    }

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(500).json({ error: 'No se pudo obtener token', details: tokenJson });
    }

    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?$expand=fields($select=Title,Sala,HoraInicio,HoraFin,Organizador)`,
      { headers: { Authorization: `Bearer ${tokenJson.access_token}` } }
    );

    const graphJson = await graphRes.json();
    if (!graphRes.ok) {
      return res.status(500).json({ error: 'Error en Graph', details: graphJson });
    }

    const items = graphJson.value || [];
    const map = {};

    for (const item of items) {
      const f = item.fields || {};
      const room = f.Sala || 'Sin sala';
      if (!map[room]) map[room] = [];

      map[room].push({
        title: f.Title || '',
        organizer: f.Organizador || '',
        start: f.HoraInicio || '',
        end: f.HoraFin || ''
      });
    }

    const rooms = Object.keys(map).sort().map(name => ({ name, events: map[name] }));
    return res.status(200).json({ rooms });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
