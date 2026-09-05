// ========================================
// ERGIO CRM API — Contacts, Deal Pipeline, Unified Timeline
// Contacts  → public.clients
// Deals     → public.transactions (type='deal', category=stage, description=JSON meta)
// Timeline  → union of leads, bookings, invoices, payments + client notes
// ========================================
import { getSupabase } from '../lib/ergio.js';

const STAGES = ['lead', 'contacted', 'quoted', 'won', 'lost'];

function parseDeal(row) {
  let meta = {};
  try { meta = JSON.parse(row.description || '{}') || {}; } catch (e) { meta = {}; }
  return {
    id: row.id,
    title: meta.title || meta.name || 'Untitled deal',
    amount: parseFloat(row.amount || 0),
    stage: STAGES.includes(row.category) ? row.category : 'lead',
    contact_id: meta.contact_id || null,
    contact_name: meta.contact_name || '',
    email: meta.email || '',
    phone: meta.phone || '',
    notes: meta.notes || '',
    expected_close: row.date || null,
    created_at: row.created_at
  };
}

function dealRow(d, businessId) {
  const row = {
    type: 'deal',
    amount: parseFloat(d.amount || 0),
    category: STAGES.includes(d.stage) ? d.stage : 'lead',
    description: JSON.stringify({
      title: d.title || d.name || 'Untitled deal',
      contact_id: d.contact_id || null,
      contact_name: d.contact_name || '',
      email: d.email || '',
      phone: d.phone || '',
      notes: d.notes || ''
    }),
    date: d.expected_close || null
  };
  if (businessId) row.business_id = businessId;
  return row;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = getSupabase(req);
  if (!sb) return res.status(500).json({ error: 'Database not configured' });
  const action = req.query.action || 'summary';
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const businessId = req.query.business_id || body.business_id || null;

  try {
    // ── SUMMARY ──
    if (req.method === 'GET' && action === 'summary') {
      const [clientsRes, dealsRes] = await Promise.all([
        sb.from('clients').select('id, total_spent, total_bookings').limit(500),
        sb.from('transactions').select('*').eq('type', 'deal').limit(500)
      ]);
      const deals = (dealsRes.data || []).map(parseDeal);
      const open = deals.filter(d => !['won', 'lost'].includes(d.stage));
      const won = deals.filter(d => d.stage === 'won');
      const lost = deals.filter(d => d.stage === 'lost');
      return res.status(200).json({
        contacts: (clientsRes.data || []).length,
        lifetime_value: (clientsRes.data || []).reduce((s, c) => s + (parseFloat(c.total_spent) || 0), 0),
        open_deals: open.length,
        pipeline_value: open.reduce((s, d) => s + d.amount, 0),
        won_deals: won.length,
        won_value: won.reduce((s, d) => s + d.amount, 0),
        lost_deals: lost.length,
        conversion: (open.length + won.length + lost.length) > 0
          ? Math.round((won.length / (open.length + won.length + lost.length)) * 100) : 0
      });
    }

    // ── CONTACTS ──
    if (req.method === 'GET' && action === 'contacts') {
      let q = sb.from('clients').select('*').order('created_at', { ascending: false }).limit(200);
      const { data, error } = await q;
      if (error) return res.status(200).json({ contacts: [] });
      return res.status(200).json({ contacts: data || [] });
    }

    // ── DEALS ──
    if (req.method === 'GET' && action === 'deals') {
      const { data, error } = await sb.from('transactions').select('*').eq('type', 'deal').order('created_at', { ascending: false }).limit(300);
      if (error) return res.status(200).json({ deals: [] });
      return res.status(200).json({ deals: (data || []).map(parseDeal) });
    }

    // ── TIMELINE ──
    if (req.method === 'GET' && action === 'timeline') {
      const email = (req.query.email || '').toLowerCase().trim();
      const phone = (req.query.phone || '').trim();
      if (!email && !phone) return res.status(400).json({ error: 'email or phone required' });
      const events = [];

      const jobs = [];
      if (email) {
        jobs.push(sb.from('leads').select('name, email, phone, message, intent, score, status, created_at')
          .ilike('email', `%${email}%`).order('created_at', { ascending: false }).limit(10)
          .then(r => (r.data || []).forEach(l => events.push({ type: 'lead', title: 'Lead captured — score ' + (l.score || '?'), detail: l.message || l.intent || '', at: l.created_at }))).catch(() => {}));
        jobs.push(sb.from('bookings').select('client_name, client_email, booking_date, booking_time, status, price, payment_status, created_at')
          .ilike('client_email', `%${email}%`).order('created_at', { ascending: false }).limit(20)
          .then(r => (r.data || []).forEach(b => events.push({ type: 'booking', title: 'Booking ' + (b.booking_date || '') + ' ' + (b.booking_time || '') + ' — ' + (b.status || 'pending'), detail: '₦' + (b.price || 0) + ' · payment: ' + (b.payment_status || 'unpaid'), at: b.created_at }))).catch(() => {}));
        jobs.push(sb.from('invoices').select('invoice_number, client_name, client_email, total_amount, due_date, status, created_at')
          .ilike('client_email', `%${email}%`).order('created_at', { ascending: false }).limit(20)
          .then(r => (r.data || []).forEach(i => events.push({ type: 'invoice', title: 'Invoice ' + (i.invoice_number || '') + ' — ₦' + (i.total_amount || 0), detail: 'status: ' + (i.status || 'pending') + (i.due_date ? ' · due ' + i.due_date : ''), at: i.created_at }))).catch(() => {}));
        jobs.push(sb.from('payments').select('amount, currency, status, customer_email, paid_at, created_at')
          .ilike('customer_email', `%${email}%`).order('created_at', { ascending: false }).limit(20)
          .then(r => (r.data || []).forEach(p => events.push({ type: 'payment', title: 'Payment ₦' + (p.amount || 0) + ' — ' + (p.status || ''), detail: p.paid_at ? 'paid ' + p.paid_at : '', at: p.paid_at || p.created_at }))).catch(() => {}));
      } else {
        jobs.push(sb.from('leads').select('name, email, phone, message, intent, score, status, created_at')
          .ilike('phone', `%${phone}%`).order('created_at', { ascending: false }).limit(10)
          .then(r => (r.data || []).forEach(l => events.push({ type: 'lead', title: 'Lead captured — score ' + (l.score || '?'), detail: l.message || l.intent || '', at: l.created_at }))).catch(() => {}));
        jobs.push(sb.from('bookings').select('client_name, client_email, booking_date, booking_time, status, price, payment_status, created_at')
          .ilike('client_phone', `%${phone}%`).order('created_at', { ascending: false }).limit(20)
          .then(r => (r.data || []).forEach(b => events.push({ type: 'booking', title: 'Booking ' + (b.booking_date || '') + ' ' + (b.booking_time || '') + ' — ' + (b.status || 'pending'), detail: '₦' + (b.price || 0) + ' · payment: ' + (b.payment_status || 'unpaid'), at: b.created_at }))).catch(() => {}));
      }
      await Promise.all(jobs);
      events.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
      return res.status(200).json({ events: events.slice(0, 50) });
    }

    // ── CREATE / UPDATE CONTACT ──
    if (req.method === 'POST' && action === 'contact') {
      const c = body.contact || body;
      if (!c.name) return res.status(400).json({ error: 'name required' });
      if (c.id) {
        const { data, error } = await sb.from('clients').update({
          name: c.name, email: c.email || null, phone: c.phone || null,
          whatsapp: c.whatsapp || c.phone || null, notes: c.notes || null
        }).eq('id', c.id).select();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true, contact: (data || [])[0] });
      }
      const { data, error } = await sb.from('clients').insert({
        business_id: businessId, name: c.name, email: c.email || null,
        phone: c.phone || null, whatsapp: c.whatsapp || c.phone || null,
        notes: c.notes || null
      }).select();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, contact: (data || [])[0] });
    }

    // ── CREATE DEAL ──
    if (req.method === 'POST' && action === 'deal') {
      const d = body.deal || body;
      if (!d.title && !d.name) return res.status(400).json({ error: 'title required' });
      const row = dealRow(d, businessId);
      const { data, error } = await sb.from('transactions').insert(row).select();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, deal: parseDeal((data || [])[0] || {}) });
    }

    // ── MOVE DEAL ──
    if (req.method === 'POST' && action === 'stage') {
      const id = body.id || req.query.id;
      const stage = STAGES.includes(body.stage) ? body.stage : 'lead';
      const existing = await sb.from('transactions').select('*').eq('id', id).single();
      if (!existing.data) return res.status(404).json({ error: 'deal not found' });
      const d = parseDeal(existing.data);
      const row = dealRow({ ...d, stage }, businessId);
      const { error } = await sb.from('transactions').update({
        category: row.category, description: row.description, date: row.date
      }).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, deal: { ...d, stage } });
    }

    // ── DELETE DEAL ──
    if (req.method === 'POST' && action === 'delete_deal') {
      const id = body.id || req.query.id;
      const { error } = await sb.from('transactions').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    // ── ADD NOTE ──
    if (req.method === 'POST' && action === 'note') {
      const id = body.id || req.query.id;
      const text = (body.note || '').trim();
      if (!id || !text) return res.status(400).json({ error: 'id and note required' });
      const { data } = await sb.from('clients').select('notes').eq('id', id).single();
      const stamped = '[' + new Date().toISOString().slice(0, 10) + '] ' + text;
      const newNotes = data && data.notes ? data.notes + '\n' + stamped : stamped;
      const { error } = await sb.from('clients').update({ notes: newNotes }).eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, notes: newNotes });
    }

    // ── CONVERT LEAD → CONTACT + DEAL ──
    if (req.method === 'POST' && action === 'convert_lead') {
      const leadId = body.lead_id;
      if (!leadId) return res.status(400).json({ error: 'lead_id required' });
      const leadRes = await sb.from('leads').select('*').eq('id', leadId).single();
      const lead = leadRes.data;
      if (!lead) return res.status(404).json({ error: 'lead not found' });

      const cRes = await sb.from('clients').insert({
        business_id: lead.business_id || businessId,
        name: lead.name || lead.contact_name || 'Unknown',
        email: lead.email || null, phone: lead.phone || null,
        notes: '[' + new Date().toISOString().slice(0, 10) + '] Converted from lead (' + (lead.source || 'discovery') + ', score ' + (lead.score || '?') + ')'
      }).select();
      const contact = (cRes.data || [])[0];

      const row = dealRow({
        title: (lead.name || 'New lead') + ' — ' + (lead.intent || 'follow up'),
        amount: body.amount || 0, stage: 'lead',
        contact_id: contact ? contact.id : null,
        contact_name: lead.name || '', email: lead.email || '', phone: lead.phone || '',
        notes: lead.message || ''
      }, lead.business_id || businessId);
      const dRes = await sb.from('transactions').insert(row).select();

      await sb.from('leads').update({ status: 'converted', contacted: true }).eq('id', leadId);
      return res.status(200).json({ success: true, contact, deal: dRes.data ? parseDeal(dRes.data[0]) : null });
    }

    // ── IMPORTABLE LEADS ──
    if (req.method === 'GET' && action === 'importable_leads') {
      const { data } = await sb.from('leads').select('id, name, email, phone, intent, score, status, source, created_at')
        .neq('status', 'converted').order('created_at', { ascending: false }).limit(100);
      return res.status(200).json({ leads: data || [] });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
