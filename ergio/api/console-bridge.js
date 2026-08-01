// ERGIO Console Bridge — list connected sites and receive site data
// GET: returns list of sites that have synced data
// POST: receives data from connected websites via the bridge script

const connectedSites = new Map();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const sites = Array.from(connectedSites.values()).sort((a, b) =>
      new Date(b.lastSeen) - new Date(a.lastSeen)
    );
    return res.status(200).json({ sites, total: sites.length, message: 'Connected sites from ERGIO Console bridge' });
  }

  if (req.method === 'POST') {
    try {
      const { siteUrl, siteName, page, event, metadata } = req.body || {};
      if (!siteUrl) return res.status(400).json({ error: 'siteUrl required' });

      const siteKey = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const existing = connectedSites.get(siteKey) || {};

      connectedSites.set(siteKey, {
        url: siteUrl,
        name: siteName || existing.name || siteKey,
        lastSeen: new Date().toISOString(),
        pagesVisited: existing.pagesVisited ? [...new Set([...existing.pagesVisited, page || '/'])] : [page || '/'],
        totalEvents: (existing.totalEvents || 0) + 1,
        lastEvent: event || 'visit',
        lastMetadata: metadata || existing.lastMetadata || {},
        firstSeen: existing.firstSeen || new Date().toISOString(),
        status: 'connected'
      });

      return res.status(200).json({
        success: true,
        message: 'Data received by ERGIO Console',
        site: siteName || siteUrl,
        event: event || 'visit',
        timestamp: new Date().toISOString(),
        consoleUrl: 'https://ergio.vercel.app/ergio/console/'
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to process site data' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
