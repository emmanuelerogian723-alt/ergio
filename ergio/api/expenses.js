// ========================================
// ERGIO Expense Tracker
// Track business income & expenses with categories
// ========================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
    const action = req.query.action || 'list';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const businessId = req.query.business_id || body.business_id;

    if (req.method === 'GET' && action === 'list') {
      let query = sb.from('transactions').select('*').order('created_at', { ascending: false }).limit(100);
      if (businessId) query = query.eq('business_id', businessId);
      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      const income = (data || []).filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      const expenses = (data || []).filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

      return res.status(200).json({
        transactions: data || [],
        summary: { income, expenses, profit: income - expenses, count: (data || []).length }
      });
    }

    if (req.method === 'POST' && action === 'create') {
      const { type, amount, category, description, date } = body;
      if (!type || !amount) return res.status(400).json({ error: 'Type and amount required' });

      const { data, error } = await sb.from('transactions').insert({
        business_id: businessId, type, amount: parseFloat(amount),
        category: category || 'general', description: description || '',
        date: date || new Date().toISOString().split('T')[0]
      }).select();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, transaction: data?.[0] });
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'ID required' });
      const { error } = await sb.from('transactions').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Expense error:', err);
    return res.status(500).json({ error: err.message });
  }
}
