// ========================================
// ERGIO File Upload System
// Robust upload supporting images, documents, brand assets
// Uses Supabase Storage for persistence
// ========================================

const supabase = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const sb = supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.replace('/api/upload', '').replace(/^\//, '');
    const action = pathParts || 'list';

    // ---- LIST FILES ----
    if (req.method === 'GET' && action === 'list') {
      const businessId = url.searchParams.get('business_id');
      const bucket = businessId ? `business-${businessId}` : 'ergio-uploads';

      const { data, error } = await sb.storage
        .from(bucket)
        .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (error && error.message !== 'The resource was not found') {
        return res.status(500).json({ error: error.message });
      }

      const files = (data || []).map(f => ({
        name: f.name,
        size: f.metadata?.size || 0,
        type: f.metadata?.mimetype || 'unknown',
        created: f.created_at,
        url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${f.name}`
      }));

      return res.status(200).json({ files });
    }

    // ---- UPLOAD FILE ----
    if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || '';

      // Parse the body
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks);

      const businessId = url.searchParams.get('business_id') || 'general';
      const fileType = url.searchParams.get('type') || 'asset'; // logo, photo, document, brand
      const customName = url.searchParams.get('name');

      // Determine file extension and type
      let ext = 'bin';
      let mimeType = 'application/octet-stream';

      if (contentType.startsWith('image/')) {
        ext = contentType.split('/')[1]?.split(';')[0] || 'png';
        mimeType = contentType;
      } else if (contentType.includes('pdf')) {
        ext = 'pdf';
        mimeType = 'application/pdf';
      } else if (contentType.includes('json')) {
        ext = 'json';
        mimeType = 'application/json';
      } else if (contentType.includes('text')) {
        ext = 'txt';
        mimeType = 'text/plain';
      } else if (contentType.includes('spreadsheet') || contentType.includes('csv')) {
        ext = contentType.includes('csv') ? 'csv' : 'xlsx';
        mimeType = contentType;
      }

      // Generate filename
      const timestamp = Date.now();
      const fileName = customName
        ? `${customName}.${ext}`
        : `${fileType}_${timestamp}.${ext}`;
      const bucket = `business-${businessId}`;

      // Try to create bucket if it doesn't exist
      try {
        await sb.storage.createBucket(bucket, { public: true });
      } catch (e) {
        // Bucket might already exist, that's fine
      }

      // Upload to Supabase Storage
      const { data, error } = await sb.storage
        .from(bucket)
        .upload(fileName, body, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${fileName}`;

      return res.status(200).json({
        success: true,
        file: {
          name: fileName,
          url: publicUrl,
          type: mimeType,
          size: body.length,
          bucket
        }
      });
    }

    // ---- DELETE FILE ----
    if (req.method === 'DELETE') {
      const fileName = url.searchParams.get('file');
      const businessId = url.searchParams.get('business_id') || 'general';
      const bucket = `business-${businessId}`;

      if (!fileName) {
        return res.status(400).json({ error: 'File name required' });
      }

      const { error } = await sb.storage.from(bucket).remove([fileName]);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
};
