// ERGIO Invoice Generator
import { getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = getSupabase(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action') || (req.method === 'GET' ? 'list' : 'create');
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const businessId = url.searchParams.get('business_id') || body.business_id;

  try {
    if (action === 'list') {
      const { data, error } = await sb.from('invoices').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) return res.status(200).json({ invoices: [] });
      return res.status(200).json({ invoices: data || [] });
    }

    if (action === 'get') {
      const id = url.searchParams.get('id');
      const { data, error } = await sb.from('invoices').select('*').eq('id', id).single();
      if (error) return res.status(200).json({ invoice: null });
      return res.status(200).json({ invoice: data });
    }

    if (action === 'create') {
      const { client_name, client_email, items, due_date, notes } = body;
      if (!client_name || !items) return res.status(400).json({ error: 'Client name and items required' });
      const invoiceNumber = 'INV-' + Date.now().toString(36).toUpperCase();
      const total = (items || []).reduce((s, item) => s + (parseFloat(item.amount) || 0), 0);
      const { data, error } = await sb.from('invoices').insert({
        business_id: businessId, invoice_number: invoiceNumber,
        client_name, client_email: client_email || '',
        items: JSON.stringify(items), total, due_date: due_date || null,
        notes: notes || '', status: 'pending'
      }).select();
      if (error) return res.status(200).json({ success: false, error: error.message });
      return res.status(200).json({ success: true, invoice: data?.[0] });
    }

    return res.status(200).json({ invoices: [] });
  } catch (err) {
    return res.status(200).json({ invoices: [], error: err.message });
  }
}
