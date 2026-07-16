// ========================================
// ERGIO Invoice Generator
// Creates professional invoices with PDF-ready HTML
// ========================================

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY, GROQ_API_KEY } = process.env;
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action') || 'create';

    // ---- LIST INVOICES ----
    if (req.method === 'GET' && action === 'list') {
      if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Supabase not configured' });
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const businessId = url.searchParams.get('business_id');

      let query = sb.from('invoices').select('*').order('created_at', { ascending: false }).limit(50);
      if (businessId) query = query.eq('business_id', businessId);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ invoices: data || [] });
    }

    // ---- CREATE INVOICE ----
    if (req.method === 'POST' && action === 'create') {
      const { business_name, business_logo, client_name, client_email, client_phone, items, notes, due_date, tax_rate } = body;

      if (!client_name || !items || !items.length) {
        return res.status(400).json({ error: 'Client name and items required' });
      }

      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const tax = tax_rate ? subtotal * (tax_rate / 100) : 0;
      const total = subtotal + tax;

      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const createdAt = new Date().toISOString();
      const dueDate = due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      // Save to Supabase if configured
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        await sb.from('invoices').insert({
          invoice_number: invoiceNumber,
          business_name: business_name || 'My Business',
          client_name,
          client_email,
          client_phone,
          items,
          subtotal,
          tax,
          total,
          status: 'pending',
          due_date: dueDate,
          notes,
          created_at: createdAt
        });
      }

      // Generate HTML invoice (PDF-ready via browser print)
      const itemsHtml = items.map((item, i) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="font-weight:600;color:#F8FAFC;">${item.name}</div>
            ${item.description ? `<div style="font-size:13px;color:#94A3B8;margin-top:2px;">${item.description}</div>` : ''}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:center;color:#94A3B8;">${item.quantity}</td>
          <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:right;color:#94A3B8;">₦${item.price.toLocaleString()}</td>
          <td style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:right;font-weight:600;color:#00D9FF;">₦${(item.quantity * item.price).toLocaleString()}</td>
        </tr>
      `).join('');

      const invoiceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice ${invoiceNumber}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#09090B;color:#F8FAFC;padding:40px 20px}
  .invoice{max-width:680px;margin:0 auto;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden}
  .header{padding:40px;background:linear-gradient(135deg,rgba(0,217,255,0.08),rgba(0,255,157,0.05));border-bottom:1px solid rgba(255,255,255,0.08)}
  .logo{font-size:24px;font-weight:800;background:linear-gradient(135deg,#00D9FF,#00FF9D);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .invoice-num{font-size:14px;color:#94A3B8;margin-top:4px}
  .body{padding:40px}
  .row{display:flex;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px}
  .label{font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
  .value{font-size:16px;font-weight:600}
  table{width:100%;border-collapse:collapse;margin-bottom:32px}
  th{text-align:left;padding:12px 16px;border-bottom:2px solid rgba(255,255,255,0.1);font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:1px}
  th:nth-child(2){text-align:center}
  th:nth-child(3),th:nth-child(4){text-align:right}
  .totals{margin-left:auto;width:280px}
  .total-row{display:flex;justify-content:space-between;padding:8px 0}
  .total-final{border-top:2px solid rgba(0,217,255,0.3);margin-top:8px;padding-top:16px;font-size:22px;font-weight:800}
  .total-final span:last-child{color:#00D9FF}
  .footer{padding:32px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;color:#64748B;font-size:13px}
  .pay-btn{display:inline-block;margin-top:20px;padding:12px 32px;background:linear-gradient(135deg,#00D9FF,#00FF9D);color:#09090B;font-weight:700;border-radius:12px;text-decoration:none}
  .badge{display:inline-block;padding:4px 12px;border-radius:8px;font-size:12px;font-weight:600;margin-bottom:16px}
  .badge-pending{background:rgba(255,200,0,0.15);color:#FFC800}
  @media print{body{background:#fff;padding:0}.invoice{border:none}}
</style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="logo">${business_logo ? `<img src="${business_logo}" style="height:40px;margin-bottom:8px">` : business_name || 'ERGIO'}</div>
      <div class="invoice-num">${invoiceNumber}</div>
      <span class="badge badge-pending">Pending Payment</span>
    </div>
    <div class="body">
      <div class="row">
        <div>
          <div class="label">From</div>
          <div class="value">${business_name || 'My Business'}</div>
        </div>
        <div>
          <div class="label">Bill To</div>
          <div class="value">${client_name}</div>
          ${client_email ? `<div style="font-size:14px;color:#94A3B8;margin-top:4px">${client_email}</div>` : ''}
          ${client_phone ? `<div style="font-size:14px;color:#94A3B8">${client_phone}</div>` : ''}
        </div>
        <div>
          <div class="label">Due Date</div>
          <div class="value">${dueDate}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="totals">
        <div class="total-row"><span style="color:#94A3B8">Subtotal</span><span>₦${subtotal.toLocaleString()}</span></div>
        ${tax > 0 ? `<div class="total-row"><span style="color:#94A3B8">Tax (${tax_rate}%)</span><span>₦${tax.toLocaleString()}</span></div>` : ''}
        <div class="total-row total-final"><span>Total</span><span>₦${total.toLocaleString()}</span></div>
      </div>
      ${notes ? `<div style="margin-top:24px;padding:16px;background:rgba(0,217,255,0.05);border-radius:12px;color:#94A3B8;font-size:14px">${notes}</div>` : ''}
    </div>
    <div class="footer">
      <p>Generated by ERGIO — Your business, automated.</p>
      <a href="#" class="pay-btn">Pay ₦${total.toLocaleString()}</a>
    </div>
  </div>
</body>
</html>`;

      return res.status(200).json({
        success: true,
        invoice: {
          number: invoiceNumber,
          subtotal,
          tax,
          total,
          due_date: dueDate,
          status: 'pending'
        },
        html: invoiceHtml,
        print_url: `data:text/html;base64,${Buffer.from(invoiceHtml).toString('base64')}`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Invoice error:', err);
    return res.status(500).json({ error: err.message });
  }
};
