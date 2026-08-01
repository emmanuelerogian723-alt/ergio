// ERGIO Console Bridge API — receives site data from connected websites
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://owcxfzlanlrulflsyvlr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { siteId, businessName, url, title, description, pages, metaTags, stats, timestamp } = req.body;

    // Store in Supabase if available
    if (supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('connected_sites').upsert({
        site_id: siteId,
        business_name: businessName,
        url,
        title,
        description,
        pages: pages || [],
        meta_tags: metaTags || {},
        stats: stats || {},
        last_sync: timestamp,
        status: 'connected',
        updated_at: new Date().toISOString()
      }, { onConflict: 'site_id' });
    }

    // Return console connection info
    res.status(200).json({
      status: 'connected',
      siteId,
      consoleUrl: `https://ergio.vercel.app/ergio/console/?site=${siteId}`,
      message: `Site connected to ERGIO Console`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Console bridge error:', error);
    res.status(200).json({ status: 'connected', siteId: req.body?.siteId || 'unknown', error: 'sync_failed' });
  }
}
