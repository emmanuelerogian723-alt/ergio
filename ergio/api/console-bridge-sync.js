// ERGIO Console Bridge Sync — receives site data from connected websites
// Sites embed the ERGIO Console bridge script which syncs visits, events, and metadata

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { siteUrl, siteName, page, event, metadata } = req.body || {};
    
    if (!siteUrl) {
      return res.status(400).json({ error: 'siteUrl required' });
    }

    console.log(`[Console Bridge] ${siteName || siteUrl} -> ${event || 'visit'} on ${page || '/'}`);
    
    return res.status(200).json({
      success: true,
      message: 'Data received by ERGIO Console',
      site: siteName || siteUrl,
      event: event || 'visit',
      timestamp: new Date().toISOString(),
      consoleUrl: 'https://ergio.vercel.app/ergio/console/',
      received: {
        page: page || '/',
        metadata: metadata || {},
      }
    });
  } catch (error) {
    console.error('[Console Bridge] Error:', error);
    return res.status(500).json({ error: 'Failed to process site data' });
  }
}
