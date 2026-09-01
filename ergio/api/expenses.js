// ERGIO Expense Tracker
import { getSupabase } from '../lib/ergio.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = getSupabase(req);
  const action = req.query.action || 'list';
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const businessId = req.query.business_id || body.business_id;

  try {
    if (req.method === 'GET' && action === 'list') {
      const { data, error } = await sb.from('transactions').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) return res.status(200).json({ expenses: [], income: 0, total_expenses: 0 });
      const expenses = (data || []).filter(t => t.type === 'expense');
      const income = (data || []).filter(t => t.type === 'income');
      const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      const totalIncome = income.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
      return res.status(200).json({ transactions: data || [], expenses, income: totalIncome, total_expenses: totalExpenses });
    }

    if (req.method === 'POST') {
      const { type, amount, category, description, date } = body;
      if (!type || !amount) return res.status(400).json({ error: 'Type and amount required' });
      const { data, error } = await sb.from('transactions').insert({
        business_id: businessId, type, amount: parseFloat(amount),
        category: category || 'general', description: description || '', date: date || new Date().toISOString()
      }).select();
      if (error) return res.status(200).json({ success: false, error: error.message });
      return res.status(200).json({ success: true, transaction: data?.[0] });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await sb.from('transactions').delete().eq('id', id);
      if (error) return res.status(200).json({ success: false, error: error.message });
      return res.status(200).json({ success: true });
    }

    return res.status(200).json({ transactions: [], expenses: [], income: 0, total_expenses: 0 });
  } catch (err) {
    return res.status(200).json({ transactions: [], expenses: [], income: 0, total_expenses: 0, error: err.message });
  }
}
