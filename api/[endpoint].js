// ========================================
// ERGIO API — Single Catch-All Handler
// Routes all /api/* requests to the correct handler
// ========================================

import auth from '../ergio/api/auth.js';
import engines from '../ergio/api/engines.js';
import business from '../ergio/api/business.js';
import bookings from '../ergio/api/bookings.js';
import payments from '../ergio/api/payments.js';
import generate from '../ergio/api/generate.js';
import leads from '../ergio/api/leads.js';
import outreach from '../ergio/api/outreach.js';
import reviews from '../ergio/api/reviews.js';
import referrals from '../ergio/api/referrals.js';
import seo from '../ergio/api/seo.js';
import analytics from '../ergio/api/analytics.js';
import notifications from '../ergio/api/notifications.js';
import card from '../ergio/api/card.js';
import expenses from '../ergio/api/expenses.js';
import invoices from '../ergio/api/invoices.js';
import smartPricing from '../ergio/api/smart-pricing.js';
import social from '../ergio/api/social.js';
import upload from '../ergio/api/upload.js';
import whatsapp from '../ergio/api/whatsapp.js';
import refine from '../ergio/api/refine.js';
import transform from '../ergio/api/transform.js';

const handlers = {
  auth, engines, business, bookings, payments, generate,
  leads, outreach, reviews, referrals, seo, analytics,
  notifications, card, expenses, invoices,
  'smart-pricing': smartPricing, social, upload, whatsapp, refine,
  transform
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // The endpoint is extracted by Vercel's dynamic routing from [endpoint].js
  const endpoint = req.query.endpoint || '';
  
  const handler = handlers[endpoint];
  if (handler) {
    return handler(req, res);
  }

  return res.status(200).json({
    name: 'ERGIO API',
    version: '3.0',
    endpoints: Object.keys(handlers).map(e => `/api/${e}`),
    requested: endpoint || '(none)',
  });
}
