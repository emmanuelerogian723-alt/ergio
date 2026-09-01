// ERGIO File Upload System — uses Supabase Storage
import { getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = getSupabase(req);
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://owcxfzlanlrulflsyvlr.supabase.co';
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.replace('/api/upload', '').replace(/^\//, '');
  const action = pathParts || 'list';

  try {
    if (req.method === 'GET' && action === 'list') {
      const businessId = url.searchParams.get('business_id');
      const bucket = businessId ? `business-${businessId}` : 'ergio-uploads';
      const { data, error } = await sb.storage.from(bucket).list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) return res.status(200).json({ files: [] });
      return res.status(200).json({ files: data || [] });
    }

    if (req.method === 'POST') {
      // File upload via multipart or base64
      const files = req.body?.files || (Array.isArray(req.body) ? req.body : []);
      if (!files.length) return res.status(400).json({ error: 'No files provided' });
      const uploaded = [];
      for (const f of files) {
        const fileName = `${Date.now()}-${f.name}`;
        const bucket = f.business_id ? `business-${f.business_id}` : 'ergio-uploads';
        const { data, error } = await sb.storage.from(bucket).upload(fileName, Buffer.from(f.data, 'base64'), {
          contentType: f.type || 'application/octet-stream', upsert: true
        });
        if (!error) uploaded.push({ name: f.name, url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}` });
      }
      return res.status(200).json({ success: true, files: uploaded });
    }

    if (req.method === 'DELETE') {
      const fileName = url.searchParams.get('file');
      const bucket = url.searchParams.get('bucket') || 'ergio-uploads';
      const { error } = await sb.storage.from(bucket).remove([fileName]);
      if (error) return res.status(200).json({ success: false, error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ files: [] });
  } catch (err) {
    return res.status(200).json({ files: [], error: err.message });
  }
}
